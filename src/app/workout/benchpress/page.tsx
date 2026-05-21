"use client";

import { useState } from "react";
import PoseDetector from "@/components/PoseDetector";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function BenchPressWorkout() {
  const [started, setStarted] = useState(false);
  const [weight, setWeight] = useState("");

  if (!started) {
    return (
      <div className="flex flex-1 flex-col bg-slate-950 font-sans px-6 py-6 min-h-[calc(100vh-4rem)]">
        <div className="flex items-center mb-8">
          <Link href="/workout" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="ml-4 text-sm font-semibold">Workout Setup</span>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-white">Bench Press</h2>
            <p className="mt-2 text-xs text-slate-400">
              Enter your weight to track your volume
            </p>
          </div>

          <div className="space-y-5 bg-slate-900/50 border border-white/5 rounded-xl p-5">
            <div>
              <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider mb-1.5">
                Weight (kg)
              </label>
              <input
                type="number"
                required
                className="block w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                placeholder="e.g. 60"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>

            <button
              onClick={() => setStarted(true)}
              disabled={!weight}
              className="w-full rounded-lg bg-cyan-600 px-4 py-3 text-xs font-semibold text-white hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors disabled:opacity-50"
            >
              Start Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <PoseDetector exercise="benchpress" />;
}

