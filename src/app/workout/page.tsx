"use client";

import Link from "next/link";
import { ArrowLeft, Play } from "lucide-react";
import { listFamilies, listByFamily } from "@/lib/baseline/registry";

export default function WorkoutSelection() {
  const families = listFamilies();

  return (
    <div className="flex flex-col bg-slate-950 text-slate-50 font-sans">
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between px-6 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2 text-slate-300 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-xs font-semibold">Home</span>
        </Link>
        <span className="text-sm font-semibold">Workouts</span>
        <div className="w-10" />
      </header>

      <main className="flex-1 px-6 py-6 pb-20">
        <h1 className="text-2xl font-extrabold text-white mb-1">Select Workout</h1>
        <p className="text-xs text-slate-400 mb-6">Choose an exercise to start.</p>

        <div className="flex flex-col gap-6">
          {families.map((family) => (
            <section key={family}>
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3">
                {family}
              </h2>
              <div className="flex flex-col gap-3">
                {listByFamily(family).map((b) => (
                  <Link
                    key={b.id}
                    href={`/workout/${b.id}`}
                    className="group rounded-xl border border-white/5 bg-slate-900/50 p-5 hover:bg-slate-900 transition-all"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-base font-bold text-white">{b.display_name_ko}</h3>
                        <p className="text-xs text-slate-400 mt-1">{b.target_muscles.join(", ")}</p>
                      </div>
                      <div className="rounded-lg bg-indigo-500/10 p-2.5">
                        <Play className="h-5 w-5 text-indigo-400 group-hover:text-indigo-300" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
