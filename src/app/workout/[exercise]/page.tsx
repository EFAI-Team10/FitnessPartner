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
