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
