"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, Activity, LogIn } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function BottomNav() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Hide BottomNav during active workout session (when user is doing pushup or benchpress)
  if (pathname.startsWith("/workout/") && pathname !== "/workout") {
    return null;
  }

  // Also hide in login/signup page if they look like standalone screens
  if (pathname.startsWith("/auth/")) {
    return null;
  }

  const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Workout", href: "/workout", icon: Activity },
    { name: "Leaderboard", href: "/leaderboard", icon: Trophy },
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 z-50 h-16 bg-slate-950/90 border-t border-white/10 backdrop-blur-md px-6 flex justify-around items-center">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              isActive ? "text-indigo-400" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.name}</span>
          </Link>
        );
      })}
      
      <Link
        href={isLoggedIn ? "/auth/login" : "/auth/login"} // Simplification, or profile page if it existed
        className={`flex flex-col items-center justify-center gap-1 transition-colors ${
          pathname.startsWith("/auth/") ? "text-indigo-400" : "text-slate-400 hover:text-slate-200"
        }`}
      >
        <LogIn className="h-5 w-5" />
        <span className="text-[10px] font-medium">{isLoggedIn ? "Account" : "Login"}</span>
      </Link>
    </div>
  );
}
