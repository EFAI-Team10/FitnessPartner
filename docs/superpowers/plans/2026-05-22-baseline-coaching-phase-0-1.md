# Baseline Coaching — Phase 0 + Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor PoseDetector into modular `lib/pose/*` + `lib/coach/*` + `lib/baseline/*`, add `[exercise]` dynamic route + `/capture` mode, and ship rule-based baseline coaching with the first hand-authored `pushup_standard` baseline. ML model integration is deferred to a separate Phase 2 plan.

**Architecture:** Pure functions in `lib/pose` consume MediaPipe landmarks and emit joint-angle features + rep boundaries. `lib/coach` compares user trajectory against the active baseline (DTW/MSE) and emits per-joint deviation + defect hints. UI components (`SkeletonOverlay`, `FormHud`) render the result. `/capture` page records raw rep JSON for future model training.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, MediaPipe Tasks-Vision 0.10, Supabase, Tailwind 4, Vitest (new).

---

## Critical Notes (read before starting any task)

1. **Next.js 16 is NOT what you know.** Per `AGENTS.md`, APIs/conventions/file structure differ from training data. Before writing any Next.js route, page, or layout code, **read the relevant guide in `node_modules/next/dist/docs/`**. Heed deprecation notices.
2. **GateGuard hooks may block `Bash` / `Write` / `Edit`.** When you see a Fact-Forcing Gate error, respond with the requested facts (file purpose, callers, redacted data structures, verbatim user instruction) then retry.
3. **No test framework is installed yet.** Task 1 sets up Vitest. Until then, no `npm test` will work.
4. **Don't run `npm install` without confirming.** Network installs can be slow/blocked; ask the human if a task fails on install.
5. **Commit per task.** Each task ends with a `git add` + `git commit` step. Don't batch.
6. **Module purity rule:** anything in `lib/pose/` and `lib/coach/` must be **pure functions of plain data**. No `useEffect`, no canvas, no DOM. Components consume these.
7. **Baseline JSON is the source of truth for "what is a good rep."** Never hardcode angle thresholds inside `lib/coach`; read them from the baseline.

---

## File Structure Overview

```
src/lib/pose/                  # New — pure pose math
  features.ts                  # landmarks → joint angles
  features.test.ts
  segmenter.ts                 # angle stream → rep boundaries
  segmenter.test.ts
  normalize.ts                 # variable-length frames → 50-frame
  normalize.test.ts
  mediapipe.ts                 # PoseLandmarker loader/wrapper (impure, isolated)

src/lib/baseline/              # New — baseline registry
  types.ts
  schema.ts                    # JSON validation (no extra dep — manual TS guard)
  schema.test.ts
  registry.ts                  # Static import map; getBaseline(id), listByFamily()
  registry.test.ts

src/lib/coach/                 # New — coaching logic
  scoring.ts                   # DTW + per-joint deviation → 0~100
  scoring.test.ts
  realtimeGuide.ts             # phase estimation + frame-level deviation
  realtimeGuide.test.ts
  defectMessages.ts            # defect_id → Korean string

src/components/
  PoseDetector.tsx             # Modified — slim wrapper using new libs
  SkeletonOverlay.tsx          # New
  FormHud.tsx                  # New
  CaptureControls.tsx          # New
  BottomNav.tsx                # Modified — hide for /capture too

src/app/
  workout/page.tsx             # Modified — dynamic registry-driven menu
  workout/[exercise]/page.tsx  # New — replaces pushup/, benchpress/ pages
  workout/pushup/page.tsx      # Deleted
  workout/benchpress/page.tsx  # Deleted
  capture/page.tsx             # New — dev-only capture mode

src/types/exercise.ts          # New — shared exercise + joint name unions

public/baselines/
  pushup_standard.json         # New — first hand-authored baseline

supabase_migrations/
  20260522_add_form_scoring.sql # New — adds rep_scores, defects, baseline_id

vitest.config.ts               # New
package.json                   # Modified — add vitest deps + test script
```

---

## Phase 0 — Foundation (Tasks 1–10)

### Task 1: Set up Vitest + project scripts

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`

- [ ] **Step 1: Add vitest deps**

```bash
npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/jest-dom jsdom
```

Expected: deps appear in `devDependencies`. If install fails, ask human before proceeding.

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
```

- [ ] **Step 3: Add scripts to `package.json`**

In the `scripts` block, add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Smoke-check**

Run: `npm test`
Expected: "No test files found" exit 0 (or similar). Configuration loads without error.

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts package.json package-lock.json
git commit -m "chore: add vitest test infrastructure"
```

---

### Task 2: `src/types/exercise.ts` — shared unions

**Files:**
- Create: `src/types/exercise.ts`

- [ ] **Step 1: Write the file**

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add src/types/exercise.ts
git commit -m "feat(types): add shared exercise + pose type definitions"
```

---

### Task 3: `lib/pose/features.ts` — joint angle extraction (TDD)

**Files:**
- Create: `src/lib/pose/features.ts`
- Test: `src/lib/pose/features.test.ts`

Pure function: given a `PoseFrame`, compute joint angles in degrees for every `JointName`. Uses 3D world coordinates when available (better cross-user comparison), falls back to 2D.

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test, verify fail**

Run: `npm test -- features`
Expected: `Cannot find module './features'` or similar.

- [ ] **Step 3: Implement**

```ts
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
```

- [ ] **Step 4: Run tests, verify pass**

Run: `npm test -- features`
Expected: 3 passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/pose/features.ts src/lib/pose/features.test.ts
git commit -m "feat(pose): joint angle extraction from 3D world landmarks"
```

---

### Task 4: `lib/pose/segmenter.ts` — rep boundary detection (TDD)

**Files:**
- Create: `src/lib/pose/segmenter.ts`
- Test: `src/lib/pose/segmenter.test.ts`

Detect rep boundaries from a streaming angle (e.g. elbow). State machine: top → down → bottom → up → top = 1 rep.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/pose/segmenter.test.ts
import { describe, it, expect } from "vitest";
import { RepSegmenter } from "./segmenter";

describe("RepSegmenter", () => {
  it("counts one rep on full down-and-up cycle", () => {
    const seg = new RepSegmenter({ topThreshold: 155, bottomThreshold: 95 });
    const sequence = [170, 160, 130, 100, 90, 100, 130, 160, 170];
    let reps = 0;
    sequence.forEach((a, i) => { if (seg.push(i * 50, a).repCompleted) reps += 1; });
    expect(reps).toBe(1);
  });

  it("does not count if bottom not reached", () => {
    const seg = new RepSegmenter({ topThreshold: 155, bottomThreshold: 95 });
    const sequence = [170, 160, 140, 130, 140, 160, 170]; // never below 95
    let reps = 0;
    sequence.forEach((a, i) => { if (seg.push(i * 50, a).repCompleted) reps += 1; });
    expect(reps).toBe(0);
  });

  it("emits the frames array on rep completion", () => {
    const seg = new RepSegmenter({ topThreshold: 155, bottomThreshold: 95 });
    const seq = [170, 160, 130, 100, 90, 100, 130, 160, 170];
    let frames: { tMs: number; angle: number }[] = [];
    seq.forEach((a, i) => {
      const r = seg.push(i * 50, a);
      if (r.repCompleted && r.repFrames) frames = r.repFrames;
    });
    expect(frames.length).toBe(seq.length);
    expect(frames[0].angle).toBe(170);
  });
});
```

- [ ] **Step 2: Run test, verify fail**

Run: `npm test -- segmenter`

- [ ] **Step 3: Implement**

