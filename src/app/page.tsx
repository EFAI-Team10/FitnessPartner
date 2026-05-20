import Link from "next/link";
import { Activity, ArrowRight, CheckCircle2, TrendingUp } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-white">
            <Activity className="h-6 w-6 text-indigo-500" />
            <span>Fitness Partner</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/leaderboard" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Leaderboard
            </Link>
            <Link href="/auth/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Login
            </Link>
            <Link
              href="/workout"
              className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Start Workout
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-32">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950"></div>
          <div className="container mx-auto px-6 text-center">
            <h1 className="mx-auto max-w-4xl text-5xl font-extrabold tracking-tight text-white sm:text-7xl">
              Perfect Your Form with{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                Real-Time AI
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Your personal AI trainer that watches your workouts, corrects your posture in real-time, and tracks your progress. No special hardware required—just your webcam.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/workout"
                className="group flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-base font-semibold text-slate-900 shadow-sm hover:bg-slate-100 transition-all"
              >
                Start Training
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="#features" className="text-base font-semibold leading-6 text-white hover:text-indigo-300 transition-colors">
                Learn more <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-slate-900/50">
          <div className="container mx-auto px-6">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-indigo-400">Train Smarter</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Everything you need to build a better body
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
                {[
                  {
                    name: 'Real-time Posture Correction',
                    description: 'Get instant visual and audio feedback if your form breaks down during push-ups or bench press.',
                    icon: CheckCircle2,
                  },
                  {
                    name: 'Automated Rep Counting',
                    description: 'Focus on your workout, not your counting. Our AI accurately tracks every complete repetition.',
                    icon: Activity,
                  },
                  {
                    name: 'Performance Analytics',
                    description: 'Review your posture scores, total volume, and workout history to see your improvement over time.',
                    icon: TrendingUp,
                  },
                ].map((feature) => (
                  <div key={feature.name} className="relative pl-16">
                    <dt className="text-base font-semibold leading-7 text-white">
                      <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/20 border border-indigo-500/30">
                        <feature.icon className="h-6 w-6 text-indigo-400" aria-hidden="true" />
                      </div>
                      {feature.name}
                    </dt>
                    <dd className="mt-2 text-base leading-7 text-slate-400">{feature.description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-8 text-center text-sm text-slate-500">
        <p>© {new Date().getFullYear()} Fitness Partner. All rights reserved.</p>
      </footer>
    </div>
  );
}
