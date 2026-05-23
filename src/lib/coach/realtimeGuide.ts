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
    // Use phase mapped over full trajectory.
    const exp = expectedAt(series, phase);
    const diff = Math.abs(cur - exp);
    deviations[joint] = diff;
    if (diff > worstDiff) { worstDiff = diff; worstJoint = joint; }
  }

  return { phase, deviations, worstJoint, worstDiff, ok: worstDiff <= OK_THRESHOLD };
}
