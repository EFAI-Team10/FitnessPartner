"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface PoseDetectorProps {
  exercise: "pushup" | "benchpress";
}

export default function PoseDetector({ exercise }: PoseDetectorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [reps, setReps] = useState(0);
  const [feedback, setFeedback] = useState("Position yourself in front of the camera");
  const [score] = useState(100);

  // Status state and ref to prevent stale closures inside requestAnimationFrame
  const [status, setStatus] = useState<'detecting' | 'preparing' | 'active' | 'saving' | 'completed'>('detecting');
  const statusRef = useRef<'detecting' | 'preparing' | 'active' | 'saving' | 'completed'>('detecting');

  // We will store states for the exercise logic
  const exerciseState = useRef({
    isDown: false,
    repCount: 0,
  });

  // Pose verification/auto-stop refs
  const startPoseStartTimestamp = useRef<number | null>(null);
  const visibilityLossStartRef = useRef<number | null>(null);
  const uprightStartTimestamp = useRef<number | null>(null);
  const lastRepTimestamp = useRef<number>(0);
  const isSavingRef = useRef<boolean>(false);

  const updateStatus = (newStatus: 'detecting' | 'preparing' | 'active' | 'saving' | 'completed') => {
    statusRef.current = newStatus;
    setStatus(newStatus);
  };

  // Helper to save workout session to database
  const saveWorkout = useCallback(async (repCount: number) => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    updateStatus('saving');
    setFeedback("Saving workout...");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setFeedback("Please login to save your workout.");
        updateStatus('completed');
        return;
      }

      const { error } = await supabase.from('workouts').insert([
        {
          user_id: session.user.id,
          exercise_type: exercise,
          reps: repCount,
          weight: 0, 
          score: score
        }
      ]);

      if (error) throw error;
      setFeedback("Workout saved successfully!");
      updateStatus('completed');
      
      setTimeout(() => {
        window.location.href = "/leaderboard";
      }, 1500);
    } catch (error: any) {
      console.error("Error saving workout:", error.message);
      setFeedback("Failed to save: " + error.message);
      updateStatus('completed');
    }
  }, [exercise, score]);

  // Handler for auto stop trigger
  const triggerAutoFinish = useCallback(() => {
    const finalReps = exerciseState.current.repCount;
    if (finalReps > 0) {
      saveWorkout(finalReps);
    } else {
      updateStatus('completed');
      setFeedback("Workout ended: 0 reps completed.");
    }
  }, [saveWorkout]);

  // Manual finish handler
  const handleFinishWorkout = useCallback(() => {
    const finalReps = exerciseState.current.repCount;
    if (finalReps === 0) {
      updateStatus('completed');
      setFeedback("Workout ended: 0 reps completed.");
      return;
    }
    saveWorkout(finalReps);
  }, [saveWorkout]);

  useEffect(() => {
    let poseLandmarker: PoseLandmarker | null = null;
    let animationFrameId: number;
    let lastVideoTime = -1;

    const initializeMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numPoses: 1
        });
        
        setIsLoaded(true);
        startCamera();
      } catch (error) {
        console.error("Error initializing MediaPipe:", error);
      }
    };

    const startCamera = async () => {
      if (videoRef.current) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 1280, height: 720 },
            audio: false,
          });
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener("loadeddata", predictWebcam);
        } catch (err) {
          console.error("Error accessing webcam:", err);
          setFeedback("Error accessing webcam. Please check permissions.");
        }
      }
    };

    const predictWebcam = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (!video || !canvas || !poseLandmarker) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      let startTimeMs = performance.now();
      if (lastVideoTime !== video.currentTime) {
        lastVideoTime = video.currentTime;
        const results = poseLandmarker.detectForVideo(video, startTimeMs);

        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (results.landmarks && results.landmarks.length > 0) {
          const landmarks = results.landmarks[0];
          
          // Draw landmarks
          ctx.fillStyle = "#4f46e5"; // indigo-600
          for (const landmark of landmarks) {
            ctx.beginPath();
            ctx.arc(landmark.x * canvas.width, landmark.y * canvas.height, 5, 0, 2 * Math.PI);
            ctx.fill();
          }
          
          // Process exercise logic
          processExercise(landmarks);
        } else {
          // Pass empty array to let the loop process visibility loss and idle timers
          processExercise([]);
        }
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(predictWebcam);
    };

    const processExercise = (landmarks: any[]) => {
      const calculateAngle = (a: any, b: any, c: any) => {
        const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
        let angle = Math.abs((radians * 180.0) / Math.PI);
        if (angle > 180.0) angle = 360 - angle;
        return angle;
      };

      const currentStatus = statusRef.current;

      // Handle completely empty landmarks (visibility lost)
      if (!landmarks || landmarks.length === 0) {
        if (currentStatus === 'active') {
          if (visibilityLossStartRef.current === null) {
            visibilityLossStartRef.current = Date.now();
          }
          const timeLost = Date.now() - visibilityLossStartRef.current;
          if (timeLost > 2500) {
            setFeedback("User out of frame. Stopping workout.");
            triggerAutoFinish();
          } else {
            const remaining = Math.max(0, Math.ceil((2500 - timeLost) / 1000));
            setFeedback(`Out of frame... Auto-stopping in ${remaining}s`);
          }
        } else if (currentStatus === 'preparing') {
          updateStatus('detecting');
          startPoseStartTimestamp.current = null;
          setFeedback("Position yourself in front of the camera");
        } else if (currentStatus === 'detecting') {
          setFeedback("Position yourself in front of the camera");
        }
        return;
      }

      // Check full body visibility
      // Pushups: Left (11, 13, 15, 23, 25, 27) or Right (12, 14, 16, 24, 26, 28)
      // Benchpress: Left (11, 13, 15, 23, 25) or Right (12, 14, 16, 24, 26)
      const leftKeypoints = exercise === "pushup" 
        ? [11, 13, 15, 23, 25, 27] 
        : [11, 13, 15, 23, 25];
      const rightKeypoints = exercise === "pushup" 
        ? [12, 14, 16, 24, 26, 28] 
        : [12, 14, 16, 24, 26];

      const checkSideVisible = (kpIndices: number[]) => {
        return kpIndices.every(idx => {
          const pt = landmarks[idx];
          return pt && pt.visibility !== undefined && pt.visibility > 0.45;
        });
      };

      const leftVisible = checkSideVisible(leftKeypoints);
      const rightVisible = checkSideVisible(rightKeypoints);
      
      let visibleSide: 'left' | 'right' | 'none' = 'none';
      if (leftVisible && rightVisible) {
        const avgLeftVis = leftKeypoints.reduce((acc, idx) => acc + (landmarks[idx]?.visibility || 0), 0) / leftKeypoints.length;
        const avgRightVis = rightKeypoints.reduce((acc, idx) => acc + (landmarks[idx]?.visibility || 0), 0) / rightKeypoints.length;
        visibleSide = avgLeftVis >= avgRightVis ? 'left' : 'right';
      } else if (leftVisible) {
        visibleSide = 'left';
      } else if (rightVisible) {
        visibleSide = 'right';
      }

      if (currentStatus === 'detecting') {
        if (visibleSide !== 'none') {
          updateStatus('preparing');
          startPoseStartTimestamp.current = null;
          setFeedback("Hold starting position...");
        } else {
          setFeedback("Position your entire body in the camera frame");
        }
      } else if (currentStatus === 'preparing') {
        if (visibleSide === 'none') {
          updateStatus('detecting');
          startPoseStartTimestamp.current = null;
          setFeedback("Position your entire body in the camera frame");
        } else {
          // Check starting pose: arms extended
          const shoulder = visibleSide === 'left' ? landmarks[11] : landmarks[12];
          const elbow = visibleSide === 'left' ? landmarks[13] : landmarks[14];
          const wrist = visibleSide === 'left' ? landmarks[15] : landmarks[16];
          
          const elbowAngle = calculateAngle(shoulder, elbow, wrist);
          
          if (elbowAngle > 150) {
            if (startPoseStartTimestamp.current === null) {
              startPoseStartTimestamp.current = Date.now();
            }
            const elapsed = Date.now() - startPoseStartTimestamp.current;
            if (elapsed >= 1500) {
              exerciseState.current.repCount = 0;
              exerciseState.current.isDown = false;
              setReps(0);
              lastRepTimestamp.current = Date.now();
              visibilityLossStartRef.current = null;
              uprightStartTimestamp.current = null;
              updateStatus('active');
              setFeedback("Workout Active! Start reps.");
            } else {
              const remaining = Math.max(0, Math.ceil((1500 - elapsed) / 100)) / 10;
              setFeedback(`Hold starting position (${remaining}s)`);
            }
          } else {
            startPoseStartTimestamp.current = null;
            setFeedback("Extend your arms completely to start");
          }
        }
      } else if (currentStatus === 'active') {
        if (visibleSide === 'none') {
          if (visibilityLossStartRef.current === null) {
            visibilityLossStartRef.current = Date.now();
          }
          const timeLost = Date.now() - visibilityLossStartRef.current;
          if (timeLost > 2500) {
            setFeedback("User out of frame. Stopping workout.");
            triggerAutoFinish();
          } else {
            const remaining = Math.max(0, Math.ceil((2500 - timeLost) / 1000));
            setFeedback(`Out of frame... Auto-stopping in ${remaining}s`);
          }
          return;
        }

        // Reset visibility loss timer
        visibilityLossStartRef.current = null;

        // 1. Rep counting logic
        const shoulder = visibleSide === 'left' ? landmarks[11] : landmarks[12];
        const elbow = visibleSide === 'left' ? landmarks[13] : landmarks[14];
        const wrist = visibleSide === 'left' ? landmarks[15] : landmarks[16];
        const hip = visibleSide === 'left' ? landmarks[23] : landmarks[24];

        const elbowAngle = calculateAngle(shoulder, elbow, wrist);

        if (elbowAngle > 155) {
          if (exerciseState.current.isDown) {
            exerciseState.current.repCount += 1;
            setReps(exerciseState.current.repCount);
            exerciseState.current.isDown = false;
            lastRepTimestamp.current = Date.now();
            setFeedback("Good! Keep going.");
          }
        } else if (elbowAngle < 95) {
          exerciseState.current.isDown = true;
          setFeedback(exercise === "pushup" ? "Push up!" : "Press up!");
        }

        // 2. Upright posture auto-stop check
        if (shoulder && hip) {
          const dy = Math.abs(shoulder.y - hip.y);
          const dx = Math.abs(shoulder.x - hip.x);
          
          if (dy > 0.35 && dx < 0.15) {
            if (uprightStartTimestamp.current === null) {
              uprightStartTimestamp.current = Date.now();
            }
            const timeUpright = Date.now() - uprightStartTimestamp.current;
            if (timeUpright > 2000) {
              setFeedback("Upright posture detected. Finishing workout.");
              triggerAutoFinish();
              return;
            } else {
              setFeedback("Stay in position! Auto-stop in 2s");
            }
          } else {
            uprightStartTimestamp.current = null;
          }
        }

        // 3. Stationary/No-rep auto-stop check (5 seconds limit)
        const idleTime = Date.now() - lastRepTimestamp.current;
        if (idleTime > 5000) {
          setFeedback("Stationary timeout. Finishing...");
          triggerAutoFinish();
          return;
        } else if (idleTime > 3000) {
          const remaining = Math.max(0, Math.ceil((5000 - idleTime) / 1000));
          setFeedback(`Idle... Auto-stopping in ${remaining}s`);
        }
      }
    };

    initializeMediaPipe();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
      if (poseLandmarker) {
        poseLandmarker.close();
      }
    };
  }, [exercise, saveWorkout, triggerAutoFinish]);

  return (
    <div className="flex flex-1 flex-col bg-slate-950 text-white font-sans min-h-[calc(100vh-4rem)]">
      {/* Mobile-optimized Header */}
      <header className="absolute top-0 z-50 w-full p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <Link href="/workout" className="flex items-center gap-1 text-slate-300 hover:text-white transition-colors backdrop-blur-md bg-black/40 px-3 py-1.5 rounded-full border border-white/10 text-xs">
          <ArrowLeft className="h-4 w-4" />
          <span className="font-semibold">Back</span>
        </Link>
        {status !== 'saving' && status !== 'completed' && (
          <button 
            onClick={handleFinishWorkout}
            className="bg-indigo-650 hover:bg-indigo-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-md shadow-indigo-500/20 transition-all border border-indigo-400/40"
          >
            Finish
          </button>
        )}
      </header>

      {/* Floating Status Bar for Reps & Score */}
      <div className="absolute top-16 left-4 right-4 z-40 flex gap-3">
        <div className="flex-1 backdrop-blur-md bg-black/60 px-4 py-2 rounded-xl border border-white/5 flex items-center justify-between shadow-lg">
          <span className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">Reps</span>
          <span className="text-2xl font-extrabold text-indigo-400">{reps}</span>
        </div>
        <div className="flex-1 backdrop-blur-md bg-black/60 px-4 py-2 rounded-xl border border-white/5 flex items-center justify-between shadow-lg">
          <span className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">Score</span>
          <span className="text-2xl font-extrabold text-green-400">{score}</span>
        </div>
      </div>

      <main className="flex-1 relative flex items-center justify-center overflow-hidden px-4">
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-xs text-slate-450">Loading AI Models...</p>
            </div>
          </div>
        )}
        
        <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-white/10 shadow-2xl">
          <video 
            ref={videoRef} 
            className="absolute inset-0 w-full h-full object-cover transform -scale-x-100" 
            autoPlay 
            playsInline
            muted
          ></video>
          <canvas 
            ref={canvasRef} 
            className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
          ></canvas>

          {/* Dynamic Status Overlays */}
          {status === 'detecting' && (
            <div className="absolute inset-0 border-2 border-indigo-500/30 flex flex-col items-center justify-center bg-indigo-950/10 backdrop-brightness-75 pointer-events-none">
              <div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-pulse" style={{ animationDuration: '2s' }}></div>
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-black/60 border border-indigo-500/20 backdrop-blur-md">
                <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider animate-pulse">Scanning for User...</p>
              </div>
            </div>
          )}

          {status === 'preparing' && (
            <div className="absolute inset-0 border-2 border-amber-500/30 flex flex-col items-center justify-center bg-amber-950/10 backdrop-brightness-90 pointer-events-none">
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-black/60 border border-amber-500/20 backdrop-blur-md">
                <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">Ready Starting Position...</p>
              </div>
            </div>
          )}

          {status === 'active' && (
            <div className="absolute inset-0 border-2 border-green-500/40 pointer-events-none shadow-[inset_0_0_15px_rgba(34,197,94,0.15)]"></div>
          )}

          {status === 'saving' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md z-50">
              <div className="flex flex-col items-center text-center p-6 max-w-xs">
                <div className="relative w-16 h-16 mb-4">
                  <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Analyzing Form</h3>
                <p className="text-xs text-slate-400">Saving your workout record to leaderboard...</p>
              </div>
            </div>
          )}

          {status === 'completed' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md z-50 p-6">
              <div className="flex flex-col items-center text-center max-w-sm">
                {reps > 0 ? (
                  <>
                    <div className="w-12 h-12 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">Workout Saved!</h3>
                    <p className="text-xs text-slate-400 mb-4">{reps} reps of {exercise === 'pushup' ? 'Push-up' : 'Bench Press'}</p>
                    <span className="text-[10px] text-indigo-400 font-semibold tracking-wider animate-pulse">Redirecting to Leaderboard...</span>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Workout Ended</h3>
                    <p className="text-xs text-slate-450 mb-6 px-4">No reps were completed. Please assume the starting pose to begin counting.</p>
                    <div className="flex gap-3 w-full px-4">
                      <button
                        onClick={() => {
                          exerciseState.current.repCount = 0;
                          exerciseState.current.isDown = false;
                          setReps(0);
                          updateStatus('detecting');
                        }}
                        className="flex-1 bg-indigo-650 hover:bg-indigo-650 text-white py-2 rounded-xl text-xs font-bold transition-all border border-indigo-400/40"
                      >
                        Try Again
                      </button>
                      <Link
                        href="/workout"
                        className="flex-1 bg-slate-850 hover:bg-slate-800 text-slate-300 py-2 rounded-xl text-xs font-bold text-center border border-slate-700 flex items-center justify-center"
                      >
                        Go Back
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Feedback Overlay */}
          <div className="absolute bottom-6 left-4 right-4 flex justify-center">
            <div className={`backdrop-blur-md bg-black/70 px-5 py-3 rounded-xl border transition-all duration-300 text-center ${
              feedback.includes("Good") ? "border-green-500/40 text-green-400" : 
              feedback.includes("Position") || feedback.includes("Scanning") ? "border-white/10 text-white" : 
              feedback.includes("Active") ? "border-indigo-500/40 text-indigo-400 font-extrabold" : "border-amber-500/40 text-amber-400 animate-pulse"
            }`}>
              <h2 className="text-xs font-bold tracking-wide uppercase">{feedback}</h2>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

