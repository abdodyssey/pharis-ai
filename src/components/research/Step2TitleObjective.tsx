"use client";

import { useState, useEffect } from "react";
import { useResearchStore } from "@/store/useResearchStore";
import { callResearchAI } from "@/lib/ai-service";
import { useToastStore } from "@/store/useToastStore";
import ModelLimitDialog from "@/components/shared/ModelLimitDialog";
import { Lightbulb, Target, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const loadingMessages = [
  "Searching for 15 relevant journals...",
  "Categorizing literature by themes...",
  "Synthesizing research gaps...",
  "Mapping academic contradictions...",
  "Preparing your workspace...",
];

export default function Step2TitleObjective() {
  const { 
    topic, 
    titleOptions, 
    sessionId, 
    updateResearchData, 
    nextStep 
  } = useResearchStore();

  const { addToast } = useToastStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isRateLimitOpen, setIsRateLimitOpen] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      interval = setInterval(() => {
        setLoadingIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleSelectTitle = async (idx: number) => {
    if (!sessionId) return;
    setSelectedIdx(idx);
    setIsGenerating(true);
    setLoadingIndex(0);

    try {
      const selected = titleOptions[idx];
      const result = await callResearchAI(
        topic, 
        sessionId, 
        "generate", 
        selected.title
      );

      if (result.error) {
        addToast({ 
          type: "error", 
          message: "Gagal memproses draf", 
          description: result.error 
        });
        setIsGenerating(false);
        return;
      }

      if (result.data?.session) {
        updateResearchData({
          refinedTitle: result.data.session.refined_title,
          objectives: result.data.session.research_objectives || [],
          currentStep: 3,
        });
        // fetchSession handles sections automatically if needed, 
        // but since we inserted them in Edge Function, nextStep will move us to Workspace
        nextStep();
      }
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Kesalahan Sistem";
      const status = (err as { status?: number })?.status;

      if (status === 429) {
        setIsRateLimitOpen(true);
      } else {
        addToast({ 
          type: "error", 
          message: "Kesalahan Sistem", 
          description: errorMessage 
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-8 animate-in fade-in duration-500">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-slate-900 animate-pulse" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold text-slate-900">Membangun Fondasi Riset</h3>
          <p className="text-slate-500 font-medium animate-pulse">
            {loadingMessages[loadingIndex]}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-slate-900 mb-1">
          <span className="text-xs font-black uppercase tracking-widest text-slate-900/60">Phase 02</span>
          <div className="h-px w-8 bg-slate-200" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
          Pilih Arah Judul Penelitian
        </h2>
        <p className="text-slate-500 text-lg leading-relaxed max-w-2xl">
          PharisAI telah merumuskan 3 opsi judul berdasarkan research gap yang ditemukan. Pilih yang paling sesuai dengan visi penelitian Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {titleOptions.map((option, i) => (
          <div
            key={i}
            onClick={() => !isGenerating && handleSelectTitle(i)}
            className={cn(
              "group relative p-8 bg-white border-2 rounded-[2rem] transition-all cursor-pointer hover:shadow-2xl hover:shadow-slate-200/50 active:scale-[0.99]",
              selectedIdx === i 
                ? "border-slate-900 ring-4 ring-slate-100 shadow-xl" 
                : "border-slate-100 hover:border-slate-200"
            )}
          >
            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-900 flex items-center justify-center shrink-0">
                    {i === 0 && <Target size={20} />}
                    {i === 1 && <Lightbulb size={20} />}
                    {i === 2 && <Sparkles size={20} />}
                  </div>
                  <div className="px-3 py-1 rounded-full bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Opsi {i + 1}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight group-hover:text-black transition-colors">
                    {option.title}
                  </h3>
                </div>

                <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Research Gap</span>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                      {option.gap}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">Rationale</span>
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                      {option.rationale}
                    </p>
                  </div>
                </div>
              </div>

              <div className="md:w-48 flex items-center justify-center">
                  <div className={cn(
                    "w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all",
                    selectedIdx === i 
                      ? "bg-slate-900 text-white shadow-lg" 
                      : "bg-slate-50 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-900"
                  )}>
                   Pilih Judul
                   <ArrowRight size={18} />
                 </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <ModelLimitDialog 
        isOpen={isRateLimitOpen} 
        onOpenChange={setIsRateLimitOpen} 
      />
    </div>
  );
}
