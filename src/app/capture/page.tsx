// src/app/capture/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import CaptureControls, { type CaptureSettings } from "@/components/CaptureControls";
import { createPoseLandmarker, resultToFrame } from "@/lib/pose/mediapipe";
import { computeJointAngles } from "@/lib/pose/features";
import { RepSegmenter } from "@/lib/pose/segmenter";
import type { PoseFrame } from "@/types/exercise";
import type { PoseLandmarker } from "@mediapipe/tasks-vision";

interface CapturedRep {
  meta: CaptureSettings & { captured_at: string };
  frames: PoseFrame[];
}

export default function CapturePage() {
  if (process.env.NEXT_PUBLIC_ENABLE_CAPTURE !== "true") {
    return <div className="p-8 text-slate-350">Capture mode is disabled.</div>;
  }

  const videoRef = useRef<HTMLVideoElement>(null);
  const [settings, setSettings] = useState<CaptureSettings>({
    family: "pushup", variation: "standard", subject: "team_A", quality: "good", defects: [],
  });
  const [recording, setRecording] = useState(false);
  const [reps, setReps] = useState<CapturedRep[]>([]);
  const recordingRef = useRef(false);
  const settingsRef = useRef(settings);
  const currentFrames = useRef<PoseFrame[]>([]);

  useEffect(() => { recordingRef.current = recording; }, [recording]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  useEffect(() => {
    let landmarker: PoseLandmarker | null = null;
    let raf = 0;
    let lastT = -1;
    const segmenter = new RepSegmenter({ topThreshold: 155, bottomThreshold: 95 });

    (async () => {
      landmarker = await createPoseLandmarker("full");
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const loop = () => {
        const v = videoRef.current;
        if (v && landmarker && v.currentTime !== lastT) {
          lastT = v.currentTime;
          const t = performance.now();
          const result = landmarker.detectForVideo(v, t);
          const frame = resultToFrame(result, t);
          if (frame && recordingRef.current) {
            currentFrames.current.push(frame);
            const angles = computeJointAngles(frame);
            const elbow = angles.elbow_left ?? angles.elbow_right ?? NaN;
            if (Number.isFinite(elbow)) {
              const seg = segmenter.push(t, elbow as number);
              if (seg.repCompleted) {
                setReps((prev) => [...prev, {
                  meta: { ...settingsRef.current, captured_at: new Date().toISOString() },
                  frames: currentFrames.current.slice(),
                }]);
                currentFrames.current = [];
              }
            }
          }
        }
        raf = requestAnimationFrame(loop);
      };
      loop();
    })();

    return () => {
      cancelAnimationFrame(raf);
      if (landmarker) landmarker.close();
      const s = videoRef.current?.srcObject as MediaStream | null;
      s?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify({ reps }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `capture_${settings.family}_${settings.subject}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4">
      <h1 className="text-xl font-bold mb-4">Capture Mode (dev only)</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="aspect-video bg-black rounded-xl overflow-hidden">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
        </div>
        <CaptureControls
          value={settings}
          onChange={setSettings}
          recording={recording}
          onToggleRecord={() => setRecording((r) => !r)}
          capturedReps={reps.length}
          onDownload={downloadJSON}
        />
      </div>
      <ul className="mt-4 text-xs text-slate-300 space-y-1">
        {reps.map((r, i) => (
          <li key={i}>
            #{i + 1} — {r.meta.family}/{r.meta.variation} ({r.meta.quality}) · {r.frames.length} frames
          </li>
        ))}
      </ul>
    </div>
  );
}
