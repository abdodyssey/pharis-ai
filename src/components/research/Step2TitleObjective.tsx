"use client";

import { useState, useEffect } from "react";
import { useResearchStore } from "@/store/useResearchStore";
import { callResearchAI } from "@/lib/ai-service";
import { useToastStore } from "@/store/useToastStore";
import ModelLimitDialog from "@/components/shared/ModelLimitDialog";
import { HugeiconsIcon } from "@hugeicons/react";
import { TargetIcon, Idea01Icon, SparklesIcon, ArrowRight01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

const loadingMessages = [
  "Generating SMART objectives...",
  "Generating Introduction draf...",
  "Building IMRAD blueprint...",
  "Aligning with academic standards...",
  "Finalizing research scaffold...",
];

export default function Step2TitleObjective() {
  const {
    topic,
    titleOptions,
    sessionId,
    updateResearchData,
    nextStep,
    completeStep,
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

  const handleConfirmNextStep = async () => {
    if (selectedIdx === null || !sessionId) return;

    setIsGenerating(true);
    try {
      const selected = titleOptions[selectedIdx];
      
      // Fast transition: update store and save to DB
      await updateResearchData({
        refinedTitle: selected.title,
        currentStep: 3,
      });
      
      await completeStep(2);
      nextStep();
      
    } catch (err: unknown) {
      console.error(err);
      addToast({
        type: "error",
        message: "Kesalahan Sistem",
        description: "Gagal menyimpan pilihan judul.",
      });
    } finally {
      setIsGenerating(false);
    }
  };


  return (
    <div className="max-w-2xl mx-auto px-6 py-16 space-y-12">
      <div className="text-center space-y-6">
        <div className="flex flex-col items-center gap-4">
          <div className="px-3 py-1 bg-slate-100 dark:bg-obsidian-2 rounded-lg text-[9px] font-black text-accent-lime">
            Direction Analysis
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Pilih Arah Judul Penelitian
          </h2>
        </div>
        <p className="text-[13px] md:text-sm text-slate-500 font-medium leading-relaxed max-w-lg mx-auto">
          AI Pharis telah merumuskan berbagai alternatif ruang kosong riset (<i>Research Gap</i>) dari narasi awal Anda. Pilih satu judul yang paling merepresentasikan visi akhir manuskrip Anda.
        </p>
      </div>

      <div className="space-y-6">
        {titleOptions.map((option, i) => (
          <button
            key={i}
            onClick={() => setSelectedIdx(i)}
            className={cn(
              "group w-full relative p-6 md:p-8 bg-white/60 dark:bg-obsidian-1/60 backdrop-blur-2xl rounded-2xl transition-all duration-300 text-left border",
              selectedIdx === i
                ? "border-accent-lime shadow-[0_0_40px_rgba(204,255,0,0.15)] dark:shadow-[0_0_40px_rgba(204,255,0,0.05)] scale-[1.02]"
                : "border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-[0_0_30px_rgb(0,0,0,0.5)] hover:-translate-y-1"
            )}
          >
            {/* Absolute Focus Indicator... optional */}
            {selectedIdx === i && (
              <div className="absolute inset-0 border border-accent-lime rounded-2xl pointer-events-none shadow-[inset_0_0_20px_rgba(204,255,0,0.05)]" />
            )}

            <div className="flex items-start gap-5">
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 shadow-sm",
                  selectedIdx === i
                    ? "bg-accent-lime text-obsidian-0 shadow-accent-lime/30 scale-110"
                    : "bg-slate-100 dark:bg-obsidian-2 text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-white/5"
                )}
              >
                {selectedIdx === i ? <HugeiconsIcon icon={Tick01Icon} size={18} strokeWidth={3} className="animate-in zoom-in duration-300" /> : <span className="text-[11px] font-black">{i + 1}</span>}
              </div>

              <div className="flex-1 space-y-3.5 pt-0.5">
                <h3 className={cn(
                  "text-[15px] md:text-lg font-bold leading-snug transition-colors",
                  selectedIdx === i ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white"
                )}>
                  {option.title}
                </h3>
                <div className="flex flex-col gap-2 border-t border-slate-100 dark:border-white/[0.05] pt-3.5">
                   <div className="flex items-start gap-2.5 text-slate-500 dark:text-slate-400">
                     <HugeiconsIcon icon={TargetIcon} className="w-4 h-4 shrink-0 mt-0.5 text-accent-lime/70" />
                     <p className="text-[11px] md:text-xs font-medium italic leading-relaxed">
                       {option.gap}
                     </p>
                   </div>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="pt-10 border-t border-slate-200 dark:border-white/5 flex justify-center pb-10">
        <button
          onClick={handleConfirmNextStep}
          disabled={selectedIdx === null || isGenerating}
          className="group flex flex-col sm:flex-row items-center justify-center gap-3 h-[60px] px-12 bg-slate-900 dark:bg-accent-lime text-white dark:text-obsidian-0 rounded-xl font-bold text-sm hover:bg-accent-lime hover:text-obsidian-0 dark:hover:bg-white dark:hover:text-obsidian-0 disabled:opacity-30 disabled:scale-100 transition-all duration-300 hover:-translate-y-1 shadow-2xl shadow-slate-900/20 dark:shadow-accent-lime/20 w-full sm:w-auto"
        >
          {isGenerating ? (
             <span className="flex items-center gap-3">
               Memproses Modul... <HugeiconsIcon icon={SparklesIcon} size={16} className="animate-pulse" />
             </span>
          ) : (
            <>
              <span>Konfirmasi & Cari Referensi</span>
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </div>

      <ModelLimitDialog
        isOpen={isRateLimitOpen}
        onOpenChange={setIsRateLimitOpen}
      />
    </div>
  );
}
