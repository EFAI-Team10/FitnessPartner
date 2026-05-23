// src/components/FormHud.tsx
"use client";

interface Props {
  reps: number;
  lastRepScore: number | null;
  averageScore: number | null;
  hint: string | null;
  phase: number;
}

export default function FormHud({ reps, lastRepScore, averageScore, hint, phase }: Props) {
  return (
    <>
      <div className="absolute top-16 left-4 right-4 z-40 flex gap-3">
        <div className="flex-1 backdrop-blur-md bg-black/60 px-4 py-2 rounded-xl border border-white/5 flex items-center justify-between">
          <span className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">Reps</span>
          <span className="text-2xl font-extrabold text-indigo-400">{reps}</span>
        </div>
        <div className="flex-1 backdrop-blur-md bg-black/60 px-4 py-2 rounded-xl border border-white/5 flex items-center justify-between">
          <span className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">Last</span>
          <span className="text-2xl font-extrabold text-green-400">
            {lastRepScore != null ? lastRepScore : "—"}
          </span>
        </div>
        <div className="flex-1 backdrop-blur-md bg-black/60 px-4 py-2 rounded-xl border border-white/5 flex items-center justify-between">
          <span className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">Avg</span>
          <span className="text-2xl font-extrabold text-cyan-400">
            {averageScore != null ? averageScore : "—"}
          </span>
        </div>
      </div>

      {/* Phase bar */}
      <div className="absolute top-28 left-4 right-4 z-40">
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 transition-[width] duration-100"
            style={{ width: `${Math.min(100, Math.max(0, phase * 2 * 100))}%` }}
          />
        </div>
      </div>

      {hint && (
        <div className="absolute bottom-20 left-4 right-4 z-40 flex justify-center">
          <div className="backdrop-blur-md bg-amber-500/20 border border-amber-500/40 text-amber-200 px-5 py-3 rounded-xl text-center">
            <span className="text-xs font-bold">💡 {hint}</span>
          </div>
        </div>
      )}
    </>
  );
}
