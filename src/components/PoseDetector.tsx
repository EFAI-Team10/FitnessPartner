"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { PoseLandmarker } from "@mediapipe/tasks-vision";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getBaseline } from "@/lib/baseline/registry";
import { createPoseLandmarker, resultToFrame, pickModelVariant } from "@/lib/pose/mediapipe";
import { computeJointAngles } from "@/lib/pose/features";
import { RepSegmenter } from "@/lib/pose/segmenter";
import { frameGuidance } from "@/lib/coach/realtimeGuide";
import { scoreRep, type ScoreResult } from "@/lib/coach/scoring";
import { hintFromWorstJoint } from "@/lib/coach/defectMessages";
import SkeletonOverlay from "./SkeletonOverlay";
import FormHud from "./FormHud";
import type { JointName, Landmark2D } from "@/types/exercise";

interface PoseDetectorProps {
  baselineId: string;
}

export default function PoseDetector({ baselineId }: PoseDetectorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [reps, setReps] = useState(0);
  const [feedback, setFeedback] = useState("Position yourself in front of the camera");

  const baseline = getBaseline(baselineId);

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

  // Phase 1 real-time coaching states
  const currentRepAngles = useRef<Partial<Record<JointName, number[]>>>({});
  const [repScores, setRepScores] = useState<number[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const [phase, setPhase] = useState(0);
  const [deviations, setDeviations] = useState<Partial<Record<JointName, number>>>({});
  const [overlayLandmarks, setOverlayLandmarks] = useState<Landmark2D[] | null>(null);

  const updateStatus = (newStatus: 'detecting' | 'preparing' | 'active' | 'saving' | 'completed') => {
    statusRef.current = newStatus;
    setStatus(newStatus);
  };

  // Helper to save workout session to database
  const saveWorkout = useCallback(async (repCount: number) => {
    if (isSavingRef.current) return;
    if (!baseline) return;
    isSavingRef.current = true;
    updateStatus('saving');
    setFeedback("Saving workout...");

    const avgScore = repScores.length ? Math.round(repScores.reduce((a, b) => a + b, 0) / repScores.length) : 0;

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
          exercise_type: baseline.exercise_family,
          baseline_id: baseline.id,
          reps: repCount,
          weight: 0, 
          score: avgScore,
          rep_scores: repScores,
          defects: {},
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
  }, [baseline, repScores]);

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
    if (!baseline) return;

    let poseLandmarker: PoseLandmarker | null = null;
    let animationFrameId: number;
    let lastVideoTime = -1;

    const segmenter = new RepSegmenter({
      topThreshold: baseline.rule_thresholds.elbow_top_min,
      bottomThreshold: baseline.rule_thresholds.elbow_bottom_max,
    });

    const initializeMediaPipe = async () => {
      try {
        poseLandmarker = await createPoseLandmarker(pickModelVariant());
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
      
      if (!video || !poseLandmarker) return;

      let startTimeMs = performance.now();
      if (lastVideoTime !== video.currentTime) {
        lastVideoTime = video.currentTime;
        const results = poseLandmarker.detectForVideo(video, startTimeMs);

        const frame = resultToFrame(results, startTimeMs);

        if (frame) {
          setOverlayLandmarks(frame.landmarks2D);
          // Process exercise logic
          processExercise(frame);
        } else {
          setOverlayLandmarks(null);
          // Pass null to let the loop process visibility loss and idle timers
          processExercise(null);
        }
      }

      animationFrameId = requestAnimationFrame(predictWebcam);
    };

    const processExercise = (frame: any) => {
      const currentStatus = statusRef.current;

      // Handle completely empty landmarks (visibility lost)
      if (!frame || !frame.landmarks2D || frame.landmarks2D.length === 0) {
        setDeviations({});
        setPhase(0);
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

      const landmarks = frame.landmarks2D;

      // Check full body visibility
      // Pushups: Left (11, 13, 15, 23, 25, 27) or Right (12, 14, 16, 24, 26, 28)
      // Benchpress: Left (11, 13, 15, 23, 25) or Right (12, 14, 16, 24, 26)
      const leftKeypoints = baseline.exercise_family === "pushup" 
        ? [11, 13, 15, 23, 25, 27] 
        : [11, 13, 15, 23, 25];
      const rightKeypoints = baseline.exercise_family === "pushup" 
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

      if (visibleSide === 'none') {
        setDeviations({});
        setPhase(0);
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

      // Reset visibility loss timer
      visibilityLossStartRef.current = null;

      // Extract angles
      const angles = computeJointAngles(frame);
      const elbowAngle = visibleSide === 'left'
        ? (angles.elbow_left ?? angles.elbow_right ?? NaN)
        : (angles.elbow_right ?? angles.elbow_left ?? NaN);

      if (currentStatus === 'detecting') {
        setDeviations({});
        setPhase(0);
        updateStatus('preparing');
        startPoseStartTimestamp.current = null;
        setFeedback("Hold starting position...");
      } else if (currentStatus === 'preparing') {
        setDeviations({});
        setPhase(0);
        if (elbowAngle > 150) {
          if (startPoseStartTimestamp.current === null) {
            startPoseStartTimestamp.current = Date.now();
          }
          const elapsed = Date.now() - startPoseStartTimestamp.current;
          if (elapsed >= 1500) {
            exerciseState.current.repCount = 0;
            exerciseState.current.isDown = false;
            setReps(0);
            setRepScores([]);
            currentRepAngles.current = {};
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
      } else if (currentStatus === 'active') {
        // 1) Accumulate per-rep angles
        for (const joint of baseline.joints_used) {
          const v = angles[joint];
          if (Number.isFinite(v)) {
            if (!currentRepAngles.current[joint]) currentRepAngles.current[joint] = [];
            currentRepAngles.current[joint]!.push(v as number);
          }
        }

        // 2) Real-time guidance (rule-based, no model)
        const g = frameGuidance(baseline, angles);
        setDeviations(g.deviations);
        setPhase(g.phase);

        // Hint: only show when ok=false to avoid spam
        if (!g.ok && g.worstJoint) {
          const series = baseline.trajectory[g.worstJoint]!;
          const idx = g.phase * (series.length - 1);
          const lo = Math.min(Math.floor(idx), series.length - 1);
          const exp = series[lo];
          const cur = angles[g.worstJoint]!;
          setHint(hintFromWorstJoint(g.worstJoint, cur - exp)?.message ?? null);
        } else {
          setHint(null);
        }

        // 3) Rep boundary
        const r = segmenter.push(performance.now(), elbowAngle);
        if (r.repCompleted) {
          exerciseState.current.repCount += 1;
          setReps(exerciseState.current.repCount);

          const userTraj = currentRepAngles.current;
          const result: ScoreResult = scoreRep(baseline, userTraj);
          setRepScores((prev) => [...prev, result.score]);

          currentRepAngles.current = {};
          lastRepTimestamp.current = Date.now();
          setFeedback("Good! Keep going.");
        } else if (elbowAngle < baseline.rule_thresholds.elbow_bottom_max) {
          setFeedback(baseline.exercise_family === "pushup" ? "Push up!" : "Press up!");
        }

        // 4. Upright posture auto-stop check
        const shoulder = visibleSide === 'left' ? landmarks[11] : landmarks[12];
        const hip = visibleSide === 'left' ? landmarks[23] : landmarks[24];
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

        // 5. Stationary/No-rep auto-stop check (5 seconds limit)
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
  }, [baselineId, saveWorkout, triggerAutoFinish, baseline]);

  if (!baseline) {
    return <div className="p-6 text-red-400">Unknown baseline: {baselineId}</div>;
  }

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

      <FormHud
        reps={reps}
        lastRepScore={repScores.length ? repScores[repScores.length - 1] : null}
        averageScore={repScores.length ? Math.round(repScores.reduce((a, b) => a + b, 0) / repScores.length) : null}
        hint={hint}
        phase={phase}
      />

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
          <SkeletonOverlay
            landmarks={overlayLandmarks}
            deviations={deviations}
            width={1280}
            height={720}
            className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
          />

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
                <p className="text-xs text-slate-440">Saving your workout record to leaderboard...</p>
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
                    <p className="text-xs text-slate-400 mb-4">{reps} reps of {baseline.exercise_family === 'pushup' ? 'Push-up' : 'Bench Press'}</p>
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
