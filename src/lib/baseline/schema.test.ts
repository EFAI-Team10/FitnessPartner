// src/lib/baseline/schema.test.ts
import { describe, it, expect } from "vitest";
import { validateBaseline } from "./schema";

const validRaw = {
  id: "pushup_standard",
  exercise_family: "pushup",
  variation: "standard",
  display_name_ko: "표준 푸쉬업",
  camera_view: "front",
  target_muscles: ["chest_mid"],
  joints_used: ["elbow_left", "body_line"],
  rep_length_frames: 3,
  trajectory: { elbow_left: [170, 90, 170], body_line: [178, 178, 178] },
  embedding: null,
  phase_anchors: { top: 0, bottom: 0.5, top2: 1 },
  rule_thresholds: { elbow_top_min: 155, elbow_bottom_max: 95, body_line_min: 165 },
  captured_by: "team_A",
  captured_at: "2026-05-25",
  version: 1,
};

describe("validateBaseline", () => {
  it("accepts a valid baseline", () => {
    const r = validateBaseline(validRaw);
    expect(r.ok).toBe(true);
  });

  it("rejects when trajectory array length mismatches rep_length_frames", () => {
    const bad = { ...validRaw, trajectory: { elbow_left: [170, 90] } };
    const r = validateBaseline(bad);
    expect(r.ok).toBe(false);
  });

  it("rejects missing required field", () => {
    const { id, ...rest } = validRaw;
    const r = validateBaseline(rest);
    expect(r.ok).toBe(false);
  });
});
