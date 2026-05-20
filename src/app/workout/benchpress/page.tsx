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
      <div className="flex min-h-screen items-center justify-center bg-slate-950 font-sans px-4">
        <div className="w-full max-w-md space-y-8 rounded-2xl bg-slate-900 p-8 border border-white/10 shadow-xl relative">
          <Link href="/workout" className="absolute top-4 left-4 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex flex-col items-center">
            <h2 className="text-center text-3xl font-extrabold text-white mt-4">Bench Press setup</h2>
            <p className="mt-2 text-center text-sm text-slate-400">
              Enter your weight to track your volume
            </p>
          </div>

          <div className="mt-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300">Weight (kg)</label>
              <input
                type="number"
                required
                className="mt-1 block w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2.5 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                placeholder="e.g. 60"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>

            <button
              onClick={() => setStarted(true)}
              disabled={!weight}
              className="w-full rounded-xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors disabled:opacity-50"
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
