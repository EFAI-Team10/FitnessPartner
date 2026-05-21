import Link from "next/link";
import { Activity, ArrowRight, CheckCircle2, TrendingUp, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
      {/* Mobile Top App Bar */}
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between px-6 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
        <div className="flex items-center gap-2 font-bold text-lg tracking-tight text-white">
          <Activity className="h-5 w-5 text-indigo-500" />
          <span>Fitness Partner</span>
        </div>
        <Link
          href="/auth/login"
          className="text-xs font-semibold text-slate-300 hover:text-white transition-colors border border-white/10 rounded-full px-3 py-1 bg-white/5 backdrop-blur-sm"
        >
          Login
        </Link>
      </div>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-16 px-6">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/50 via-slate-950 to-slate-950"></div>
          
          <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/25 px-3 py-1 text-xs text-indigo-300 mb-6 font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            AI-Powered Personal Trainer
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
            Perfect Your Form with{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
              Real-Time AI
            </span>
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-400">
            Your personal AI trainer that watches your workouts, corrects your posture in real-time, and tracks your progress. No special hardware required—just your webcam.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/workout"
              className="group flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all"
            >
              Start Training
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="#features"
              className="flex items-center justify-center rounded-xl bg-slate-900 border border-white/10 px-6 py-3.5 text-sm font-semibold text-white hover:bg-slate-800 transition-all"
            >
              Learn more
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-12 bg-slate-900/30 border-t border-white/5 px-6">
          <div className="mb-8">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-indigo-400">Train Smarter</h2>
            <p className="mt-1 text-2xl font-bold tracking-tight text-white">
              AI Features Built for You
            </p>
          </div>
          
          <div className="flex flex-col gap-6">
            {[
              {
                name: 'Real-time Posture Correction',
                description: 'Get instant visual and audio feedback if your form breaks down during push-ups or bench press.',
                icon: CheckCircle2,
                colorClass: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
              },
              {
                name: 'Automated Rep Counting',
                description: 'Focus on your workout, not your counting. Our AI accurately tracks every complete repetition.',
                icon: Activity,
                colorClass: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
              },
              {
                name: 'Performance Analytics',
                description: 'Review your posture scores, total volume, and workout history to see your improvement over time.',
                icon: TrendingUp,
                colorClass: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
              },
            ].map((feature) => (
              <div key={feature.name} className="flex gap-4 p-4 rounded-xl border border-white/5 bg-slate-900/50">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${feature.colorClass}`}>
                  <feature.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{feature.name}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-8 text-center text-[10px] text-slate-500">
        <p>© {new Date().getFullYear()} Fitness Partner. All rights reserved.</p>
      </footer>
    </div>
  );
}

