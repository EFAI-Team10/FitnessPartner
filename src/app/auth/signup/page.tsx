"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Activity, ArrowLeft } from "lucide-react";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-1 flex-col bg-slate-950 font-sans px-6 py-6 min-h-[calc(100vh-4rem)]">
      <div className="flex items-center mb-8">
        <Link href="/" className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="ml-4 text-sm font-semibold">Sign Up</span>
      </div>

      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <div className="flex flex-col items-center mb-8">
          <Activity className="h-10 w-10 text-indigo-500 mb-2" />
          <h2 className="text-center text-2xl font-extrabold text-white">Create an account</h2>
          <p className="mt-1 text-center text-xs text-slate-400">
            Start your fitness journey today
          </p>
        </div>

        {success ? (
          <div className="rounded-xl bg-green-500/10 p-5 border border-green-500/50 text-center">
            <h3 className="text-base font-semibold text-green-400 mb-1.5">Check your email</h3>
            <p className="text-xs text-green-300/80 leading-relaxed">
              We sent you a confirmation link to complete your registration.
            </p>
            <button
              onClick={() => router.push("/auth/login")}
              className="mt-5 w-full rounded-lg bg-slate-800 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
            >
              Back to login
            </button>
          </div>
        ) : (
          <form className="space-y-4 bg-slate-900/50 border border-white/5 rounded-xl p-5" onSubmit={handleSignup}>
            {error && (
              <div className="rounded-md bg-red-500/10 p-3 border border-red-500/50 text-xs text-red-400">
                {error}
              </div>
            )}
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider mb-1">Email address</label>
                <input
                  type="email"
                  required
                  className="block w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-355 uppercase tracking-wider mb-1">Password</label>
                <input
                  type="password"
                  required
                  className="block w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-xs font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </form>
        )}

        {!success && (
          <p className="text-center text-xs text-slate-400 mt-6">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-semibold text-indigo-400 hover:text-indigo-300">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

