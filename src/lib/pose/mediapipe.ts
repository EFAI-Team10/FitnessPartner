// src/lib/pose/mediapipe.ts
"use client";

import { FilesetResolver, PoseLandmarker, type PoseLandmarkerResult } from "@mediapipe/tasks-vision";
import type { PoseFrame } from "@/types/exercise";

const MODEL_URLS = {
  full: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task",
  lite: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
};

export async function createPoseLandmarker(
  variant: "full" | "lite" = "full",
): Promise<PoseLandmarker> {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm",
  );
  return PoseLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: MODEL_URLS[variant], delegate: "GPU" },
    runningMode: "VIDEO",
    numPoses: 1,
  });
}

/** Convert MediaPipe's result into our PoseFrame shape (null if no landmarks). */
export function resultToFrame(
  result: PoseLandmarkerResult,
  tMs: number,
): PoseFrame | null {
  const lm = result.landmarks?.[0];
  const wlm = result.worldLandmarks?.[0];
  if (!lm || !wlm) return null;
  return {
    tMs,
    landmarks2D: lm.map((p) => ({ x: p.x, y: p.y, z: p.z, visibility: p.visibility })),
    landmarksWorld: wlm.map((p) => ({ x: p.x, y: p.y, z: p.z, visibility: p.visibility })),
  };
}

/** Mobile UA → use lite model. */
export function pickModelVariant(): "full" | "lite" {
  if (typeof navigator === "undefined") return "full";
  return /Android|iPhone|iPad/i.test(navigator.userAgent) ? "lite" : "full";
}
