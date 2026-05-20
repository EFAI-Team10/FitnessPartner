"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Activity } from "lucide-react";

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
    <div className="flex min-h-screen items-center justify-center bg-slate-950 font-sans px-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-slate-900 p-8 border border-white/10 shadow-xl">
        <div className="flex flex-col items-center">
          <Activity className="h-10 w-10 text-indigo-500 mb-2" />
          <h2 className="text-center text-3xl font-extrabold text-white">Create an account</h2>
          <p className="mt-2 text-center text-sm text-slate-400">
            Start your fitness journey today
          </p>
        </div>

        {success ? (
          <div className="rounded-md bg-green-500/10 p-6 border border-green-500/50 text-center">
            <h3 className="text-lg font-medium text-green-400 mb-2">Check your email</h3>
            <p className="text-sm text-green-300/80">
              We sent you a confirmation link to complete your registration.
            </p>
            <button
              onClick={() => router.push("/auth/login")}
              className="mt-6 w-full rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 transition-colors"
            >
              Back to login
            </button>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSignup}>
            {error && (
              <div className="rounded-md bg-red-500/10 p-4 border border-red-500/50 text-sm text-red-400">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300">Email address</label>
                <input
                  type="email"
                  required
                  className="mt-1 block w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2.5 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300">Password</label>
                <input
                  type="password"
                  required
                  className="mt-1 block w-full rounded-lg border border-white/10 bg-slate-800 px-4 py-2.5 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </form>
        )}

        {!success && (
          <p className="text-center text-sm text-slate-400 mt-6">
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
