"use client";
import { useEffect, useState } from "react";
import { useResearchStore } from "@/store/useResearchStore";
import { Loader2, Sparkles, Send, LayoutGrid } from "lucide-react";
import { useToastStore } from "@/store/useToastStore";

export default function Step3Structure() {
  const { sessionId, sections, fetchSections, initializeIMRADSections, nextStep } = useResearchStore();
  const [isInitializing, setIsInitializing] = useState(false);
  const { addToast } = useToastStore();

  useEffect(() => {
    if (sessionId && sections.length === 0) {
      fetchSections(sessionId);
    }
  }, [sessionId, sections.length, fetchSections]);

  const handleInitializeSections = async () => {
    if (!sessionId) return;
    setIsInitializing(true);
    try {
      await initializeIMRADSections(sessionId);
      await nextStep(); // Move automatically to Workspace Step 4
    } catch (err: any) {
      console.error("Gagal inisialisasi bab:", err);
      addToast({
        type: "error",
        message: "Gagal Inisialisasi",
        description: err.message || "Gagal menyiapkan struktur riset akademik."
      });
    } finally {
      setIsInitializing(false);
    }
  };

  /**
   * INITIALIZATION VIEW
   * Clean and Minimalist view for first-time session creation
   */
  return (
    <div className="flex flex-col items-center justify-center py-20 min-h-[500px] border border-slate-100 rounded-[2.5rem] bg-white shadow-sm ring-1 ring-slate-50">
      <div className="bg-slate-50 w-24 h-24 rounded-3xl flex items-center justify-center mb-8 rotate-3 shadow-inner ring-1 ring-slate-100">
        <LayoutGrid className="text-blue-500" size={40} strokeWidth={1.5} />
      </div>
      
      <div className="text-center space-y-3 max-w-sm">
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Siapkan Struktur Modular</h3>
        <p className="text-slate-400 text-sm leading-relaxed">
          PharisAI akan menyiapkan 7 bab standar riset sebagai dasar eksplorasi Anda.
        </p>
      </div>

      <button
        onClick={handleInitializeSections}
        disabled={isInitializing}
        className="mt-10 group bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-black disabled:opacity-50 transition-all shadow-xl shadow-slate-200/50 flex items-center gap-3 border border-slate-800"
      >
        {isInitializing ? (
          <Loader2 className="animate-spin" size={20} />
        ) : (
          <>
            <Sparkles size={18} className="text-blue-400 group-hover:scale-125 transition-transform" />
            <span>Bangun Kerangka Bab</span>
            <Send size={14} className="opacity-40 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>
    </div>
  );
}

