"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ResearchSession } from "@/types/research";
import { 
  Plus, 
  BarChart3, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  ChevronRight,
  FileText
} from "lucide-react";

export default function DashboardOverviewPage() {
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    ongoing: 0,
    completed: 0,
  });
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch Stats
      const { count: totalCount } = await supabase
        .from("research_sessions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      const { count: ongoingCount } = await supabase
        .from("research_sessions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .lt("current_step", 5);

      const { count: completedCount } = await supabase
        .from("research_sessions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("current_step", 5);

      setStats({
        total: totalCount || 0,
        ongoing: ongoingCount || 0,
        completed: completedCount || 0,
      });

      // Fetch Recent Research (Last 2)
      const { data: recentSessions } = await supabase
        .from("research_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(2);

      setSessions(recentSessions || []);
      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  const handleCreateNewResearch = async () => {
    setIsCreating(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("research_sessions")
        .insert([
          {
            user_id: user.id,
            initial_topic: "",
            current_step: 1,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Gagal membuat sesi:", error.message);
      } else if (data) {
        router.push(`/research/${data.id}`);
      }
    } catch (err) {
      console.error("Terjadi kesalahan:", err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main className="max-w-6xl mx-auto p-6 md:p-10 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Ringkasan Riset
          </h1>
          <p className="text-slate-500 mt-1.5 font-medium">
            Pantau progres dan kelola aktivitas riset akademikmu.
          </p>
        </div>
        <button
          onClick={handleCreateNewResearch}
          disabled={isCreating}
          className="group relative flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl font-semibold hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-slate-200"
        >
          {isCreating ? (
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          )}
          <span>Mulai Riset Baru</span>
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          label="Total Riset"
          value={stats.total}
          icon={<FileText className="w-6 h-6" />}
          color="blue"
          loading={loading}
        />
        <StatCard
          label="Progres Riset"
          value={stats.ongoing}
          icon={<Clock className="w-6 h-6" />}
          color="indigo"
          loading={loading}
        />
        <StatCard
          label="Selesai"
          value={stats.completed}
          icon={<CheckCircle2 className="w-6 h-6" />}
          color="emerald"
          loading={loading}
        />
      </div>

      {/* Recent Activity */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            Lanjutkan Riset Terakhir
          </h2>
          <Link
            href="/dashboard/all"
            className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group transition-colors"
          >
            Lihat Semua Riset
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2].map((n) => (
              <div key={n} className="h-40 bg-slate-50 border border-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white border border-slate-100 rounded-3xl shadow-sm text-center px-6">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 text-slate-300">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Belum ada riset aktif</h3>
            <p className="text-slate-500 mt-1 max-w-xs">
              Buat riset pertamamu untuk mulai membangun struktur akademik yang solid.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {sessions.map((session) => (
              <Link
                key={session.id}
                href={`/research/${session.id}`}
                className="group p-6 bg-white border border-slate-200/60 rounded-2xl hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all flex flex-col h-full border-b-4 border-b-slate-100 hover:border-b-indigo-500"
              >
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">
                      ID: {session.id.slice(0, 8)}
                    </span>
                    <span className="text-xs font-medium text-slate-400 whitespace-nowrap">
                      {new Date(session.updated_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
                    {session.refined_title || session.initial_topic || "Tanpa Judul"}
                  </h3>
                </div>

                <div className="mt-8 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-24 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                        style={{ width: `${(session.current_step / 5) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-bold text-slate-600">
                      Step {session.current_step}/5
                    </span>
                  </div>
                  <div className="bg-slate-50 group-hover:bg-indigo-50 p-2 rounded-xl text-slate-400 group-hover:text-indigo-600 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function StatCard({ 
  label, 
  value, 
  icon, 
  color, 
  loading 
}: { 
  label: string; 
  value: number; 
  icon: React.ReactNode; 
  color: "blue" | "indigo" | "emerald";
  loading: boolean;
}) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
  };

  return (
    <div className="p-6 bg-white border border-slate-200/60 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl transition-colors ${colorMap[color]}`}>
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">
            {label}
          </span>
          {loading ? (
            <div className="h-8 w-12 bg-slate-100 animate-pulse rounded-md mt-1" />
          ) : (
            <span className="text-3xl font-black text-slate-900 tabular-nums">
              {value}
            </span>
          )}
        </div>
      </div>
      <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity scale-150 rotate-12">
        {icon}
      </div>
    </div>
  );
}
