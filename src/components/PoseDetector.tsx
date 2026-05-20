"use client";

import { useEffect, useRef, useState } from "react";
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
  const [score, setScore] = useState(100);

  // We will store states for the exercise logic
  const exerciseState = useRef({
    isDown: false,
    repCount: 0,
  });

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
        }
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(predictWebcam);
    };

    const processExercise = (landmarks: any[]) => {
      // 11: left_shoulder, 13: left_elbow, 15: left_wrist
      // 12: right_shoulder, 14: right_elbow, 16: right_wrist
      
      // Simple logic to calculate angle
      const calculateAngle = (a: any, b: any, c: any) => {
        const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
        let angle = Math.abs((radians * 180.0) / Math.PI);
        if (angle > 180.0) angle = 360 - angle;
        return angle;
      };

      if (exercise === "pushup") {
        const leftShoulder = landmarks[11];
        const leftElbow = landmarks[13];
        const leftWrist = landmarks[15];

        if (leftShoulder && leftElbow && leftWrist) {
          const angle = calculateAngle(leftShoulder, leftElbow, leftWrist);
          
          if (angle > 160) {
            if (exerciseState.current.isDown) {
              exerciseState.current.repCount += 1;
              setReps(exerciseState.current.repCount);
              exerciseState.current.isDown = false;
              setFeedback("Good! Keep going.");
            } else {
              setFeedback("Go down.");
            }
          } else if (angle < 90) {
            exerciseState.current.isDown = true;
            setFeedback("Push up!");
          }
        }
      } else if (exercise === "benchpress") {
        // Similar logic for bench press
        const rightShoulder = landmarks[12];
        const rightElbow = landmarks[14];
        const rightWrist = landmarks[16];

        if (rightShoulder && rightElbow && rightWrist) {
          const angle = calculateAngle(rightShoulder, rightElbow, rightWrist);
          
          if (angle > 160) {
            if (exerciseState.current.isDown) {
              exerciseState.current.repCount += 1;
              setReps(exerciseState.current.repCount);
              exerciseState.current.isDown = false;
              setFeedback("Good! Keep going.");
            } else {
              setFeedback("Lower the bar.");
            }
          } else if (angle < 90) {
            exerciseState.current.isDown = true;
            setFeedback("Press up!");
          }
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
  }, [exercise]);

  const handleFinishWorkout = async () => {
    if (reps === 0) {
      alert("No reps completed!");
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert("Please login to save your workout.");
        return;
      }

      const { error } = await supabase.from('workouts').insert([
        {
          user_id: session.user.id,
          exercise_type: exercise,
          reps: reps,
          weight: 0, // In a real app, pass weight via props
          score: score
        }
      ]);

      if (error) throw error;
      alert("Workout saved successfully!");
      window.location.href = "/leaderboard";
    } catch (error: any) {
      console.error("Error saving workout:", error.message);
      alert("Failed to save workout: " + error.message);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white font-sans">
      <header className="absolute top-0 z-50 w-full p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <Link href="/workout" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors backdrop-blur-md bg-black/30 px-4 py-2 rounded-full border border-white/10">
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Back</span>
        </Link>
        <div className="flex items-center gap-4">
          <div className="backdrop-blur-md bg-black/50 px-6 py-2 rounded-full border border-white/10">
            <span className="text-slate-400 text-sm uppercase tracking-wider font-bold mr-2">Reps</span>
            <span className="text-3xl font-extrabold text-indigo-400">{reps}</span>
          </div>
          <div className="backdrop-blur-md bg-black/50 px-6 py-2 rounded-full border border-white/10">
            <span className="text-slate-400 text-sm uppercase tracking-wider font-bold mr-2">Score</span>
            <span className="text-3xl font-extrabold text-green-400">{score}</span>
          </div>
          <button 
            onClick={handleFinishWorkout}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-indigo-500/30 transition-all border border-indigo-400/50"
          >
            Finish
          </button>
        </div>
      </header>

      <main className="flex-1 relative flex items-center justify-center overflow-hidden">
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-400">Loading AI Models...</p>
            </div>
          </div>
        )}
        
        <div className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
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

          {/* Feedback Overlay */}
          <div className="absolute bottom-10 left-0 right-0 flex justify-center">
            <div className={`backdrop-blur-md bg-black/60 px-8 py-4 rounded-2xl border-2 transition-colors ${
              feedback.includes("Good") ? "border-green-500/50 text-green-400" : 
              feedback.includes("Position") ? "border-white/20 text-white" : "border-amber-500/50 text-amber-400"
            }`}>
              <h2 className="text-2xl font-bold tracking-tight">{feedback}</h2>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
