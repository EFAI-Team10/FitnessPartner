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
      try {
        const { data, error } = await supabase
          .from('leaderboard')
          .select('*')
          .order('total_volume', { ascending: false })
          .limit(10);
        
        if (error) {
          console.error("View might not exist, falling back to workouts table");
          const { data: workoutsData } = await supabase.from('workouts').select('*');
          if (workoutsData) {
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
    <div className="flex flex-col bg-slate-950 text-slate-50 font-sans">
      {/* Mobile Top App Bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between px-6 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-xs font-semibold">Home</span>
        </Link>
        <span className="text-sm font-semibold">Leaderboard</span>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 px-6 py-6 pb-20">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-full bg-yellow-500/10 p-3 border border-yellow-500/20">
            <Trophy className="h-6 w-6 text-yellow-500" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white">
              Global Rankings
            </h1>
            <p className="text-xs text-slate-400">
              Ranked by total training volume.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-slate-900/30 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading rankings...</div>
          ) : leaders.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">No workout data found. Be the first!</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[320px]">
                <thead className="bg-slate-900/80 border-b border-white/5 text-[10px] uppercase tracking-wider text-slate-450">
                  <tr>
                    <th className="px-4 py-3 font-semibold w-12 text-center">Rank</th>
                    <th className="px-4 py-3 font-semibold">User</th>
                    <th className="px-4 py-3 font-semibold text-right">Volume</th>
                    <th className="px-4 py-3 font-semibold text-right">Best</th>
                    <th className="px-4 py-3 font-semibold text-right">Workouts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {leaders.map((leader, index) => (
                    <tr key={leader.user_id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className={`flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${
                          index === 0 ? 'bg-yellow-500 text-yellow-950' :
                          index === 1 ? 'bg-slate-300 text-slate-800' :
                          index === 2 ? 'bg-amber-700 text-amber-100' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-300">
                        {leader.user_id.substring(0, 6)}...
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-white">
                        {leader.total_volume.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-green-400 font-medium">
                        {leader.best_score}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-400">
                        {leader.total_workouts}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

