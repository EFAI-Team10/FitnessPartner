// src/lib/coach/scoring.test.ts
import { describe, it, expect } from "vitest";
import { scoreRep } from "./scoring";
import type { Baseline } from "@/lib/baseline/types";

const baseline: Baseline = {
  id: "test", exercise_family: "pushup", variation: "test",
  display_name_ko: "테스트", camera_view: "front", target_muscles: [],
  joints_used: ["elbow_left"], rep_length_frames: 4,
  trajectory: { elbow_left: [170, 90, 90, 170] },
  embedding: null, phase_anchors: { top: 0, bottom: 0.5, top2: 1 },
  rule_thresholds: { elbow_top_min: 155, elbow_bottom_max: 95, body_line_min: 165 },
  captured_by: "test", captured_at: "2026-05-22", version: 1,
};

describe("scoreRep", () => {
  it("returns 100 when user matches baseline exactly", () => {
    const r = scoreRep(baseline, { elbow_left: [170, 90, 90, 170] });
    expect(r.score).toBeGreaterThanOrEqual(99);
    expect(r.score).toBeLessThanOrEqual(100);
  });

  it("returns lower score for deviated rep", () => {
    const r = scoreRep(baseline, { elbow_left: [170, 140, 140, 170] }); // shallow
    expect(r.score).toBeLessThan(80);
  });

  it("resamples user rep when frame count differs", () => {
    const r = scoreRep(baseline, { elbow_left: [170, 90, 170] }); // 3 frames vs 4
    expect(r.score).toBeGreaterThanOrEqual(95);
  });

  it("returns per-joint breakdown", () => {
    const r = scoreRep(baseline, { elbow_left: [170, 140, 140, 170] });
    expect(r.perJoint.elbow_left).toBeDefined();
    expect(r.perJoint.elbow_left).toBeLessThan(80);
  });
});
