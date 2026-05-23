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
