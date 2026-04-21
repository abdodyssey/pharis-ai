/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import { useResearchStore } from "@/store/useResearchStore";
import ResearchWizard from "@/components/research/ResearchWizard";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading01Icon, Alert01Icon, ReloadIcon } from "@hugeicons/core-free-icons";

function FullScreenLoader() {
  return (
    <div className="flex items-center justify-center h-screen bg-obsidian-0">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-obsidian-2 border-t-accent-lime rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <HugeiconsIcon icon={Loading01Icon} className="w-6 h-6 text-accent-lime animate-pulse" />
          </div>
        </div>
        <span className="text-[10px] font-black text-slate-500">
          Loading Research Session...
        </span>
      </div>
    </div>
  );
}

export default function ResearchPageClient({ id }: { id: string }) {
  const { fetchSession, isLoading, error } = useResearchStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (id) {
      fetchSession(id);
    }
  }, [id, fetchSession]);

  if (!isMounted || isLoading) {
    return <FullScreenLoader />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-obsidian-0">
        <div className="max-w-md w-full mx-4 p-10 bg-obsidian-1 border border-obsidian-2 rounded-3xl text-center">
          <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <HugeiconsIcon icon={Alert01Icon} className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Terjadi Gangguan</h2>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-accent-lime text-obsidian-0 py-3.5 rounded-xl font-bold hover:bg-white transition-all flex items-center justify-center gap-2"
          >
            <HugeiconsIcon icon={ReloadIcon} size={16} />
            Muat Ulang Sesi
          </button>
        </div>
      </div>
    );
  }

  return <ResearchWizard />;
}
