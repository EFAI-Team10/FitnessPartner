// src/lib/coach/scoring.ts
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

/** Compute Dynamic Time Warping distance between two numeric series. */
export function dtwDistance(a: number[], b: number[]): number {
  const n = a.length;
  const m = b.length;
  if (n === 0 || m === 0) return 0;

  const dp: number[][] = Array.from({ length: n }, () => Array(m).fill(Infinity));

  dp[0][0] = Math.abs(a[0] - b[0]);
  for (let i = 1; i < n; i++) {
    dp[i][0] = dp[i - 1][0] + Math.abs(a[i] - b[0]);
  }
  for (let j = 1; j < m; j++) {
    dp[0][j] = dp[0][j - 1] + Math.abs(a[0] - b[j]);
  }

  for (let i = 1; i < n; i++) {
    for (let j = 1; j < m; j++) {
      const cost = Math.abs(a[i] - b[j]);
      dp[i][j] = cost + Math.min(
        dp[i - 1][j],     // insertion
        dp[i][j - 1],     // deletion
        dp[i - 1][j - 1]  // match
      );
    }
  }

  // Backtrack to find warping path length
  let i = n - 1;
  let j = m - 1;
  let pathLength = 1;
  while (i > 0 || j > 0) {
    pathLength++;
    if (i === 0) {
      j--;
    } else if (j === 0) {
      i--;
    } else {
      const min = Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      if (min === dp[i - 1][j - 1]) {
        i--;
        j--;
      } else if (min === dp[i - 1][j]) {
        i--;
      } else {
        j--;
      }
    }
  }

  return dp[n - 1][m - 1] / pathLength;
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

    const meanDiff = dtwDistance(baseSeries, userSeries);
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
