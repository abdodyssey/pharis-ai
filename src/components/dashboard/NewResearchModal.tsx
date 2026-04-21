"use client";

import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  ArrowRight01Icon, 
  SparklesIcon, 
  TargetIcon, 
  Idea01Icon, 
  Brain02Icon, 
  AlertCircleIcon, 
  Cancel01Icon 
} from "@hugeicons/core-free-icons";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { callResearchAI } from "@/lib/ai-service";
import { useResearchStore } from "@/store/useResearchStore";
import ModelLimitDialog from "@/components/shared/ModelLimitDialog";
import { TitleOption, BibliographyEntry } from "@/types/research";
import { supabase } from "@/lib/supabase";
import { z } from "zod";
import { Button } from "@/components/ui/Button";

const TitleOptionSchema = z.object({
  title: z.string().default("Untitled Research"),
  gap: z.string().default("No gap specified"),
  rationale: z.string().default("No rationale provided"),
  keywords: z.array(z.string()).default([])
});

const BrainstormSchema = z.object({
  options: z.array(TitleOptionSchema).default([]),
  keywords: z.array(z.string()).default([]),
  bibliography: z.array(z.any()).default([])
});

const GenerateSchema = z.object({
  session: z.object({
    id: z.string(),
    refined_title: z.string().default(""),
    keywords: z.array(z.string()).default([]),
    research_objectives: z.array(z.string()).default([]),
    current_step: z.number().default(3)
  }).optional()
});

const loadingMessages = [
  "Membedah esensi ide riset Anda...",
  "Mencari literatur relevan (15 Jurnal)...",
  "Menganalisis research gap...",
  "Menyusun draf struktur Bab 1-7...",
  "Menyiapkan workspace akademik Anda..."
];

