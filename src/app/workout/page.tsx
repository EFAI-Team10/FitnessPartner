"use client";

import Link from "next/link";
import { ArrowLeft, Play, Settings } from "lucide-react";

export default function WorkoutSelection() {
  return (
    <div className="flex flex-col bg-slate-950 text-slate-50 font-sans">
      {/* Mobile Top App Bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between px-6 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-xs font-semibold">Home</span>
        </Link>
        <span className="text-sm font-semibold">Workouts</span>
        <div className="w-10"></div> {/* Spacer for symmetry */}
      </header>

      <main className="flex-1 px-6 py-6 pb-20">
        <h1 className="text-2xl font-extrabold tracking-tight text-white mb-1">
          Select Workout
        </h1>
        <p className="text-xs text-slate-400 mb-6">
          Choose an exercise to start your AI-assisted training session.
        </p>

        <div className="flex flex-col gap-4">
          {/* Push-up Card */}
          <div className="group relative rounded-xl border border-white/5 bg-slate-900/50 p-5 hover:bg-slate-900 transition-all cursor-pointer">
            <div className="flex justify-between items-start mb-3">
              <div className="rounded-lg bg-indigo-500/10 p-2.5">
                <Play className="h-5 w-5 text-indigo-400 group-hover:text-indigo-300" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Push-up</h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Focuses on chest, shoulders, and triceps. Keep your back straight for best form.
            </p>
            <Link 
              href="/workout/pushup"
              className="inline-flex w-full justify-center items-center rounded-lg bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 transition-all"
            >
              Start
            </Link>
          </div>

          {/* Bench Press Card */}
          <div className="group relative rounded-xl border border-white/5 bg-slate-900/50 p-5 hover:bg-slate-900 transition-all cursor-pointer">
            <div className="flex justify-between items-start mb-3">
              <div className="rounded-lg bg-cyan-500/10 p-2.5">
                <Play className="h-5 w-5 text-cyan-400 group-hover:text-cyan-300" />
              </div>
              <button className="text-slate-400 hover:text-white transition-colors">
                <Settings className="h-4 w-4" />
              </button>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Bench Press</h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Requires side camera angle. Enter your weight before starting.
            </p>
            <Link 
              href="/workout/benchpress"
              className="inline-flex w-full justify-center items-center rounded-lg bg-cyan-600 px-4 py-2.5 text-xs font-semibold text-white shadow-md hover:bg-cyan-500 transition-all"
            >
              Start
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

