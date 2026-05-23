// src/lib/pose/segmenter.test.ts
import { describe, it, expect } from "vitest";
import { RepSegmenter } from "./segmenter";

describe("RepSegmenter", () => {
  it("counts one rep on full down-and-up cycle", () => {
    const seg = new RepSegmenter({ topThreshold: 155, bottomThreshold: 95 });
    const sequence = [170, 150, 130, 100, 90, 100, 130, 150, 170];
    let reps = 0;
    sequence.forEach((a, i) => { if (seg.push(i * 50, a).repCompleted) reps += 1; });
    expect(reps).toBe(1);
  });

  it("does not count if bottom not reached", () => {
    const seg = new RepSegmenter({ topThreshold: 155, bottomThreshold: 95 });
    const sequence = [170, 150, 140, 130, 140, 150, 170]; // never below 95
    let reps = 0;
    sequence.forEach((a, i) => { if (seg.push(i * 50, a).repCompleted) reps += 1; });
    expect(reps).toBe(0);
  });

  it("emits the frames array on rep completion", () => {
    const seg = new RepSegmenter({ topThreshold: 155, bottomThreshold: 95 });
    const seq = [170, 150, 130, 100, 90, 100, 130, 150, 170];
    let frames: { tMs: number; angle: number }[] = [];
    seq.forEach((a, i) => {
      const r = seg.push(i * 50, a);
      if (r.repCompleted && r.repFrames) frames = r.repFrames;
    });
    expect(frames.length).toBe(seq.length);
    expect(frames[0].angle).toBe(170);
  });
});
