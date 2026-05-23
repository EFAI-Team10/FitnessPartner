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