```ts
// src/lib/pose/segmenter.ts
export interface SegmenterConfig {
  topThreshold: number;    // angle considered "extended" (e.g. 155°)
  bottomThreshold: number; // angle considered "flexed" (e.g. 95°)
}

interface AngleFrame { tMs: number; angle: number }

export interface SegmenterResult {
  repCompleted: boolean;
  repFrames?: AngleFrame[];
}

export class RepSegmenter {
  private isDown = false;
  private buffer: AngleFrame[] = [];

  constructor(private cfg: SegmenterConfig) {}

  push(tMs: number, angle: number): SegmenterResult {
    this.buffer.push({ tMs, angle });

    if (angle < this.cfg.bottomThreshold) {
      this.isDown = true;
    } else if (angle > this.cfg.topThreshold && this.isDown) {
      this.isDown = false;
      const frames = this.buffer.slice();
      this.buffer = [{ tMs, angle }]; // keep the top frame as next rep's seed
      return { repCompleted: true, repFrames: frames };
    }

    // Prevent unbounded growth between reps
    if (this.buffer.length > 600) this.buffer.shift();

    return { repCompleted: false };
  }

  reset() {
    this.isDown = false;
    this.buffer = [];
  }
}
```

- [ ] **Step 4: Run tests, verify pass**

Run: `npm test -- segmenter`
Expected: 3 passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/pose/segmenter.ts src/lib/pose/segmenter.test.ts
git commit -m "feat(pose): rep boundary segmenter via angle threshold state machine"
```

---

### Task 5: `lib/pose/normalize.ts` — time-axis resampling (TDD)

**Files:**
- Create: `src/lib/pose/normalize.ts`
- Test: `src/lib/pose/normalize.test.ts`

Given a variable-length per-joint angle series for one rep, resample to exactly N frames (default 50) using linear interpolation.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/pose/normalize.test.ts
import { describe, it, expect } from "vitest";
import { resampleSeries } from "./normalize";

describe("resampleSeries", () => {
  it("preserves length when target = input length", () => {
    const out = resampleSeries([1, 2, 3, 4, 5], 5);
    expect(out).toEqual([1, 2, 3, 4, 5]);
  });

  it("upsamples linearly", () => {
    const out = resampleSeries([0, 10], 3);
    expect(out[0]).toBeCloseTo(0);
    expect(out[1]).toBeCloseTo(5);
    expect(out[2]).toBeCloseTo(10);
  });

  it("downsamples", () => {
    const out = resampleSeries([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 5);
    expect(out.length).toBe(5);
    expect(out[0]).toBe(0);
    expect(out[4]).toBe(9);
  });
});
```

- [ ] **Step 2: Run test, verify fail**

Run: `npm test -- normalize`

- [ ] **Step 3: Implement**

```ts
// src/lib/pose/normalize.ts
/** Linear-interpolate a numeric series to `target` samples. */
export function resampleSeries(input: number[], target: number): number[] {
  if (input.length === 0) return [];
  if (input.length === 1) return Array(target).fill(input[0]);
  if (target === input.length) return input.slice();

  const out = new Array<number>(target);
  const lastIdx = input.length - 1;
  for (let i = 0; i < target; i++) {
    const t = (i / (target - 1)) * lastIdx;
    const lo = Math.floor(t);
    const hi = Math.min(lo + 1, lastIdx);
    const frac = t - lo;
    out[i] = input[lo] * (1 - frac) + input[hi] * frac;
  }
  return out;
}

export function resampleTrajectory(
  byJoint: Record<string, number[]>,
  target: number,
): Record<string, number[]> {
  const out: Record<string, number[]> = {};
  for (const [k, v] of Object.entries(byJoint)) out[k] = resampleSeries(v, target);
  return out;
}
```

- [ ] **Step 4: Run tests, verify pass**

Run: `npm test -- normalize`
Expected: 3 passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/pose/normalize.ts src/lib/pose/normalize.test.ts
git commit -m "feat(pose): linear time-axis resampler for rep trajectories"
```

---

### Task 6: `lib/pose/mediapipe.ts` — loader wrapper (no tests, integration-only)

**Files:**
- Create: `src/lib/pose/mediapipe.ts`

Single place that knows about MediaPipe. Switches to **`pose_landmarker_full`** and exposes both `landmarks` (2D normalized) and `worldLandmarks` (3D meters).

- [ ] **Step 1: Write the file**

```ts
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
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/pose/mediapipe.ts
git commit -m "feat(pose): mediapipe loader wrapper with full model + worldLandmarks"
```

---

### Task 7: `lib/baseline/types.ts` + `schema.ts` (TDD)

**Files:**
- Create: `src/lib/baseline/types.ts`
- Create: `src/lib/baseline/schema.ts`
- Test: `src/lib/baseline/schema.test.ts`

- [ ] **Step 1: Write `types.ts`**

```ts
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
```

- [ ] **Step 2: Write the failing test for the validator**

```ts
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
```

- [ ] **Step 3: Run test, verify fail**

Run: `npm test -- schema`

- [ ] **Step 4: Implement**

```ts
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
```

- [ ] **Step 5: Run tests, verify pass**

Run: `npm test -- schema`
Expected: 3 passing.

- [ ] **Step 6: Commit**

```bash
git add src/lib/baseline/types.ts src/lib/baseline/schema.ts src/lib/baseline/schema.test.ts
git commit -m "feat(baseline): types + JSON validator for baseline files"
```

---

### Task 8: `lib/baseline/registry.ts` — static registry (TDD)

**Files:**
- Create: `src/lib/baseline/registry.ts`
- Test: `src/lib/baseline/registry.test.ts`

Static import map. **Note:** Next.js cannot dynamically `fs.readdir(public/baselines)` at runtime in the browser. Instead, we maintain a registry that hardcodes the JSON imports. New baselines = add one line to this file.

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test, verify fail**

Run: `npm test -- registry`

- [ ] **Step 3: Implement**

```ts
// src/lib/baseline/registry.ts
import { validateBaseline } from "./schema";
import type { Baseline } from "./types";
import type { ExerciseFamily } from "@/types/exercise";

// Add new baselines here.
import pushupStandardJson from "../../../public/baselines/pushup_standard.json";

const RAW: unknown[] = [pushupStandardJson];

function loadAll(): Baseline[] {
  const out: Baseline[] = [];
  for (const raw of RAW) {
    const r = validateBaseline(raw);
    if (r.ok) out.push(r.value);
    else console.warn("[baseline registry] invalid baseline:", r.error, raw);
  }
  return out;
}

const ALL: Baseline[] = loadAll();

export function listFamilies(): ExerciseFamily[] {
  return Array.from(new Set(ALL.map((b) => b.exercise_family)));
}

export function listByFamily(family: ExerciseFamily): Baseline[] {
  return ALL.filter((b) => b.exercise_family === family);
}

