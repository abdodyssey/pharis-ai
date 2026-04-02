"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ResearchSession } from "@/types/research";
import LogoutButton from "@/components/shared/LogoutButton";

export default function DashboardPage() {
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("research_sessions")
          .select("*")
          .order("created_at", { ascending: false });
        setSessions(data || []);
      }
      setLoading(false);
    };
    fetchSessions();
  }, []);

  return (
    <main className="max-w-5xl mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Riset Saya</h1>
        <LogoutButton />
        <Link
          href="/"
          className="bg-brand-primary text-white px-6 py-2 rounded-xl font-bold"
        >
          + Riset Baru
        </Link>
      </div>

      {loading ? (
        <p>Memuat riset...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((s) => (
            <Link key={s.id} href={`/research/${s.id}`}>
              <div className="p-6 bg-white border border-slate-200 rounded-2xl hover:border-brand-primary transition-all cursor-pointer shadow-sm">
                <h3 className="font-bold text-lg mb-2 truncate">
                  {s.refined_title || s.initial_topic || "Draft Riset"}
                </h3>
                <div className="flex justify-between items-center text-sm text-slate-500">
                  <span>Step: {s.current_step}/5</span>
                  <span>{new Date(s.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
