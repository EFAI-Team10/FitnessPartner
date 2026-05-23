// src/lib/pose/features.test.ts
import { describe, it, expect } from "vitest";
import { computeJointAngles, angle3D } from "./features";
import type { PoseFrame } from "@/types/exercise";

describe("angle3D", () => {
  it("returns 90 for perpendicular vectors", () => {
    const a = { x: 1, y: 0, z: 0 };
    const b = { x: 0, y: 0, z: 0 };
    const c = { x: 0, y: 1, z: 0 };
    expect(angle3D(a, b, c)).toBeCloseTo(90, 1);
  });

  it("returns 180 for straight line", () => {
    const a = { x: 0, y: 0, z: 0 };
    const b = { x: 1, y: 0, z: 0 };
    const c = { x: 2, y: 0, z: 0 };
    expect(angle3D(a, b, c)).toBeCloseTo(180, 1);
  });
});

describe("computeJointAngles", () => {
  it("computes elbow_left when shoulder/elbow/wrist are present", () => {
    const frame: PoseFrame = {
      tMs: 0,
      landmarks2D: Array(33).fill({ x: 0, y: 0 }),
      landmarksWorld: Array(33).fill({ x: 0, y: 0, z: 0 }),
    };
    // shoulder(11), elbow(13), wrist(15) — straight arm
    frame.landmarksWorld[11] = { x: 0, y: 0, z: 0 };
    frame.landmarksWorld[13] = { x: 0.3, y: 0, z: 0 };
    frame.landmarksWorld[15] = { x: 0.6, y: 0, z: 0 };

    const angles = computeJointAngles(frame);
    expect(angles.elbow_left).toBeCloseTo(180, 1);
  });

  it("computes body_line as shoulder–hip–ankle angle", () => {
    const frame: PoseFrame = {
      tMs: 0,
      landmarks2D: Array(33).fill({ x: 0, y: 0 }),
      landmarksWorld: Array(33).fill({ x: 0, y: 0, z: 0 }),
    };
    // Straight body: shoulder(11), hip(23), ankle(27) collinear
    frame.landmarksWorld[11] = { x: 0, y: 0, z: 0 };
    frame.landmarksWorld[23] = { x: 0.5, y: 0, z: 0 };
    frame.landmarksWorld[27] = { x: 1.0, y: 0, z: 0 };
    expect(computeJointAngles(frame).body_line).toBeCloseTo(180, 1);
  });
});
