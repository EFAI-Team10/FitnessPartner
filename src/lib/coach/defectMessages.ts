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