export function getBaseline(id: string): Baseline | null {
  return ALL.find((b) => b.id === id) ?? null;
}
```

- [ ] **Step 4: Ensure `tsconfig.json` resolveJsonModule is true**

Inspect `tsconfig.json`. If `"resolveJsonModule": true` is missing, add it inside `compilerOptions`.

- [ ] **Step 5: Create stub `pushup_standard.json`** (real content arrives in Task 12)

```bash
mkdir -p public/baselines
```

Write `public/baselines/pushup_standard.json`:

```json
{
  "id": "pushup_standard",
  "exercise_family": "pushup",
  "variation": "standard",
  "display_name_ko": "표준 푸쉬업",
  "camera_view": "front",
  "target_muscles": ["chest_mid", "triceps"],
  "joints_used": ["elbow_left", "body_line"],
  "rep_length_frames": 2,
  "trajectory": { "elbow_left": [170, 90], "body_line": [178, 178] },
  "embedding": null,
  "phase_anchors": { "top": 0, "bottom": 0.5, "top2": 1 },
  "rule_thresholds": { "elbow_top_min": 155, "elbow_bottom_max": 95, "body_line_min": 165 },
  "captured_by": "stub",
  "captured_at": "2026-05-22",
  "version": 0
}
```

- [ ] **Step 6: Run tests, verify pass**

Run: `npm test -- registry`
Expected: 3 passing.

- [ ] **Step 7: Commit**

```bash
git add src/lib/baseline/registry.ts src/lib/baseline/registry.test.ts public/baselines/pushup_standard.json tsconfig.json
git commit -m "feat(baseline): static registry with JSON import map + stub baseline"
```

---

### Task 9: Migrate routes to `workout/[exercise]/page.tsx`

**Files:**
- Create: `src/app/workout/[exercise]/page.tsx`
- Delete: `src/app/workout/pushup/page.tsx`
- Delete: `src/app/workout/benchpress/page.tsx`
- Modify: `src/app/workout/page.tsx`
- Modify: `src/components/BottomNav.tsx`

**Reminder:** Read `node_modules/next/dist/docs/` before touching routes. In particular, look up how dynamic routes + page props work in this Next version (params may be a `Promise` in Next 15+; verify before writing).

- [ ] **Step 1: Look up route params API**

Run: `find node_modules/next/dist/docs -name "*.md" -type f 2>/dev/null | head` and read whatever covers `dynamic-routes` and `page` props. Document in the commit message what the expected `params` shape is.

- [ ] **Step 2: Write `workout/[exercise]/page.tsx`**

If `params` is a Promise (Next 15+ convention):

```tsx
// src/app/workout/[exercise]/page.tsx
import PoseDetector from "@/components/PoseDetector";
import { getBaseline, listByFamily } from "@/lib/baseline/registry";
import type { ExerciseFamily } from "@/types/exercise";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ exercise: string }>;
}

export default async function ExerciseWorkoutPage({ params }: PageProps) {
  const { exercise } = await params;

  // exercise param is either a family ("pushup") or a baseline id ("pushup_standard")
  const baseline = getBaseline(exercise) ?? listByFamily(exercise as ExerciseFamily)[0];
  if (!baseline) notFound();

  return <PoseDetector baselineId={baseline.id} />;
}
```

If `params` is a plain object on your Next version, drop the `Promise` wrapper and `await`. **Verify against the docs you read in Step 1.**

- [ ] **Step 3: Update `workout/page.tsx` to drive from registry**

Replace the hardcoded two cards with a `.map()` over `listFamilies()` × `listByFamily()`:

```tsx
// src/app/workout/page.tsx
"use client";

import Link from "next/link";
import { ArrowLeft, Play } from "lucide-react";
import { listFamilies, listByFamily } from "@/lib/baseline/registry";

