"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Play, Settings } from "lucide-react";

export default function WorkoutSelection() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50 font-sans">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center px-6">
          <Link href="/" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Back to Home</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
            Select Workout
          </h1>
          <p className="text-slate-400 mb-12">
            Choose an exercise to start your AI-assisted training session.
          </p>

          <div className="grid gap-6 sm:grid-cols-2">
            {/* Push-up Card */}
            <div className="group relative rounded-2xl border border-white/10 bg-slate-900/50 p-6 hover:bg-slate-800/50 transition-all cursor-pointer">
              <div className="flex justify-between items-start mb-4">
                <div className="rounded-lg bg-indigo-500/20 p-3">
                  <Play className="h-6 w-6 text-indigo-400 group-hover:text-indigo-300" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Push-up</h3>
              <p className="text-sm text-slate-400 mb-6">
                Focuses on chest, shoulders, and triceps. Keep your back straight for best form.
              </p>
              <Link 
                href="/workout/pushup"
                className="inline-flex w-full justify-center items-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all"
              >
                Start
              </Link>
            </div>

            {/* Bench Press Card */}
            <div className="group relative rounded-2xl border border-white/10 bg-slate-900/50 p-6 hover:bg-slate-800/50 transition-all cursor-pointer">
              <div className="flex justify-between items-start mb-4">
                <div className="rounded-lg bg-cyan-500/20 p-3">
                  <Play className="h-6 w-6 text-cyan-400 group-hover:text-cyan-300" />
                </div>
                <button className="text-slate-400 hover:text-white transition-colors">
                  <Settings className="h-5 w-5" />
                </button>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Bench Press</h3>
              <p className="text-sm text-slate-400 mb-6">
                Requires side camera angle. Enter your weight before starting.
              </p>
              <Link 
                href="/workout/benchpress"
                className="inline-flex w-full justify-center items-center rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-cyan-500 transition-all"
              >
                Start
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
