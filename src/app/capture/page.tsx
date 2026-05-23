// src/app/capture/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import CaptureControls, { type CaptureSettings } from "@/components/CaptureControls";
import { createPoseLandmarker, resultToFrame } from "@/lib/pose/mediapipe";
import { computeJointAngles } from "@/lib/pose/features";
import { resampleSeries } from "@/lib/pose/normalize";
import { RepSegmenter } from "@/lib/pose/segmenter";
import type { JointName, PoseFrame } from "@/types/exercise";
import type { PoseLandmarker } from "@mediapipe/tasks-vision";

const BASELINE_JOINTS: JointName[] = [
  "elbow_left", "elbow_right",
  "shoulder_left", "shoulder_right",
  "hip_left", "hip_right",
  "body_line",
];
const BASELINE_FRAMES = 50;

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

  // Build a baseline JSON from all "good" reps captured so far.
  // Per-rep: compute angles → resample to BASELINE_FRAMES → average across reps.
  const generateBaseline = () => {
    const goodReps = reps.filter((r) => r.meta.quality === "good");
    if (goodReps.length < 3) {
      alert(`좋은 렙이 ${goodReps.length}개뿐입니다. 최소 3개 이상 필요합니다.`);
      return;
    }

    // 1. Per-rep angle trajectory per joint (raw frames → angle series)
    const perRepTrajectories: Partial<Record<JointName, number[]>>[] = goodReps.map((rep) => {
      const byJoint: Partial<Record<JointName, number[]>> = {};
      for (const frame of rep.frames) {
        const angles = computeJointAngles(frame);
        for (const joint of BASELINE_JOINTS) {
          const v = angles[joint];
          if (v != null && Number.isFinite(v)) {
            if (!byJoint[joint]) byJoint[joint] = [];
            byJoint[joint]!.push(v);
          }
        }
      }
      return byJoint;
    });

    // 2. Resample each rep to BASELINE_FRAMES, then average across reps
    const trajectory: Partial<Record<JointName, number[]>> = {};
    for (const joint of BASELINE_JOINTS) {
      const resampled = perRepTrajectories
        .map((t) => t[joint])
        .filter((s): s is number[] => !!s && s.length > 0)
        .map((s) => resampleSeries(s, BASELINE_FRAMES));

      if (resampled.length === 0) continue;

      // Element-wise average, rounded to 1 decimal
      trajectory[joint] = Array.from({ length: BASELINE_FRAMES }, (_, i) => {
        const avg = resampled.reduce((sum, s) => sum + s[i], 0) / resampled.length;
        return Math.round(avg * 10) / 10;
      });
    }

    // 3. Derive rule thresholds from the averaged elbow trajectory
    const elbowSeries = trajectory.elbow_left ?? trajectory.elbow_right ?? [];
    const elbowTop = elbowSeries.length ? Math.round(Math.max(...elbowSeries)) : 155;
    const elbowBottom = elbowSeries.length ? Math.round(Math.min(...elbowSeries)) : 95;

    const baseline = {
      id: `${settings.family}_${settings.variation}`,
      exercise_family: settings.family,
      variation: settings.variation,
      display_name_ko: `${settings.variation} ${settings.family}`,
      camera_view: "front",
      target_muscles: [],
      joints_used: BASELINE_JOINTS.filter((j) => j in trajectory),
      rep_length_frames: BASELINE_FRAMES,
      trajectory,
      embedding: null,
      phase_anchors: { top: 0, bottom: 0.5, top2: 1 },
      rule_thresholds: {
        elbow_top_min: Math.max(140, elbowTop - 15),
        elbow_bottom_max: Math.min(110, elbowBottom + 15),
        body_line_min: 165,
      },
      captured_by: settings.subject,
      captured_at: new Date().toISOString().slice(0, 10),
      version: 1,
      source_reps: goodReps.length,
    };

    const blob = new Blob([JSON.stringify(baseline, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${baseline.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const goodRepCount = reps.filter((r) => r.meta.quality === "good").length;

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
      {/* Generate Baseline button */}
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={generateBaseline}
          disabled={goodRepCount < 3}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-semibold transition-colors"
        >
          📐 Generate Baseline JSON
        </button>
        <span className="text-xs text-slate-400">
          Good 렙: <span className={goodRepCount >= 3 ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>{goodRepCount}</span>
          {goodRepCount < 3 && " (최소 3개 필요)"}
        </span>
      </div>

      <ul className="mt-3 text-xs text-slate-300 space-y-1">
        {reps.map((r, i) => (
          <li key={i} className={r.meta.quality === "good" ? "text-emerald-400" : "text-red-400"}>
            #{i + 1} — {r.meta.family}/{r.meta.variation} ({r.meta.quality}) · {r.frames.length} frames
          </li>
        ))}
      </ul>
    </div>
  );
}
