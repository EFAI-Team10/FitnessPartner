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
