// src/lib/baseline/schema.ts
import type { Baseline } from "./types";

export type ValidationResult =
  | { ok: true; value: Baseline }
  | { ok: false; error: string };

const REQUIRED = [
  "id", "exercise_family", "variation", "display_name_ko",
  "camera_view", "target_muscles", "joints_used",
  "rep_length_frames", "trajectory", "embedding",
  "phase_anchors", "rule_thresholds",
  "captured_by", "captured_at", "version",
] as const;

export function validateBaseline(raw: unknown): ValidationResult {
  if (typeof raw !== "object" || raw === null) {
    return { ok: false, error: "baseline must be an object" };
  }
  const o = raw as Record<string, unknown>;
  for (const key of REQUIRED) {
    if (!(key in o)) return { ok: false, error: `missing field: ${key}` };
  }
  const repLen = o.rep_length_frames;
  if (typeof repLen !== "number" || repLen <= 0) {
    return { ok: false, error: "rep_length_frames must be positive number" };
  }
  const traj = o.trajectory as Record<string, unknown>;
  for (const [k, v] of Object.entries(traj)) {
    if (!Array.isArray(v) || v.length !== repLen) {
      return { ok: false, error: `trajectory.${k} length must be ${repLen}` };
    }
    if (!v.every((n) => typeof n === "number" && Number.isFinite(n))) {
      return { ok: false, error: `trajectory.${k} must be finite numbers` };
    }
  }
  return { ok: true, value: o as unknown as Baseline };
}
