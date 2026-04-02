"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useResearchStore } from "@/store/useResearchStore";
import { User } from "@supabase/supabase-js";

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();
  const resetStore = useResearchStore((state) => state.resetStore);

  useEffect(() => {
    // 1. Ambil session awal saat pertama kali mount
    const checkInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    checkInitialSession();

    // 2. Pasang listener untuk perubahan status auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Refresh router untuk memastikan middleware dan server components sinkron
        if (_event === "SIGNED_IN" || _event === "SIGNED_OUT") {
          router.refresh();
        }
      }
    );

    // 3. Cleanup listener saat unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth, router]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error.message);
    } else {
      resetStore();
      router.push("/login");
    }
  };

  // Jangan tampilkan navbar jika sedang mengecek session atau user belum login
  if (loading || !user) return null;

  return (
    <nav className="sticky top-0 z-50 glass-effect transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Left: Logo */}
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-linear-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
                P
              </div>
              <span className="text-xl font-extrabold bg-clip-text text-transparent bg-linear-to-r from-blue-600 to-indigo-600 tracking-tight">
                PharisAI
              </span>
            </Link>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[10px] font-bold text-blue-600 border border-blue-100 uppercase tracking-wider">
              Beta
            </span>
          </div>

          {/* Right: User Profile & Logout */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100">
              <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase shrink-0">
                {user.email?.[0] ?? "U"}
              </div>
              <span className="text-xs font-medium text-slate-600 truncate max-w-[120px]">
                {user.email}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-red-500 transition-colors group px-2 py-1"
            >
              <svg 
                className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden xs:inline">Keluar</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Dev Mode Floating Indicator - Bottom Center */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        <div className="px-3 py-1 rounded-full bg-slate-900/5 backdrop-blur-sm border border-slate-900/10 text-[9px] font-mono text-slate-400 opacity-50 hover:opacity-100 transition-all">
          devtective_mode: active
        </div>
      </div>
    </nav>
  );
}
