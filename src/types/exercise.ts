// MediaPipe Pose landmark indices we care about (subset of 33).
// See: https://developers.google.com/mediapipe/solutions/vision/pose_landmarker
export const LANDMARK_INDEX = {
  leftShoulder: 11, rightShoulder: 12,
  leftElbow: 13,    rightElbow: 14,
  leftWrist: 15,    rightWrist: 16,
  leftHip: 23,      rightHip: 24,
  leftKnee: 25,     rightKnee: 26,
  leftAnkle: 27,    rightAnkle: 28,
} as const;

export type JointName =
  | "elbow_left" | "elbow_right"
  | "shoulder_left" | "shoulder_right"
  | "hip_left" | "hip_right"
  | "knee_left" | "knee_right"
  | "body_line"; // shoulder–hip–ankle straightness

export type ExerciseFamily = "pushup" | "benchpress" | "squat";
export type CameraView = "front" | "side";

export interface Landmark2D {
  x: number; // 0..1
  y: number; // 0..1
  z?: number;
  visibility?: number;
}

export interface LandmarkWorld {
  x: number; // meters
  y: number;
  z: number;
  visibility?: number;
}

export interface PoseFrame {
  tMs: number;
  landmarks2D: Landmark2D[];     // length 33
  landmarksWorld: LandmarkWorld[]; // length 33
}
