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