export default function NewResearchModal({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [titleOptions, setTitleOptions] = useState<TitleOption[]>([]);
  const [bibliography, setBibliography] = useState<BibliographyEntry[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isRateLimitOpen, setIsRateLimitOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const router = useRouter();
  const { updateResearchData } = useResearchStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const resetLocalState = () => {
    setTopic("");
    setTitleOptions([]);
    setBibliography([]);
    setKeywords([]);
    setSelectedIdx(null);
    setError(null);
    setShowCancelConfirm(false);
  };

  useEffect(() => {
    if (!open) {
      const timer = setTimeout(resetLocalState, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      interval = setInterval(() => {
        setLoadingIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleClose = () => {
    if (isGenerating) {
      setShowCancelConfirm(true);
    } else {
      setOpen(false);
    }
  };

  const confirmCancel = () => {
    setOpen(false);
    setIsGenerating(false);
    setShowCancelConfirm(false);
  };

  const handleBrainstorm = async () => {
    if (!topic) return;
    setIsGenerating(true);
    setLoadingIndex(0);
    setError(null);
    try {
      const { data, error: aiError, status } = await callResearchAI(topic, null, "brainstorm");
      
      if (aiError) {
        if (status === 429) setIsRateLimitOpen(true);
        setError("Gagal menganalisis. Coba gunakan topik yang lebih spesifik.");
        setIsGenerating(false);
        return;
      }
      
      const validated = BrainstormSchema.safeParse(data);
      if (!validated.success || !validated.data.options.length) {
        throw new Error("Hasil AI tidak sesuai standar.");
      }

      setTitleOptions(validated.data.options);
      setBibliography((validated.data.bibliography as BibliographyEntry[]) || []);
      setKeywords(validated.data.keywords || []);
    } catch (err) {
      console.error(err);
      setError("Data riset tidak terbaca. Silakan coba lagi.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmSelection = async (idx: number) => {
    if (isGenerating) return;
    
    setSelectedIdx(idx);
    setIsGenerating(true);
    setLoadingIndex(3);
    setError(null);

    let redirected = false;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthorized");

      // Verify quota
      const { count } = await supabase
        .from("research_sessions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      const { data: sub } = await supabase
        .from("user_subscriptions")
        .select("plan_type")
        .eq("user_id", user.id)
        .maybeSingle();

      const plan = sub?.plan_type || "free";
      const limit = plan === "pro" ? 10 : 2;

      if (count !== null && count >= limit) {
        throw new Error(`Limit tercapai! Tersedia ${limit} slot riset untuk paket ${plan.toUpperCase()}. Silahkan upgrade di menu Billing & Plan.`);
      }

      const finalData = {
        user_id: user.id,
        initial_topic: topic,
        title_options: titleOptions,
        bibliography: bibliography,
        keywords: keywords,
        current_step: 3,
      };

      const { data: newSession, error: insErr } = await supabase
        .from("research_sessions")
        .insert(finalData)
        .select("id")
        .single();

      if (insErr) throw insErr;

      const { data: genData, error: genErr } = await callResearchAI(
        topic, 
        newSession.id, 
        "init", 
        titleOptions[idx].title
      );

      if (genErr) throw new Error(genErr);

      // We only need the session metadata/basics now
      const session = genData.session;
      updateResearchData({
        sessionId: session.id,
        refinedTitle: session.refined_title,
        keywords: session.keywords,
        objectives: session.research_objectives,
        currentStep: 3,
      });
      
      if (!redirected) {
        redirected = true;
        setOpen(false);
        router.push(`/research/${session.id}`);
      }
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Gagal membangun riset. Coba kembali.";
      setError(message);
      setIsGenerating(false);
    }
  };

  if (!isMounted) return <>{trigger}</>;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-50 animate-in fade-in duration-300"
          onClick={handleClose}
        />
        <Dialog.Content 
          asChild
          onPointerDownOutside={(e) => { e.preventDefault(); handleClose(); }}
          onEscapeKeyDown={(e) => { e.preventDefault(); handleClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md max-h-[90vh] bg-slate-950 dark:bg-obsidian-1 rounded-2xl shadow-2xl dark:shadow-black/60 z-50 p-0 focus:outline-none flex flex-col overflow-hidden border border-slate-200 dark:border-obsidian-2",
            )}
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 text-slate-500 hover:text-white transition-all z-10"
              aria-label="Tutup modal"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={16} />
            </button>

            <div className="relative flex-1 overflow-y-auto custom-scrollbar p-6">
              <div className="space-y-6">
                <div className="space-y-2.5">
                  <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-500">
                    <HugeiconsIcon icon={Brain02Icon} size={10} className="text-lime-500" />
                    <span className="text-[8px] font-black leading-none">PharisAI Research Engine</span>
                  </div>
                  <Dialog.Title asChild>
                    <h2 className="text-lg md:text-xl font-medium text-slate-100 tracking-tight leading-tight">
                      {titleOptions.length > 0 ? "Pilih Fokus Penelitian" : "Mulai Riset Sekarang"}
                    </h2>
                  </Dialog.Title>
                  <Dialog.Description asChild>
                    <p className="text-xs md:text-sm text-slate-400 leading-relaxed font-normal">
                      {titleOptions.length > 0 
                        ? "Pilih satu judul di bawah untuk menyusun draf struktur Bab 1-7."
                        : "Tuangkan ide awal Anda melalui PharisAI Core Engine."
                      }
                    </p>
                  </Dialog.Description>
                </div>

                {error && (
                  <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 flex items-start gap-3 animate-in fade-in">
                    <HugeiconsIcon icon={AlertCircleIcon} size={16} className="text-red-500 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1">
                      <p className="text-xs font-bold text-red-200 leading-relaxed">{error}</p>
                      <button 
                        onClick={() => titleOptions.length > 0 ? handleConfirmSelection(selectedIdx || 0) : handleBrainstorm()}
                        className="text-[10px] font-black text-white underline decoration-2 underline-offset-4"
                      >
                        Coba Lagi
                      </button>
                    </div>
                  </div>
                )}

                {titleOptions.length === 0 ? (
                  <div className="space-y-6">
                    <textarea
                      autoFocus
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="Contoh: Pengaruh AI terhadap efisiensi penulisan jurnal mahasiswa..."
                      className="w-full bg-slate-900/40 border-slate-800 rounded-xl p-5 min-h-[140px] text-sm text-slate-100 placeholder-slate-600 focus:border-lime-500/50 focus:ring-1 focus:ring-lime-500/20 transition-all resize-none outline-none shadow-sm"
                      disabled={isGenerating}
                    />
                    
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <Button 
                        variant="ghost" 
                        onClick={handleClose} 
                        disabled={isGenerating}
                        className="px-5 py-2 h-auto text-[13px] text-slate-400 hover:text-slate-200 hover:bg-transparent"
                      >
                        Batal
                      </Button>
                      <Button
                        onClick={handleBrainstorm}
                        disabled={!topic || isGenerating}
                        isLoading={isGenerating}
                        className="bg-lime-600 text-white hover:bg-lime-500 font-medium px-5 py-2 h-auto text-[13px] rounded-xl shadow-lg shadow-lime-900/10 border-none transition-all"
                      >
                        {isGenerating ? loadingMessages[loadingIndex] : "Mulai Analisis"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-400">
                    <div className="grid gap-3">
                      {titleOptions.map((option, i) => (
                        <button
                          key={i}
                          disabled={isGenerating}
                          onClick={() => handleConfirmSelection(i)}
                          className={cn(
                            "text-left p-6 rounded-2xl border transition-all group relative overflow-hidden",
                            selectedIdx === i 
                              ? "border-accent-lime bg-obsidian-2" 
                              : "border-obsidian-2 hover:border-slate-700 bg-obsidian-1"
                          )}
                        >
                          <div className="flex gap-4">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                              selectedIdx === i 
                                ? "bg-accent-lime text-obsidian-0" 
                                : "bg-obsidian-2 text-slate-500"
                            )}>
                              {i === 0 && <HugeiconsIcon icon={TargetIcon} size={20} />}
                              {i === 1 && <HugeiconsIcon icon={Idea01Icon} size={20} />}
                              {i === 2 && <HugeiconsIcon icon={SparklesIcon} size={20} />}
                            </div>
                            <div className="space-y-1">
                              <h3 className="text-base font-bold text-slate-100 leading-tight">{option.title}</h3>
                              <p className="text-[11px] text-slate-500 font-medium line-clamp-2 leading-relaxed">
                                Gap: {option.gap}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {showCancelConfirm && (
                <div className="absolute inset-0 bg-slate-950/95 dark:bg-obsidian-1/95 backdrop-blur-sm z-[60] flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-200">
                  <div className="w-14 h-14 rounded-2xl bg-obsidian-2 text-slate-100 flex items-center justify-center mb-6 border border-obsidian-3 shadow-xl">
                    <HugeiconsIcon icon={AlertCircleIcon} size={28} strokeWidth={1.5} className="text-accent-lime" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Hentikan Analisis?</h3>
                  <p className="text-sm text-slate-400 font-medium leading-relaxed mb-8 max-w-xs">
                    Seluruh progres pencarian literatur dan research gap akan hilang secara permanen.
                  </p>
                  <div className="flex flex-col w-full max-w-[240px] gap-3">
                     <Button variant="danger" size="md" onClick={confirmCancel}>Ya, Batalkan</Button>
                     <Button variant="ghost" size="md" className="text-slate-300" onClick={() => setShowCancelConfirm(false)}>Lanjutkan Analisis</Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; margin: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .animate-shake { animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }
      `}</style>
      <ModelLimitDialog isOpen={isRateLimitOpen} onOpenChange={setIsRateLimitOpen} />
    </Dialog.Root>
  );
}
