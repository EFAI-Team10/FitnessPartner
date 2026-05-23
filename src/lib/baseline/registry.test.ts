// src/lib/baseline/registry.test.ts
import { describe, it, expect, vi } from "vitest";

// Mock the JSON modules before importing the registry.
vi.mock("../../../public/baselines/pushup_standard.json", () => ({
  default: {
    id: "pushup_standard",
    exercise_family: "pushup",
    variation: "standard",
    display_name_ko: "표준 푸쉬업",
    camera_view: "front",
    target_muscles: ["chest_mid"],
    joints_used: ["elbow_left"],
    rep_length_frames: 2,
    trajectory: { elbow_left: [170, 90] },
    embedding: null,
    phase_anchors: { top: 0, bottom: 0.5, top2: 1 },
    rule_thresholds: { elbow_top_min: 155, elbow_bottom_max: 95, body_line_min: 165 },
    captured_by: "team_A",
    captured_at: "2026-05-25",
    version: 1,
  },
}));

import { listFamilies, listByFamily, getBaseline } from "./registry";

describe("registry", () => {
  it("returns at least one family", () => {
    expect(listFamilies().length).toBeGreaterThan(0);
  });

  it("lists baselines for pushup family", () => {
    const items = listByFamily("pushup");
    expect(items.find((b) => b.id === "pushup_standard")).toBeDefined();
  });

  it("getBaseline returns null for unknown id", () => {
    expect(getBaseline("nonexistent_id")).toBeNull();
  });
});
