// src/lib/pose/features.ts
import { LANDMARK_INDEX, type JointName, type PoseFrame, type LandmarkWorld } from "@/types/exercise";

/** Angle ABC in degrees, computed in 3D. */
export function angle3D(a: LandmarkWorld, b: LandmarkWorld, c: LandmarkWorld): number {
  const v1 = { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  const v2 = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z };
  const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  const m1 = Math.hypot(v1.x, v1.y, v1.z);
  const m2 = Math.hypot(v2.x, v2.y, v2.z);
  if (m1 === 0 || m2 === 0) return NaN;
  const cos = Math.max(-1, Math.min(1, dot / (m1 * m2)));
  return (Math.acos(cos) * 180) / Math.PI;
}

type AngleMap = Partial<Record<JointName, number>>;

export function computeJointAngles(frame: PoseFrame): AngleMap {
  const w = frame.landmarksWorld;
  const L = LANDMARK_INDEX;
  const out: AngleMap = {};

  out.elbow_left     = angle3D(w[L.leftShoulder],  w[L.leftElbow],    w[L.leftWrist]);
  out.elbow_right    = angle3D(w[L.rightShoulder], w[L.rightElbow],   w[L.rightWrist]);
  out.shoulder_left  = angle3D(w[L.leftElbow],     w[L.leftShoulder], w[L.leftHip]);
  out.shoulder_right = angle3D(w[L.rightElbow],    w[L.rightShoulder],w[L.rightHip]);
  out.hip_left       = angle3D(w[L.leftShoulder],  w[L.leftHip],      w[L.leftKnee]);
  out.hip_right      = angle3D(w[L.rightShoulder], w[L.rightHip],     w[L.rightKnee]);
  out.knee_left      = angle3D(w[L.leftHip],       w[L.leftKnee],     w[L.leftAnkle]);
  out.knee_right     = angle3D(w[L.rightHip],      w[L.rightKnee],    w[L.rightAnkle]);

  // body_line: shoulder midpoint - hip midpoint - ankle midpoint
  const mid = (a: LandmarkWorld, b: LandmarkWorld): LandmarkWorld => ({
    x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, z: (a.z + b.z) / 2,
  });
  out.body_line = angle3D(
    mid(w[L.leftShoulder], w[L.rightShoulder]),
    mid(w[L.leftHip], w[L.rightHip]),
    mid(w[L.leftAnkle], w[L.rightAnkle]),
  );

  return out;
}
