// src/lib/baseline/types.ts
import type { ExerciseFamily, CameraView, JointName } from "@/types/exercise";

export interface Baseline {
  id: string;                       // e.g. "pushup_standard"
  exercise_family: ExerciseFamily;
  variation: string;                // "standard", "diamond", ...
  display_name_ko: string;
  camera_view: CameraView;
  target_muscles: string[];
  joints_used: JointName[];
  rep_length_frames: number;        // typically 50
  trajectory: Partial<Record<JointName, number[]>>; // each array length === rep_length_frames
  embedding: number[] | null;       // null until ML phase
  phase_anchors: { top: number; bottom: number; top2: number }; // 0..1
  rule_thresholds: {
    elbow_top_min: number;
    elbow_bottom_max: number;
    body_line_min: number;
    [k: string]: number;
  };
  captured_by: string;
  captured_at: string;              // YYYY-MM-DD
  version: number;
}
