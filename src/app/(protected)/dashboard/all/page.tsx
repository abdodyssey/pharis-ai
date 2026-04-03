"use client";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ResearchSession } from "@/types/research";
import { 
  Trash2, 
  Search, 
  ArrowLeft, 
  ExternalLink,
  Calendar,
  Layers,
  Database
} from "lucide-react";
import { useToastStore } from "@/store/useToastStore";
import DeleteConfirmationDialog from "@/components/shared/DeleteConfirmationDialog";

export default function AllResearchPage() {
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [targetId, setTargetId] = useState<string | null>(null);
  const { addToast } = useToastStore();

  useEffect(() => {
    const fetchAllSessions = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data } = await supabase
          .from("research_sessions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        
        setSessions(data || []);
      }
      setLoading(false);
    };

    fetchAllSessions();
  }, []);

  const openDeleteDialog = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTargetId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!targetId) return;

    setDeletingId(targetId);
    try {
      const { error } = await supabase
        .from("research_sessions")
        .delete()
        .eq("id", targetId);

      if (error) {
        addToast({ 
          type: "error", 
          message: "Gagal Menghapus", 
          description: error.message 
        });
      } else {
        setSessions(prev => prev.filter(s => s.id !== targetId));
        addToast({ 
          type: "success", 
          message: "Data Berhasil Dihapus", 
          description: "Riset telah dihapus secara permanen dari database." 
        });
      }
    } catch (err: any) {
      console.error(err);
      addToast({ 
        type: "error", 
        message: "Kesalahan Sistem", 
        description: err.message || "Gagal menghapus riset." 
      });
    } finally {
      setDeletingId(null);
      setIsDeleteDialogOpen(false);
      setTargetId(null);
    }
  };

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      const title = (s.refined_title || s.initial_topic || "Tanpa Judul").toLowerCase();
      return title.includes(searchTerm.toLowerCase());
    });
  }, [sessions, searchTerm]);

  return (
    <main className="max-w-6xl mx-auto p-6 md:p-10 space-y-8">
      {/* Header & Back Link */}
      <div className="space-y-4">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Kembali ke Overview
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Semua Riset
          </h1>
          
          {/* Search Bar */}
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text"
              placeholder="Cari judul riset..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-48 bg-slate-50 border border-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm text-center px-6">
          <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 text-slate-300">
            <Database className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">
            {searchTerm ? "Tidak ada hasil ditemukan" : "Belum ada riset yang tersimpan"}
          </h3>
          <p className="text-slate-500 mt-2 max-w-sm font-medium">
            {searchTerm 
              ? `Kami tidak bisa menemukan riset dengan kata kunci "${searchTerm}"`
              : "Mulai riset akademik pertamamu dan kelola semua progresnya di sini."}
          </p>
          <Link
            href="/dashboard"
            className="mt-8 bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSessions.map((session) => (
            <div 
              key={session.id}
              className="group relative flex flex-col p-6 bg-white border border-slate-200/70 rounded-2xl shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all"
            >
              <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">
                    <Layers className="w-3 h-3" />
                    Step {session.current_step}/5
                  </span>
                  <button
                    onClick={(e) => openDeleteDialog(session.id, e)}
                    disabled={deletingId === session.id}
                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                    title="Hapus Riset"
                  >
                    {deletingId === session.id ? (
                      <div className="w-4 h-4 border-2 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <h3 className="text-lg font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
                  {session.refined_title || session.initial_topic || "Tanpa Judul"}
                </h3>

                <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(session.created_at).toLocaleDateString("id-ID", {
                       day: "numeric",
                       month: "short"
                    })}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1 h-1 bg-slate-300 rounded-full" />
                    ID: {session.id.slice(0, 8)}
                  </div>
                </div>
              </div>

              <Link
                href={`/research/${session.id}`}
                className="mt-8 flex items-center justify-center gap-2 w-full py-3 bg-slate-50 group-hover:bg-indigo-600 text-slate-600 group-hover:text-white rounded-xl font-bold transition-all"
              >
                Lanjutkan
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      )}
      <DeleteConfirmationDialog 
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        isLoading={deletingId !== null}
      />
    </main>
  );
}
