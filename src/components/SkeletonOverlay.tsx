// src/components/SkeletonOverlay.tsx
"use client";

import { useEffect, useRef } from "react";
import type { Landmark2D, JointName } from "@/types/exercise";
import { LANDMARK_INDEX } from "@/types/exercise";

interface Props {
  landmarks: Landmark2D[] | null;
  deviations: Partial<Record<JointName, number>>;
  width: number;
  height: number;
  className?: string;
}

// Bones to draw: pairs of landmark indices + the joint name that "owns" the bone for coloring.
const BONES: { from: number; to: number; joint: JointName }[] = [
  { from: LANDMARK_INDEX.leftShoulder,  to: LANDMARK_INDEX.leftElbow,    joint: "shoulder_left" },
  { from: LANDMARK_INDEX.leftElbow,     to: LANDMARK_INDEX.leftWrist,    joint: "elbow_left" },
  { from: LANDMARK_INDEX.rightShoulder, to: LANDMARK_INDEX.rightElbow,   joint: "shoulder_right" },
  { from: LANDMARK_INDEX.rightElbow,    to: LANDMARK_INDEX.rightWrist,   joint: "elbow_right" },
  { from: LANDMARK_INDEX.leftShoulder,  to: LANDMARK_INDEX.leftHip,      joint: "body_line" },
  { from: LANDMARK_INDEX.rightShoulder, to: LANDMARK_INDEX.rightHip,     joint: "body_line" },
  { from: LANDMARK_INDEX.leftHip,       to: LANDMARK_INDEX.leftKnee,     joint: "hip_left" },
  { from: LANDMARK_INDEX.rightHip,      to: LANDMARK_INDEX.rightKnee,    joint: "hip_right" },
  { from: LANDMARK_INDEX.leftKnee,      to: LANDMARK_INDEX.leftAnkle,    joint: "knee_left" },
  { from: LANDMARK_INDEX.rightKnee,     to: LANDMARK_INDEX.rightAnkle,   joint: "knee_right" },
];

function colorForDiff(diff: number | undefined): string {
  if (diff == null) return "#4f46e5"; // indigo fallback
  if (diff < 8) return "#22c55e";     // green
  if (diff < 18) return "#f59e0b";    // amber
  return "#ef4444";                   // red
}

export default function SkeletonOverlay({ landmarks, deviations, width, height, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    c.width = width; c.height = height;
    ctx.clearRect(0, 0, width, height);
    if (!landmarks) return;

    ctx.lineWidth = 4;
    for (const b of BONES) {
      const a = landmarks[b.from], z = landmarks[b.to];
      if (!a || !z) continue;
      ctx.strokeStyle = colorForDiff(deviations[b.joint]);
      ctx.beginPath();
      ctx.moveTo(a.x * width, a.y * height);
      ctx.lineTo(z.x * width, z.y * height);
      ctx.stroke();
    }
    ctx.fillStyle = "#ffffff";
    for (const lm of landmarks) {
      ctx.beginPath();
      ctx.arc(lm.x * width, lm.y * height, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [landmarks, deviations, width, height]);

  return <canvas ref={canvasRef} className={className} />;
}
