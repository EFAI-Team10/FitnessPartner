// src/components/WorkoutResultCard.tsx
"use client";

import Link from "next/link";

interface Props {
  reps: number;
  repScores: number[];
  defectCounts: Record<string, number>;
  defectLabels: Record<string, string>;
  onRetry: () => void;
}

export default function WorkoutResultCard({ reps, repScores, defectCounts, defectLabels, onRetry }: Props) {
  const avg = repScores.length ? Math.round(repScores.reduce((a, b) => a + b, 0) / repScores.length) : 0;
  const max = Math.max(100, ...repScores);
  const topDefects = Object.entries(defectCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md z-50 p-6">
      <div className="w-full max-w-sm">
        <h3 className="text-xl font-bold text-white text-center mb-1">🎉 운동 완료!</h3>
        <p className="text-sm text-slate-400 text-center mb-6">총 {reps} reps · 평균 {avg}점</p>

        <div className="mb-6">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Rep별 점수</p>
          <div className="flex items-end gap-1 h-24">
            {repScores.map((s, i) => (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-full rounded-t ${s >= 85 ? "bg-green-500" : s >= 65 ? "bg-amber-500" : "bg-red-500"}`}
                  style={{ height: `${(s / max) * 100}%` }}
                  title={`Rep ${i + 1}: ${s}`}
                />
              </div>
            ))}
          </div>
        </div>

        {topDefects.length > 0 && (
          <div className="mb-6">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">자주 발생한 결함</p>
            <ul className="text-xs text-slate-300 space-y-1">
              {topDefects.map(([id, count]) => (
                <li key={id} className="flex justify-between">
                  <span>• {defectLabels[id] ?? id}</span>
                  <span className="text-slate-500">{count}회</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex gap-3">
          <Link href="/leaderboard" className="flex-1 bg-indigo-600 text-white text-center py-2 rounded-xl text-xs font-bold flex items-center justify-center">
            리더보드로 가기
          </Link>
          <button onClick={onRetry} className="flex-1 bg-slate-800 text-slate-300 py-2 rounded-xl text-xs font-bold">
            한 번 더
          </button>
        </div>
      </div>
    </div>
  );
}
