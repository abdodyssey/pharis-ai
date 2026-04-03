import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { 
  BarChart3, 
  ChevronRight, 
  FileText, 
  ArrowRight 
} from "lucide-react";
import { ResearchSession } from "@/types/research";

export default async function RecentResearchLoader() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: sessions } = await supabase
    .from("research_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(2);

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-slate-900" />
          Lanjutkan Riset Terakhir
        </h2>
        <Link
          href="/dashboard/all"
          className="text-sm font-bold text-slate-900 hover:text-black flex items-center gap-1 group transition-colors"
        >
          Lihat Semua Riset
          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {!sessions || sessions.length === 0 ? (
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
          {sessions.map((session: ResearchSession) => (
            <Link
              key={session.id}
              href={`/research/${session.id}`}
              className="group p-6 bg-white border border-slate-200/60 rounded-2xl hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/50 transition-all flex flex-col h-full border-b-4 border-b-slate-100 hover:border-b-slate-900"
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
                <h3 className="text-lg font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-black transition-colors">
                  {session.refined_title || session.initial_topic || "Tanpa Judul"}
                </h3>
              </div>

              <div className="mt-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-24 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-slate-900 rounded-full transition-all duration-1000"
                      style={{ width: `${(session.current_step / 5) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-bold text-slate-600">
                    Step {session.current_step}/5
                  </span>
                </div>
                <div className="bg-slate-50 group-hover:bg-slate-100 p-2 rounded-xl text-slate-400 group-hover:text-slate-900 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
