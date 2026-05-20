"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Leaderboard() {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      // In a real app we'd query the 'leaderboard' view we created,
      // but if the view isn't created yet we'll query 'workouts' directly as a fallback
      try {
        const { data, error } = await supabase
          .from('leaderboard')
          .select('*')
          .order('total_volume', { ascending: false })
          .limit(10);
        
        if (error) {
          console.error("View might not exist, falling back to workouts table");
          // Fallback logic if view doesn't exist
          const { data: workoutsData } = await supabase.from('workouts').select('*');
          if (workoutsData) {
            // Aggregate in JS as a fallback
            const aggregated: Record<string, any> = {};
            workoutsData.forEach((w) => {
              if (!aggregated[w.user_id]) {
                aggregated[w.user_id] = {
                  user_id: w.user_id,
                  total_volume: 0,
                  best_score: 0,
                  total_workouts: 0
                };
              }
              aggregated[w.user_id].total_volume += w.reps * (w.weight > 0 ? w.weight : 1);
              if (w.score > aggregated[w.user_id].best_score) {
                aggregated[w.user_id].best_score = w.score;
              }
              aggregated[w.user_id].total_workouts += 1;
            });
            const sorted = Object.values(aggregated).sort((a: any, b: any) => b.total_volume - a.total_volume);
            setLeaders(sorted);
          }
        } else {
          setLeaders(data || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

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
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-10">
            <div className="rounded-full bg-yellow-500/20 p-4 border border-yellow-500/30">
              <Trophy className="h-8 w-8 text-yellow-500" />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight text-white">
                Global Leaderboard
              </h1>
              <p className="text-slate-400 mt-1">
                Ranked by total training volume.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/50 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-400">Loading rankings...</div>
            ) : leaders.length === 0 ? (
              <div className="p-12 text-center text-slate-400">No workout data found. Be the first!</div>
            ) : (
              <table className="w-full text-left">
                <thead className="bg-slate-900 border-b border-white/10 text-xs uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Rank</th>
                    <th className="px-6 py-4 font-semibold">User ID</th>
                    <th className="px-6 py-4 font-semibold text-right">Volume</th>
                    <th className="px-6 py-4 font-semibold text-right">Best Score</th>
                    <th className="px-6 py-4 font-semibold text-right">Workouts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {leaders.map((leader, index) => (
                    <tr key={leader.user_id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                          index === 0 ? 'bg-yellow-500 text-yellow-950' :
                          index === 1 ? 'bg-slate-300 text-slate-800' :
                          index === 2 ? 'bg-amber-700 text-amber-100' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-slate-300">
                        {leader.user_id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-white">
                        {leader.total_volume.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right text-green-400 font-medium">
                        {leader.best_score}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-400">
                        {leader.total_workouts}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
