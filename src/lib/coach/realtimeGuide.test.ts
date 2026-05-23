// src/lib/coach/realtimeGuide.test.ts
import { describe, it, expect } from "vitest";
import { estimatePhase, frameGuidance } from "./realtimeGuide";
import type { Baseline } from "@/lib/baseline/types";

const baseline: Baseline = {
  id: "test", exercise_family: "pushup", variation: "test",
  display_name_ko: "테스트", camera_view: "front", target_muscles: [],
  joints_used: ["elbow_left", "body_line"],
  rep_length_frames: 4,
  trajectory: { elbow_left: [170, 90, 90, 170], body_line: [178, 178, 178, 178] },
  embedding: null, phase_anchors: { top: 0, bottom: 0.5, top2: 1 },
  rule_thresholds: { elbow_top_min: 155, elbow_bottom_max: 95, body_line_min: 165 },
  captured_by: "test", captured_at: "2026-05-22", version: 1,
};

describe("estimatePhase", () => {
  it("returns near 0 when elbow at top", () => {
    expect(estimatePhase(baseline, 170)).toBeLessThan(0.05);
  });
  it("returns near 0.5 when elbow at bottom", () => {
    expect(estimatePhase(baseline, 90)).toBeGreaterThan(0.45);
    expect(estimatePhase(baseline, 90)).toBeLessThan(0.55);
  });
});

describe("frameGuidance", () => {
  it("flags body_line deviation when hip sags", () => {
    const g = frameGuidance(baseline, { elbow_left: 90, body_line: 155 });
    expect(g.worstJoint).toBe("body_line");
    expect(g.deviations.body_line).toBeGreaterThan(15);
  });
  it("returns ok=true when frame matches baseline", () => {
    const g = frameGuidance(baseline, { elbow_left: 90, body_line: 178 });
    expect(g.ok).toBe(true);
  });
});