export default function WorkoutSelection() {
  const families = listFamilies();

  return (
    <div className="flex flex-col bg-slate-950 text-slate-50 font-sans">
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between px-6 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2 text-slate-300 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-xs font-semibold">Home</span>
        </Link>
        <span className="text-sm font-semibold">Workouts</span>
        <div className="w-10" />
      </header>

      <main className="flex-1 px-6 py-6 pb-20">
        <h1 className="text-2xl font-extrabold text-white mb-1">Select Workout</h1>
        <p className="text-xs text-slate-400 mb-6">Choose an exercise to start.</p>

        <div className="flex flex-col gap-6">
          {families.map((family) => (
            <section key={family}>
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3">
                {family}
              </h2>
              <div className="flex flex-col gap-3">
                {listByFamily(family).map((b) => (
                  <Link
                    key={b.id}
                    href={`/workout/${b.id}`}
                    className="group rounded-xl border border-white/5 bg-slate-900/50 p-5 hover:bg-slate-900 transition-all"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-base font-bold text-white">{b.display_name_ko}</h3>
                        <p className="text-xs text-slate-400 mt-1">{b.target_muscles.join(", ")}</p>
                      </div>
                      <div className="rounded-lg bg-indigo-500/10 p-2.5">
                        <Play className="h-5 w-5 text-indigo-400 group-hover:text-indigo-300" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Delete old static pages**

```bash
rm src/app/workout/pushup/page.tsx
rm src/app/workout/benchpress/page.tsx
rmdir src/app/workout/pushup src/app/workout/benchpress
```

- [ ] **Step 5: Update BottomNav hide-rule**

In `src/components/BottomNav.tsx`, the existing hide rule already covers `/workout/<anything>`. Add a similar hide for `/capture`:

```tsx
if (pathname.startsWith("/capture")) return null;
```

right after the existing `if (pathname.startsWith("/workout/") ...)` block.

- [ ] **Step 6: Manual smoke test**

Run: `npm run dev`
Visit `/workout` — should show "표준 푸쉬업" card from the registry.
Click → routes to `/workout/pushup_standard`.

- [ ] **Step 7: Commit**

```bash
git add src/app/workout/[exercise]/page.tsx src/app/workout/page.tsx src/components/BottomNav.tsx
git rm src/app/workout/pushup/page.tsx src/app/workout/benchpress/page.tsx
git commit -m "feat(routing): exercise dynamic route driven by baseline registry"
```

---

### Task 10: Refactor `PoseDetector.tsx` to consume `lib/pose/*` and accept `baselineId`

**Files:**
- Modify: `src/components/PoseDetector.tsx`

Replace inline math (lines 189–371 of current PoseDetector) with calls to `computeJointAngles`, `RepSegmenter`. Switch to `createPoseLandmarker("full")` (or `pickModelVariant()`). Keep the existing state machine UI for now; rep counting now driven by the segmenter on the elbow angle.

- [ ] **Step 1: Change the props**

Replace:

```tsx
interface PoseDetectorProps {
  exercise: "pushup" | "benchpress";
}
```

with:

```tsx
import { getBaseline } from "@/lib/baseline/registry";

interface PoseDetectorProps {
  baselineId: string;
}
```

At the top of the component, resolve the baseline:

```tsx
const baseline = getBaseline(baselineId);
if (!baseline) return <div className="p-6 text-red-400">Unknown baseline: {baselineId}</div>;
```

- [ ] **Step 2: Replace the MediaPipe loader**

Replace the inline `FilesetResolver.forVisionTasks(...)` + `PoseLandmarker.createFromOptions(...)` block with:

```tsx
import { createPoseLandmarker, resultToFrame, pickModelVariant } from "@/lib/pose/mediapipe";

// inside initializeMediaPipe:
poseLandmarker = await createPoseLandmarker(pickModelVariant());
```

- [ ] **Step 3: Replace the angle math with `computeJointAngles`**

In `predictWebcam` / `processExercise`, when you have `results.landmarks?.[0]` and `results.worldLandmarks?.[0]`, call:

```tsx
import { computeJointAngles } from "@/lib/pose/features";

const frame = resultToFrame(results, performance.now());
if (!frame) { /* visibility lost path */ return; }
const angles = computeJointAngles(frame);
const elbowAngle = angles.elbow_left ?? angles.elbow_right ?? NaN;
```

Reuse the existing `visibleSide` logic to decide left vs right.

- [ ] **Step 4: Replace inline rep counting with `RepSegmenter`**

At the top of `useEffect`:

```tsx
import { RepSegmenter } from "@/lib/pose/segmenter";

const segmenter = new RepSegmenter({
  topThreshold: baseline.rule_thresholds.elbow_top_min,
  bottomThreshold: baseline.rule_thresholds.elbow_bottom_max,
});
```

Inside the `active` branch, replace the existing `if (elbowAngle > 155) ... else if (elbowAngle < 95)` block with:

```tsx
const r = segmenter.push(performance.now(), elbowAngle);
if (r.repCompleted) {
  exerciseState.current.repCount += 1;
  setReps(exerciseState.current.repCount);
  lastRepTimestamp.current = Date.now();
  setFeedback("Good! Keep going.");
}
```

- [ ] **Step 5: Update Supabase save to use baseline metadata**

In `saveWorkout`, change:

```tsx
exercise_type: exercise,
```

to:

```tsx
exercise_type: baseline.exercise_family,
// new column (added in Task 18):
baseline_id: baseline.id,
```

Leave the `score: 100` in place — real scoring lands in Task 19.

- [ ] **Step 6: Manual smoke test**

Run: `npm run dev`. Visit `/workout/pushup_standard`. Verify:
- Camera turns on
- Detection → preparing → active state machine still works
- Rep count still increments on full down-and-up

- [ ] **Step 7: Commit**

```bash
git add src/components/PoseDetector.tsx
git commit -m "refactor(pose): drive PoseDetector from lib/pose modules + baseline thresholds"
```

---

## Phase 1 — Rule-based coaching + capture (Tasks 11–21)

### Task 11: Create `/capture` page skeleton

**Files:**
- Create: `src/app/capture/page.tsx`
- Create: `src/components/CaptureControls.tsx`

This task delivers the UI skeleton + env gate. Recording logic lands in Task 20.

- [ ] **Step 1: Add env flag**

Read `next.config.ts` to confirm shape (Next 16 conventions). Then create `.env.local` if missing and add:

```
NEXT_PUBLIC_ENABLE_CAPTURE=true
```

Also add a default `false` to `.env.example` (create if missing).

- [ ] **Step 2: Write `CaptureControls.tsx` (UI only)**

```tsx
// src/components/CaptureControls.tsx
"use client";

import { listFamilies, listByFamily } from "@/lib/baseline/registry";
import type { ExerciseFamily } from "@/types/exercise";

const DEFECT_OPTIONS = [
  { id: "hip_sag", label: "엉덩이 처짐" },
  { id: "hip_pike", label: "엉덩이 솟음" },
  { id: "elbow_flare", label: "팔꿈치 외전" },
  { id: "shallow_rom", label: "ROM 부족" },
  { id: "asymmetric", label: "좌우 비대칭" },
];

export interface CaptureSettings {
  family: ExerciseFamily;
  variation: string;
  subject: string;
  quality: "good" | "bad";
  defects: string[];
}

export default function CaptureControls(props: {
  value: CaptureSettings;
  onChange: (v: CaptureSettings) => void;
  recording: boolean;
  onToggleRecord: () => void;
  capturedReps: number;
  onDownload: () => void;
}) {
  const { value, onChange, recording, onToggleRecord, capturedReps, onDownload } = props;
  const families = listFamilies();
  const variations = listByFamily(value.family).map((b) => b.variation);

  return (
    <div className="space-y-3 p-4 bg-slate-900/70 rounded-xl border border-white/5 text-xs">
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-slate-400 uppercase">운동</span>
          <select
            value={value.family}
            onChange={(e) => onChange({ ...value, family: e.target.value as ExerciseFamily })}
            className="mt-1 w-full bg-slate-800 rounded px-2 py-1.5 text-white"
          >
            {families.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-slate-400 uppercase">변형</span>
          <select
            value={value.variation}
            onChange={(e) => onChange({ ...value, variation: e.target.value })}
            className="mt-1 w-full bg-slate-800 rounded px-2 py-1.5 text-white"
          >
            {variations.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>
      </div>
      <label className="block">
        <span className="text-slate-400 uppercase">시연자</span>
        <input
          value={value.subject}
          onChange={(e) => onChange({ ...value, subject: e.target.value })}
          className="mt-1 w-full bg-slate-800 rounded px-2 py-1.5 text-white"
          placeholder="team_A"
        />
      </label>
      <div className="flex gap-3">
        <label className="flex items-center gap-2">
          <input type="radio" checked={value.quality === "good"} onChange={() => onChange({ ...value, quality: "good", defects: [] })} />
          <span>Good</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" checked={value.quality === "bad"} onChange={() => onChange({ ...value, quality: "bad" })} />
          <span>Bad</span>
        </label>
      </div>
      {value.quality === "bad" && (
        <div className="grid grid-cols-2 gap-2">
          {DEFECT_OPTIONS.map((d) => (
            <label key={d.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={value.defects.includes(d.id)}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...value.defects, d.id]
                    : value.defects.filter((x) => x !== d.id);
                  onChange({ ...value, defects: next });
                }}
              />
              <span>{d.label}</span>
            </label>
          ))}
        </div>
      )}
      <div className="flex gap-2 pt-2">
        <button
          onClick={onToggleRecord}
          className={`flex-1 py-2 rounded-lg font-bold ${recording ? "bg-red-600" : "bg-indigo-600"} text-white`}
        >
          {recording ? "● 녹화 중지" : "● 녹화 시작"}
        </button>
        <button
          onClick={onDownload}
          disabled={capturedReps === 0}
          className="flex-1 py-2 rounded-lg font-bold bg-slate-700 text-white disabled:opacity-40"
        >
          ⬇ JSON ({capturedReps})
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write `capture/page.tsx` skeleton**

```tsx
// src/app/capture/page.tsx
"use client";

import { useState } from "react";
import CaptureControls, { type CaptureSettings } from "@/components/CaptureControls";

export default function CapturePage() {
  if (process.env.NEXT_PUBLIC_ENABLE_CAPTURE !== "true") {
    return <div className="p-8 text-slate-300">Capture mode is disabled.</div>;
  }

  const [settings, setSettings] = useState<CaptureSettings>({
    family: "pushup",
    variation: "standard",
    subject: "team_A",
    quality: "good",
    defects: [],
  });
  const [recording, setRecording] = useState(false);
  const [capturedReps] = useState(0);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4">
      <h1 className="text-xl font-bold mb-4">Capture Mode (dev only)</h1>
      <CaptureControls
        value={settings}
        onChange={setSettings}
        recording={recording}
        onToggleRecord={() => setRecording(!recording)}
        capturedReps={capturedReps}
        onDownload={() => alert("download not yet implemented")}
      />
      <div className="mt-4 aspect-video bg-black rounded-xl flex items-center justify-center text-slate-500">
        (camera + landmarks land in Task 20)
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Smoke test**

Run: `npm run dev`. Visit `/capture`. Verify form renders, dropdowns populate from registry, no console errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/capture/page.tsx src/components/CaptureControls.tsx .env.example
git commit -m "feat(capture): /capture page UI skeleton + env gate"
```

---

### Task 12: Author real `pushup_standard.json` baseline

**Files:**
- Modify: `public/baselines/pushup_standard.json`

Hand-author a 50-frame baseline for a textbook pushup. Values are degrees. Phase 0–0.5 = top→bottom, 0.5–1.0 = bottom→top.

- [ ] **Step 1: Replace the file**

```json
{
  "id": "pushup_standard",
  "exercise_family": "pushup",
  "variation": "standard",
  "display_name_ko": "표준 푸쉬업",
  "camera_view": "front",
  "target_muscles": ["chest_mid", "triceps", "shoulders_front"],
  "joints_used": ["elbow_left", "elbow_right", "shoulder_left", "shoulder_right", "hip_left", "hip_right", "body_line"],
  "rep_length_frames": 50,
  "trajectory": {
    "elbow_left":     [170,170,168,165,160,154,147,139,131,123,115,108,101,96,92,90,89,88,88,88,89,90,92,96,101,108,115,123,131,139,147,154,160,165,168,170,170,170,170,170,170,170,170,170,170,170,170,170,170,170],
    "elbow_right":    [170,170,168,165,160,154,147,139,131,123,115,108,101,96,92,90,89,88,88,88,89,90,92,96,101,108,115,123,131,139,147,154,160,165,168,170,170,170,170,170,170,170,170,170,170,170,170,170,170,170],
    "shoulder_left":  [ 40, 41, 43, 46, 49, 53, 57, 61, 65, 68, 71, 73, 75, 76, 76, 76, 76, 76, 76, 76, 76, 76, 75, 73, 71, 68, 65, 61, 57, 53, 49, 46, 43, 41, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40],
    "shoulder_right": [ 40, 41, 43, 46, 49, 53, 57, 61, 65, 68, 71, 73, 75, 76, 76, 76, 76, 76, 76, 76, 76, 76, 75, 73, 71, 68, 65, 61, 57, 53, 49, 46, 43, 41, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40],
    "hip_left":       [175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175],
    "hip_right":      [175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175,175],
    "body_line":      [178,178,178,178,178,178,178,178,178,178,178,178,178,178,178,178,178,178,178,178,178,178,178,178,178,178,178,178,178,178,178,178,178,178,178,178,178,178,178,178,178,178,178,178,178,178,178,178,178,178]
  },
  "embedding": null,
  "phase_anchors": { "top": 0, "bottom": 0.5, "top2": 1 },
  "rule_thresholds": {
    "elbow_top_min": 155,
    "elbow_bottom_max": 95,
    "body_line_min": 165,
    "hip_min": 165
  },
  "captured_by": "hand_authored_v1",
  "captured_at": "2026-05-22",
  "version": 1
}
```

- [ ] **Step 2: Verify validator still accepts**

Run: `npm test -- registry schema`
Expected: all pass.

- [ ] **Step 3: Commit**

```bash
git add public/baselines/pushup_standard.json
git commit -m "feat(baseline): hand-authored standard pushup baseline (50 frames)"
```

---

### Task 13: `lib/coach/scoring.ts` — rep-level score (TDD)

**Files:**
- Create: `src/lib/coach/scoring.ts`
- Test: `src/lib/coach/scoring.test.ts`

Take a captured rep (variable-length joint angle series) + a `Baseline`, resample to `rep_length_frames`, compute per-joint mean absolute deviation, weight, return 0–100 score + per-joint breakdown.

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test, verify fail**

Run: `npm test -- scoring`

- [ ] **Step 3: Implement**

```ts
// src/lib/coach/scoring.ts
import { resampleSeries } from "@/lib/pose/normalize";
import type { Baseline } from "@/lib/baseline/types";
import type { JointName } from "@/types/exercise";

export interface ScoreResult {
  score: number;                       // 0..100
  perJoint: Partial<Record<JointName, number>>;
}

// Tolerance per joint (degrees). Beyond ±tol, score drops sharply.
const DEFAULT_TOLERANCE = 15;
const PER_JOINT_TOLERANCE: Partial<Record<JointName, number>> = {
  body_line: 6,  // strict — hip sag is a key defect
  hip_left: 8,
  hip_right: 8,
};

function jointScore(diff: number, tol: number): number {
  // 0 diff → 100, tol diff → 50, 2*tol → 0
  return Math.max(0, 100 - (diff / tol) * 50);
}

export function scoreRep(
  baseline: Baseline,
  userTrajectory: Partial<Record<JointName, number[]>>,
): ScoreResult {
  const perJoint: Partial<Record<JointName, number>> = {};
  const weights: number[] = [];
  const scores: number[] = [];

  for (const joint of baseline.joints_used) {
    const baseSeries = baseline.trajectory[joint];
    const userSeries = userTrajectory[joint];
    if (!baseSeries || !userSeries || userSeries.length === 0) continue;

    const resampled = resampleSeries(userSeries, baseline.rep_length_frames);
    let sumAbsDiff = 0;
    for (let i = 0; i < baseSeries.length; i++) {
      sumAbsDiff += Math.abs(resampled[i] - baseSeries[i]);
    }
    const meanDiff = sumAbsDiff / baseSeries.length;
    const tol = PER_JOINT_TOLERANCE[joint] ?? DEFAULT_TOLERANCE;
    const s = jointScore(meanDiff, tol);

    perJoint[joint] = Math.round(s);
    scores.push(s);
    weights.push(joint === "body_line" || joint.startsWith("hip") ? 2 : 1);
  }

  if (scores.length === 0) return { score: 0, perJoint };

  const totalW = weights.reduce((a, b) => a + b, 0);
  const weighted = scores.reduce((acc, s, i) => acc + s * weights[i], 0) / totalW;
  return { score: Math.round(weighted), perJoint };
}
```

- [ ] **Step 4: Run tests, verify pass**

Run: `npm test -- scoring`
Expected: 4 passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/coach/scoring.ts src/lib/coach/scoring.test.ts
git commit -m "feat(coach): rule-based rep scoring vs baseline trajectory"
```

---

### Task 14: `lib/coach/realtimeGuide.ts` — frame-level phase + deviation (TDD)

**Files:**
- Create: `src/lib/coach/realtimeGuide.ts`
- Test: `src/lib/coach/realtimeGuide.test.ts`

Per-frame: given current angles + baseline, estimate phase ∈ [0,1] (from elbow angle), look up expected angles at that phase via interpolation, return per-joint deviation + worst joint + a defect candidate id.

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test -- realtimeGuide`

- [ ] **Step 3: Implement**

```ts
// src/lib/coach/realtimeGuide.ts
import type { Baseline } from "@/lib/baseline/types";
import type { JointName } from "@/types/exercise";

/**
 * Estimate current phase ∈ [0, 0.5] purely from elbow extension level.
 * NOTE: We can't distinguish down-phase from up-phase from a single frame,
 * so we map elbow to half-phase. The caller can use velocity sign if needed.
 */
export function estimatePhase(baseline: Baseline, currentElbow: number): number {
  const elbow = baseline.trajectory.elbow_left ?? baseline.trajectory.elbow_right;
  if (!elbow) return 0;
  const top = Math.max(...elbow);
  const bottom = Math.min(...elbow);
  if (top === bottom) return 0;
  const clamped = Math.max(bottom, Math.min(top, currentElbow));
  return ((top - clamped) / (top - bottom)) * 0.5;
}

function expectedAt(series: number[], phase: number): number {
  // phase ∈ [0,1] → fractional index over series
  const t = phase * (series.length - 1);
  const lo = Math.floor(t);
  const hi = Math.min(lo + 1, series.length - 1);
  const f = t - lo;
  return series[lo] * (1 - f) + series[hi] * f;
}

export interface FrameGuidance {
  phase: number;
  deviations: Partial<Record<JointName, number>>;
  worstJoint: JointName | null;
  worstDiff: number;
  ok: boolean;
}

const OK_THRESHOLD = 10; // degrees

export function frameGuidance(
  baseline: Baseline,
  currentAngles: Partial<Record<JointName, number>>,
): FrameGuidance {
  const elbow = currentAngles.elbow_left ?? currentAngles.elbow_right ?? NaN;
  const phase = Number.isFinite(elbow) ? estimatePhase(baseline, elbow) : 0;

  const deviations: Partial<Record<JointName, number>> = {};
  let worstJoint: JointName | null = null;
  let worstDiff = 0;

  for (const joint of baseline.joints_used) {
    const series = baseline.trajectory[joint];
    const cur = currentAngles[joint];
    if (!series || cur == null || !Number.isFinite(cur)) continue;
    // Use phase mapped over full trajectory (works for down/up symmetrically).
    const exp = expectedAt(series, phase * 2); // phase ∈ [0,0.5] → expectedAt accepts [0,1]
    const diff = Math.abs(cur - exp);
    deviations[joint] = diff;
    if (diff > worstDiff) { worstDiff = diff; worstJoint = joint; }
  }

  return { phase, deviations, worstJoint, worstDiff, ok: worstDiff <= OK_THRESHOLD };
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npm test -- realtimeGuide`
Expected: 4 passing.

- [ ] **Step 5: Commit**

```bash
git add src/lib/coach/realtimeGuide.ts src/lib/coach/realtimeGuide.test.ts
git commit -m "feat(coach): frame-level phase estimation + per-joint deviation"
```

---

### Task 15: `lib/coach/defectMessages.ts` — Korean defect strings

**Files:**
- Create: `src/lib/coach/defectMessages.ts`

- [ ] **Step 1: Write the file**

```ts
// src/lib/coach/defectMessages.ts
import type { JointName } from "@/types/exercise";

/** Map (worst joint, sign of deviation) → defect id + Korean coaching string. */
export interface DefectHint {
  id: string;
  message: string;
}

export function hintFromWorstJoint(
  joint: JointName | null,
  signedDiff: number, // current - expected; positive = too straight, negative = too flexed
): DefectHint | null {
  if (!joint) return null;
  switch (joint) {
    case "body_line":
      return signedDiff < 0
        ? { id: "hip_sag", message: "엉덩이 살짝 올려주세요" }
        : { id: "hip_pike", message: "엉덩이를 낮춰주세요" };
    case "hip_left":
    case "hip_right":
      return { id: "hip_sag", message: "엉덩이 라인 맞춰주세요" };
    case "shoulder_left":
    case "shoulder_right":
      return signedDiff > 0
        ? { id: "elbow_flare", message: "팔꿈치가 너무 벌어졌어요" }
        : { id: "shoulder_tight", message: "어깨 자연스럽게 펴주세요" };
    case "elbow_left":
    case "elbow_right":
      return signedDiff > 0
        ? { id: "shallow_rom", message: "조금 더 내려가주세요" }
        : { id: "deep_overload", message: "조금만 올려도 OK" };
    default:
      return null;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/coach/defectMessages.ts
git commit -m "feat(coach): Korean coaching hint strings by worst joint"
```

---

### Task 16: `SkeletonOverlay.tsx` — color-coded skeleton

**Files:**
- Create: `src/components/SkeletonOverlay.tsx`

Drop-in canvas component. Takes landmarks + per-joint deviations + canvas size. Draws bones/joints colored green / amber / red by deviation magnitude.

- [ ] **Step 1: Write the component**

```tsx
// src/components/SkeletonOverlay.tsx
"use client";

import { useEffect, useRef } from "react";
import type { Landmark2D, JointName } from "@/types/exercise";
import { LANDMARK_INDEX } from "@/types/exercise";

interface Props {
  landmarks: Landmark2D[] | null;
  deviations: Partial<Record<JointName, number>>;
  width: number;
  height: number;
  className?: string;
}

// Bones to draw: pairs of landmark indices + the joint name that "owns" the bone for coloring.
const BONES: { from: number; to: number; joint: JointName }[] = [
  { from: LANDMARK_INDEX.leftShoulder,  to: LANDMARK_INDEX.leftElbow,    joint: "shoulder_left" },
  { from: LANDMARK_INDEX.leftElbow,     to: LANDMARK_INDEX.leftWrist,    joint: "elbow_left" },
  { from: LANDMARK_INDEX.rightShoulder, to: LANDMARK_INDEX.rightElbow,   joint: "shoulder_right" },
  { from: LANDMARK_INDEX.rightElbow,    to: LANDMARK_INDEX.rightWrist,   joint: "elbow_right" },
  { from: LANDMARK_INDEX.leftShoulder,  to: LANDMARK_INDEX.leftHip,      joint: "body_line" },
  { from: LANDMARK_INDEX.rightShoulder, to: LANDMARK_INDEX.rightHip,     joint: "body_line" },
  { from: LANDMARK_INDEX.leftHip,       to: LANDMARK_INDEX.leftKnee,     joint: "hip_left" },
  { from: LANDMARK_INDEX.rightHip,      to: LANDMARK_INDEX.rightKnee,    joint: "hip_right" },
  { from: LANDMARK_INDEX.leftKnee,      to: LANDMARK_INDEX.leftAnkle,    joint: "knee_left" },
  { from: LANDMARK_INDEX.rightKnee,     to: LANDMARK_INDEX.rightAnkle,   joint: "knee_right" },
];

function colorForDiff(diff: number | undefined): string {
  if (diff == null) return "#4f46e5"; // indigo fallback
  if (diff < 8) return "#22c55e";     // green
  if (diff < 18) return "#f59e0b";    // amber
  return "#ef4444";                   // red
}

export default function SkeletonOverlay({ landmarks, deviations, width, height, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    c.width = width; c.height = height;
    ctx.clearRect(0, 0, width, height);
    if (!landmarks) return;

    ctx.lineWidth = 4;
    for (const b of BONES) {
      const a = landmarks[b.from], z = landmarks[b.to];
      if (!a || !z) continue;
      ctx.strokeStyle = colorForDiff(deviations[b.joint]);
      ctx.beginPath();
      ctx.moveTo(a.x * width, a.y * height);
      ctx.lineTo(z.x * width, z.y * height);
      ctx.stroke();
    }
    ctx.fillStyle = "#ffffff";
    for (const lm of landmarks) {
      ctx.beginPath();
      ctx.arc(lm.x * width, lm.y * height, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [landmarks, deviations, width, height]);

  return <canvas ref={canvasRef} className={className} />;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/SkeletonOverlay.tsx
git commit -m "feat(ui): SkeletonOverlay with per-joint color coding"
```

---

### Task 17: `FormHud.tsx` — live score + hint toast

**Files:**
- Create: `src/components/FormHud.tsx`

- [ ] **Step 1: Write the component**

```tsx
// src/components/FormHud.tsx
"use client";

interface Props {
  reps: number;
  lastRepScore: number | null;
  averageScore: number | null;
  hint: string | null;
  phase: number;
}

export default function FormHud({ reps, lastRepScore, averageScore, hint, phase }: Props) {
  return (
    <>
      <div className="absolute top-16 left-4 right-4 z-40 flex gap-3">
        <div className="flex-1 backdrop-blur-md bg-black/60 px-4 py-2 rounded-xl border border-white/5 flex items-center justify-between">
          <span className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">Reps</span>
          <span className="text-2xl font-extrabold text-indigo-400">{reps}</span>
        </div>
        <div className="flex-1 backdrop-blur-md bg-black/60 px-4 py-2 rounded-xl border border-white/5 flex items-center justify-between">
          <span className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">Last</span>
          <span className="text-2xl font-extrabold text-green-400">
            {lastRepScore != null ? lastRepScore : "—"}
          </span>
        </div>
        <div className="flex-1 backdrop-blur-md bg-black/60 px-4 py-2 rounded-xl border border-white/5 flex items-center justify-between">
          <span className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">Avg</span>
          <span className="text-2xl font-extrabold text-cyan-400">
            {averageScore != null ? averageScore : "—"}
          </span>
        </div>
      </div>

      {/* Phase bar */}
      <div className="absolute top-28 left-4 right-4 z-40">
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 transition-[width] duration-100"
            style={{ width: `${Math.min(100, Math.max(0, phase * 2 * 100))}%` }}
          />
        </div>
      </div>

      {hint && (
        <div className="absolute bottom-20 left-4 right-4 z-40 flex justify-center">
          <div className="backdrop-blur-md bg-amber-500/20 border border-amber-500/40 text-amber-200 px-5 py-3 rounded-xl text-center">
            <span className="text-xs font-bold">💡 {hint}</span>
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/FormHud.tsx
git commit -m "feat(ui): FormHud with live reps/score and hint toast"
```

---

### Task 18: Supabase migration — add scoring columns

**Files:**
- Create: `supabase_migrations/20260522_add_form_scoring.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase_migrations/20260522_add_form_scoring.sql
-- Run this in Supabase SQL editor after deploying app changes.

ALTER TABLE workouts
  ADD COLUMN IF NOT EXISTS baseline_id TEXT,
  ADD COLUMN IF NOT EXISTS rep_scores JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS defects JSONB DEFAULT '{}'::jsonb;

-- Update the leaderboard view to surface average form score.
CREATE OR REPLACE VIEW leaderboard AS
SELECT
  user_id,
  SUM(reps * (CASE WHEN weight > 0 THEN weight ELSE 1 END)) AS total_volume,
  MAX(score) AS best_score,
  AVG(score) AS avg_score,
  COUNT(id) AS total_workouts
FROM workouts
GROUP BY user_id
ORDER BY total_volume DESC;
```

- [ ] **Step 2: Apply manually**

Tell the human: run this SQL in Supabase SQL editor. Don't proceed to Task 19 until they confirm.

- [ ] **Step 3: Commit**

```bash
git add supabase_migrations/20260522_add_form_scoring.sql
git commit -m "feat(db): add rep_scores/defects/baseline_id to workouts table"
```

---

### Task 19: Wire real-time coaching into PoseDetector

**Files:**
- Modify: `src/components/PoseDetector.tsx`

Integrate `frameGuidance`, `SkeletonOverlay`, `FormHud`, `scoreRep`. Capture per-rep joint angle series during `active` state; on `repCompleted`, call `scoreRep` and update HUD.

- [ ] **Step 1: Add refs/state for per-rep capture**

Inside the component, near other refs:

```tsx
import { frameGuidance } from "@/lib/coach/realtimeGuide";
import { scoreRep, type ScoreResult } from "@/lib/coach/scoring";
import { hintFromWorstJoint } from "@/lib/coach/defectMessages";
import { computeJointAngles } from "@/lib/pose/features";
import SkeletonOverlay from "./SkeletonOverlay";
import FormHud from "./FormHud";
import type { JointName, Landmark2D } from "@/types/exercise";

const currentRepAngles = useRef<Partial<Record<JointName, number[]>>>({});
const [repScores, setRepScores] = useState<number[]>([]);
const [hint, setHint] = useState<string | null>(null);
const [phase, setPhase] = useState(0);
const [deviations, setDeviations] = useState<Partial<Record<JointName, number>>>({});
const [overlayLandmarks, setOverlayLandmarks] = useState<Landmark2D[] | null>(null);
```

- [ ] **Step 2: In the per-frame loop, after `computeJointAngles`, do**

```tsx
const angles = computeJointAngles(frame);
const elbowAngle = angles.elbow_left ?? angles.elbow_right ?? NaN;

// Update overlay state (visible regardless of status)
setOverlayLandmarks(frame.landmarks2D);

if (statusRef.current === "active") {
  // 1) Accumulate per-rep angles
  for (const joint of baseline.joints_used) {
    const v = angles[joint];
    if (Number.isFinite(v)) {
      if (!currentRepAngles.current[joint]) currentRepAngles.current[joint] = [];
      currentRepAngles.current[joint]!.push(v as number);
    }
  }

  // 2) Real-time guidance (rule-based, no model)
  const g = frameGuidance(baseline, angles);
  setDeviations(g.deviations);
  setPhase(g.phase);

  // Hint: only show when ok=false to avoid spam
  if (!g.ok && g.worstJoint) {
    const series = baseline.trajectory[g.worstJoint]!;
    const idx = g.phase * 2 * (series.length - 1);
    const lo = Math.floor(idx);
    const exp = series[lo];
    const cur = angles[g.worstJoint]!;
    setHint(hintFromWorstJoint(g.worstJoint, cur - exp)?.message ?? null);
  } else {
    setHint(null);
  }

  // 3) Rep boundary
  const seg = segmenter.push(performance.now(), elbowAngle);
  if (seg.repCompleted) {
    exerciseState.current.repCount += 1;
    setReps(exerciseState.current.repCount);

    const userTraj = currentRepAngles.current;
    const result: ScoreResult = scoreRep(baseline, userTraj);
    setRepScores((prev) => [...prev, result.score]);

    currentRepAngles.current = {};
    lastRepTimestamp.current = Date.now();
  }
}
```

- [ ] **Step 3: Add HUD + overlay to JSX**

Inside the `<main>` block, alongside the existing `<video>` and `<canvas>` (you may remove the old `<canvas>` once SkeletonOverlay replaces it):

```tsx
<SkeletonOverlay
  landmarks={overlayLandmarks}
  deviations={deviations}
  width={1280}
  height={720}
  className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
/>
<FormHud
  reps={reps}
  lastRepScore={repScores.length ? repScores[repScores.length - 1] : null}
  averageScore={repScores.length ? Math.round(repScores.reduce((a, b) => a + b, 0) / repScores.length) : null}
  hint={hint}
  phase={phase}
/>
```

Delete the old "Floating Status Bar for Reps & Score" block (lines 406–415 of the original file) — `FormHud` replaces it.

- [ ] **Step 4: Update `saveWorkout` to persist rep_scores + defects**

```tsx
const { error } = await supabase.from("workouts").insert([{
  user_id: session.user.id,
  exercise_type: baseline.exercise_family,
  baseline_id: baseline.id,
  reps: repCount,
  weight: 0,
  score: repScores.length ? Math.round(repScores.reduce((a, b) => a + b, 0) / repScores.length) : 0,
  rep_scores: repScores,
  defects: {},   // populated in Phase 2 with model output
}]);
```

- [ ] **Step 5: Manual smoke test**

Run: `npm run dev`. Do a pushup in front of the camera. Verify:
- Skeleton overlay paints in green (or amber/red if your form is off)
- Reps counter increments
- "Last" score updates after each rep
- Hint toast appears when body_line deviation > 10°
- On Finish, leaderboard shows the avg score

- [ ] **Step 6: Commit**

```bash
git add src/components/PoseDetector.tsx
git commit -m "feat(coach): wire real-time guidance + per-rep scoring into PoseDetector"
```

---

### Task 20: Implement `/capture` recording + JSON download

**Files:**
- Modify: `src/app/capture/page.tsx`

Add MediaPipe loop, raw frame collection, auto rep segmentation, JSON blob download.

- [ ] **Step 1: Replace page contents**

```tsx
// src/app/capture/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import CaptureControls, { type CaptureSettings } from "@/components/CaptureControls";
import { createPoseLandmarker, resultToFrame } from "@/lib/pose/mediapipe";
import { computeJointAngles } from "@/lib/pose/features";
import { RepSegmenter } from "@/lib/pose/segmenter";
import type { PoseFrame } from "@/types/exercise";
import type { PoseLandmarker } from "@mediapipe/tasks-vision";

interface CapturedRep {
  meta: CaptureSettings & { captured_at: string };
  frames: PoseFrame[];
}

export default function CapturePage() {
  if (process.env.NEXT_PUBLIC_ENABLE_CAPTURE !== "true") {
    return <div className="p-8 text-slate-300">Capture mode is disabled.</div>;
  }

  const videoRef = useRef<HTMLVideoElement>(null);
  const [settings, setSettings] = useState<CaptureSettings>({
    family: "pushup", variation: "standard", subject: "team_A", quality: "good", defects: [],
  });
  const [recording, setRecording] = useState(false);
  const [reps, setReps] = useState<CapturedRep[]>([]);
  const recordingRef = useRef(false);
  const settingsRef = useRef(settings);
  const currentFrames = useRef<PoseFrame[]>([]);

  useEffect(() => { recordingRef.current = recording; }, [recording]);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  useEffect(() => {
    let landmarker: PoseLandmarker | null = null;
    let raf = 0;
    let lastT = -1;
    const segmenter = new RepSegmenter({ topThreshold: 155, bottomThreshold: 95 });

    (async () => {
      landmarker = await createPoseLandmarker("full");
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 }, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const loop = () => {
        const v = videoRef.current;
        if (v && landmarker && v.currentTime !== lastT) {
          lastT = v.currentTime;
          const t = performance.now();
          const result = landmarker.detectForVideo(v, t);
          const frame = resultToFrame(result, t);
          if (frame && recordingRef.current) {
            currentFrames.current.push(frame);
            const angles = computeJointAngles(frame);
            const elbow = angles.elbow_left ?? angles.elbow_right ?? NaN;
            if (Number.isFinite(elbow)) {
              const seg = segmenter.push(t, elbow as number);
              if (seg.repCompleted) {
                setReps((prev) => [...prev, {
                  meta: { ...settingsRef.current, captured_at: new Date().toISOString() },
                  frames: currentFrames.current.slice(),
                }]);
                currentFrames.current = [];
              }
            }
          }
        }
        raf = requestAnimationFrame(loop);
      };
      loop();
    })();

    return () => {
      cancelAnimationFrame(raf);
      if (landmarker) landmarker.close();
      const s = videoRef.current?.srcObject as MediaStream | null;
      s?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify({ reps }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `capture_${settings.family}_${settings.subject}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4">
      <h1 className="text-xl font-bold mb-4">Capture Mode (dev only)</h1>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="aspect-video bg-black rounded-xl overflow-hidden">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
        </div>
        <CaptureControls
          value={settings}
          onChange={setSettings}
          recording={recording}
          onToggleRecord={() => setRecording((r) => !r)}
          capturedReps={reps.length}
          onDownload={downloadJSON}
        />
      </div>
      <ul className="mt-4 text-xs text-slate-300 space-y-1">
        {reps.map((r, i) => (
          <li key={i}>
            #{i + 1} — {r.meta.family}/{r.meta.variation} ({r.meta.quality}) · {r.frames.length} frames
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 2: Manual smoke test**

Visit `/capture`. Do 2 pushups while recording. Stop. Click download. Open the JSON — verify 2 reps with frames and meta.

- [ ] **Step 3: Commit**

```bash
git add src/app/capture/page.tsx
git commit -m "feat(capture): record reps via MediaPipe + segmenter + JSON download"
```

---

### Task 21: Workout completion result card

**Files:**
- Create: `src/components/WorkoutResultCard.tsx`
- Modify: `src/components/PoseDetector.tsx`

Replace the current `status === 'completed'` block in PoseDetector with a dedicated component that shows per-rep score bars and the most-common defect list.

- [ ] **Step 1: Write the component**

```tsx
// src/components/WorkoutResultCard.tsx
"use client";

import Link from "next/link";

interface Props {
  reps: number;
  repScores: number[];
  defectCounts: Record<string, number>;
  defectLabels: Record<string, string>;
  onRetry: () => void;
}

export default function WorkoutResultCard({ reps, repScores, defectCounts, defectLabels, onRetry }: Props) {
  const avg = repScores.length ? Math.round(repScores.reduce((a, b) => a + b, 0) / repScores.length) : 0;
  const max = Math.max(100, ...repScores);
  const topDefects = Object.entries(defectCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md z-50 p-6">
      <div className="w-full max-w-sm">
        <h3 className="text-xl font-bold text-white text-center mb-1">🎉 운동 완료!</h3>
        <p className="text-sm text-slate-400 text-center mb-6">총 {reps} reps · 평균 {avg}점</p>

        <div className="mb-6">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Rep별 점수</p>
          <div className="flex items-end gap-1 h-24">
            {repScores.map((s, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-full rounded-t ${s >= 85 ? "bg-green-500" : s >= 65 ? "bg-amber-500" : "bg-red-500"}`}
                  style={{ height: `${(s / max) * 100}%` }}
                  title={`Rep ${i + 1}: ${s}`}
                />
              </div>
            ))}
          </div>
        </div>

        {topDefects.length > 0 && (
          <div className="mb-6">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">자주 발생한 결함</p>
            <ul className="text-xs text-slate-300 space-y-1">
              {topDefects.map(([id, count]) => (
                <li key={id} className="flex justify-between">
                  <span>• {defectLabels[id] ?? id}</span>
                  <span className="text-slate-500">{count}회</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-3">
          <Link href="/leaderboard" className="flex-1 bg-indigo-600 text-white text-center py-2 rounded-xl text-xs font-bold">
            리더보드로 가기
          </Link>
          <button onClick={onRetry} className="flex-1 bg-slate-800 text-slate-300 py-2 rounded-xl text-xs font-bold">
            한 번 더
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Track defect counts in PoseDetector**

In `PoseDetector.tsx`, near `repScores`:

```tsx
const [defectCounts, setDefectCounts] = useState<Record<string, number>>({});
```

When `frameGuidance` returns `!g.ok && g.worstJoint`, also bump counts (in the hint branch from Task 19):

```tsx
const hint = hintFromWorstJoint(g.worstJoint, cur - exp);
if (hint) {
  setHint(hint.message);
  setDefectCounts((prev) => ({ ...prev, [hint.id]: (prev[hint.id] ?? 0) + 1 }));
} else {
  setHint(null);
}
```

Also persist them in `saveWorkout`:

```tsx
defects: defectCounts,
```

- [ ] **Step 3: Replace completed-state JSX**

In `PoseDetector.tsx`, replace the existing `{status === 'completed' && (...)}` block with:

```tsx
{status === "completed" && (
  <WorkoutResultCard
    reps={reps}
    repScores={repScores}
    defectCounts={defectCounts}
    defectLabels={{
      hip_sag: "엉덩이 처짐",
      hip_pike: "엉덩이 솟음",
      elbow_flare: "팔꿈치 외전",
      shallow_rom: "ROM 부족",
      shoulder_tight: "어깨 경직",
      deep_overload: "과한 하강",
    }}
    onRetry={() => {
      exerciseState.current.repCount = 0;
      setReps(0);
      setRepScores([]);
      setDefectCounts({});
      updateStatus("detecting");
    }}
  />
)}
```

Add the import:

```tsx
import WorkoutResultCard from "./WorkoutResultCard";
```

- [ ] **Step 4: Smoke test**

Do a workout with intentional bad reps. Verify the result card renders bars (red/amber/green by score) and lists the defects you triggered.

- [ ] **Step 5: Commit**

```bash
git add src/components/WorkoutResultCard.tsx src/components/PoseDetector.tsx
git commit -m "feat(ui): workout completion card with per-rep bars + defect summary"
```

---

### Task 22: Leaderboard surface form score

**Files:**
- Modify: `src/app/leaderboard/page.tsx`

Read existing leaderboard page and add an "Avg Form" column reading from `avg_score` (new column from migration in Task 18). Read the file first to see its current shape.

- [ ] **Step 1: Read current leaderboard**

Read `src/app/leaderboard/page.tsx` fully before editing.

- [ ] **Step 2: Add `avg_score` to the SELECT**

Locate the supabase query (likely `supabase.from("leaderboard").select(...)`) and add `avg_score` to the select list. Render it in the table as a new column "평균 폼".

- [ ] **Step 3: Smoke test**

Run dev server. Log in, do a workout. Visit leaderboard. Verify the average form score column shows your latest average.

- [ ] **Step 4: Commit**

```bash
git add src/app/leaderboard/page.tsx
git commit -m "feat(leaderboard): surface average form score column"
```

---

## Verification before declaring Phase 0+1 done

- [ ] **All unit tests pass**

Run: `npm test`
Expected: All tests from Tasks 3, 4, 5, 7, 8, 13, 14 pass (≥ 16 cases).

- [ ] **Build succeeds**

Run: `npm run build`
Expected: Next.js build completes with no type errors.

- [ ] **Manual E2E**

1. `npm run dev` → log in → `/workout` shows registry-driven menu.
2. Click "표준 푸쉬업" → routes to `/workout/pushup_standard`.
3. Do 3 pushups with intentional hip sag on rep 2.
4. Verify: skeleton bones go amber/red on body_line during rep 2; hint toast shows "엉덩이 살짝 올려주세요"; rep 2 score < rep 1 and rep 3.
5. Finish → leaderboard shows new entry with avg form score reflecting the dip.
6. `/capture` with `NEXT_PUBLIC_ENABLE_CAPTURE=true` → record 2 reps → download JSON → verify file has 2 entries with frames + meta.

- [ ] **Final commit**

```bash
git tag phase-0-1-complete
```

---

## Out of Scope (do NOT do in this plan)

- Training Siamese / Defect models — separate Phase 2 plan
- ONNX inference in browser
- `embedding` field population in baselines
- Variation expansion beyond `pushup_standard` (Phase 3)
- Benchpress side-camera handling (Phase 3)
- Auth/profile changes
- Mobile-specific optimizations
