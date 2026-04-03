"use client";

import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { X, ArrowRight, Sparkles, Target, Lightbulb, BrainCircuit, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { callResearchAI } from "@/lib/ai-service";
import { useResearchStore } from "@/store/useResearchStore";
import { useToastStore } from "@/store/useToastStore";
import ModelLimitDialog from "@/components/shared/ModelLimitDialog";
import { TitleOption, BibliographyEntry } from "@/types/research";
import { supabase } from "@/lib/supabase";

const step1LoadingMessages = [
  "Membedah esensi ide riset Anda...",
  "Mencari literatur relevan...",
  "Menganalisis research gap...",
  "Merumuskan opsi judul strategis...",
];

const step2LoadingMessages = [
  "Menyusun struktur SMART...",
  "Membangun draf awal konten...",
  "Menyiapkan workspace akademik Anda...",
];

export default function NewResearchModal({ trigger }: { trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [topic, setTopic] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [titleOptions, setTitleOptions] = useState<TitleOption[]>([]);
  const [bibliography, setBibliography] = useState<BibliographyEntry[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isRateLimitOpen, setIsRateLimitOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  
  const router = useRouter();
  const { updateResearchData } = useResearchStore();
  const { addToast } = useToastStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const resetLocalState = () => {
    setStep(1);
    setTopic("");
    setTitleOptions([]);
    setBibliography([]);
    setSelectedIdx(null);
    setError(null);
    setShowCancelConfirm(false);
  };

  const handleCloseAttempt = () => {
    if (isGenerating || titleOptions.length > 0) {
      setShowCancelConfirm(true);
    } else {
      setOpen(false);
    }
  };

  const confirmCancel = () => {
    setOpen(false);
    setShowCancelConfirm(false);
  };

  useResetModalState(open, resetLocalState);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      interval = setInterval(() => {
        setLoadingIndex((prev) => (prev + 1) % 4);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const formatErrorMessage = (err: any) => {
    const status = err.status || err.status_code;
    const message = err.message || "";
    const lowerMessage = message.toLowerCase();
    
    // Informational log for debugging (using log to bypass dev overlay)
    console.log("Research AI Debug:", { status, message });

    // 1. Handling Capacity / Limit (including Indonesian keywords)
    if (
      status === 429 || 
      lowerMessage.includes("429") || 
      lowerMessage.includes("limit") || 
      lowerMessage.includes("quota") ||
      lowerMessage.includes("penuh")
    ) {
      return "Waduh, kapasitas AI kami sedang penuh. Mohon tunggu 1 menit lagi ya.";
    }

    // 2. Handling Timeout / Server Error
    if (
      status === 500 || 
      status === 504 || 
      lowerMessage.includes("500") || 
      lowerMessage.includes("504") || 
      lowerMessage.includes("timeout") ||
      lowerMessage.includes("lelah")
    ) {
      return "Sistem kami sedang sedikit lelah. Mari coba lagi dalam beberapa detik.";
    }

    // 3. Handling Network / Technical Strings
    if (
      lowerMessage.includes("network") || 
      lowerMessage.includes("fetch") || 
      lowerMessage.includes("non-2xx") || 
      lowerMessage.includes("functionshttperror")
    ) {
      if (lowerMessage.includes("network")) return "Koneksi terputus. Pastikan internet Anda lancar.";
      return "Terjadi kendala teknis sejenak. Silakan klik 'Coba Lagi'.";
    }

    // Default friendly message (clean up technical prefixes)
    return message.length > 5 && !message.includes("Error") && !message.includes("{") 
      ? message 
      : "Terjadi kendala teknis sejenak. Silakan klik 'Coba Lagi'.";
  };

  const handleBrainstorm = async () => {
    if (!topic) return;
    setIsGenerating(true);
    setLoadingIndex(0);
    setError(null);
    try {
      const { data, error, status } = await callResearchAI(topic, null, "brainstorm");
      
      if (error) {
        const humanMessage = formatErrorMessage({ message: error, status });
        if (status === 429) {
          setIsRateLimitOpen(true);
        }
        setError(humanMessage);
        addToast({
          type: "warning",
          message: "Kendala Sejenak",
          description: humanMessage
        });
        setIsGenerating(false);
        return;
      }
      
      // result now contains { options: TitleOption[], bibliography: BibliographyEntry[] }
      if (data?.options) {
        setTitleOptions(data.options);
        setBibliography(data.bibliography || []);
        setStep(2);
      }
    } catch (err: any) {
      const humanMessage = "Terjadi kendala teknis mendadak. Silakan coba lagi.";
      setError(humanMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmSelection = async (idx: number) => {
    setSelectedIdx(idx);
    setIsGenerating(true);
    setLoadingIndex(0);
    setError(null);

    try {
      const selected = titleOptions[idx];
      
      // THE "COMMIT" ACTION - INSERT TO DATABASE FOR THE FIRST TIME
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Anda harus login untuk menyimpan riset.");

      // Sanitize Data for JSONB
      const sanitizedOptions = (titleOptions || []).map(opt => ({
        title: opt.title || "",
        gap: opt.gap || "",
        rationale: opt.rationale || ""
      }));

      const sanitizedBibliography = (bibliography || []).map(bib => ({
        title: bib.title || "",
        authors: bib.authors || "",
        year: bib.year || new Date().getFullYear(),
        url: bib.url || "",
        abstract: bib.abstract || "",
        doi: bib.doi || null
      }));

      const { data: newSession, error: insertError } = await supabase
        .from("research_sessions")
        .insert({
          user_id: user.id,
          initial_topic: topic,
          title_options: sanitizedOptions,
          bibliography: sanitizedBibliography,
          current_step: 2,
        })
        .select("id")
        .single();

      if (insertError) {
         setError("Gagal menyimpan ke database. Struktur data tidak sesuai.");
         setIsGenerating(false);
         return;
      }

      // STEP 2: CALL AI TO GENERATE CONTENT FOR THE NEWLY CREATED SESSION
      const { data: generateData, error: generateError, status: generateStatus } = 
        await callResearchAI(topic, newSession.id, "generate", selected.title);

      if (generateError) {
        const humanMessage = formatErrorMessage({ message: generateError, status: generateStatus });
        if (generateStatus === 429) {
          setIsRateLimitOpen(true);
        }
        setError(humanMessage);
        addToast({
          type: "warning",
          message: "Proses Terhenti",
          description: humanMessage
        });
        setIsGenerating(false);
        return;
      }

      if (generateData?.session) {
        updateResearchData({
          sessionId: generateData.session.id,
          refinedTitle: generateData.session.refined_title,
          objectives: generateData.session.research_objectives || [],
          currentStep: 3,
        });
        
        // Final Redirect
        setOpen(false);
        router.push(`/research/${generateData.session.id}`);
      }
    } catch (err: any) {
      setError("Gagal membangun riset. Silakan coba kembali.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!mounted) {
    return <>{trigger}</>;
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => {
      if (!v) {
        handleCloseAttempt();
      } else {
        setOpen(true);
      }
    }}>
      <Dialog.Trigger asChild>
        {trigger}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 animate-in fade-in duration-300" />
        <Dialog.Content 
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => {
            e.preventDefault();
            handleCloseAttempt();
          }}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[85vh] bg-white rounded-[2.5rem] shadow-2xl z-50 p-0 animate-in zoom-in-95 fade-in duration-300 focus:outline-none flex flex-col overflow-hidden"
        >
          <div className="relative flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12">
            {/* Close Button */}
            <button 
              onClick={handleCloseAttempt}
              className="absolute top-8 right-8 p-2 rounded-full hover:bg-slate-50 text-slate-400 transition-colors z-10 bg-white/80 backdrop-blur-md"
            >
              <X size={20} />
            </button>

            {step === 1 ? (
              <div className="space-y-10">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-900">
                    <BrainCircuit size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest leading-none">New Research</span>
                  </div>
                  <Dialog.Title asChild>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Apa fenomena yang ingin Anda teliti?</h2>
                  </Dialog.Title>
                  <Dialog.Description asChild>
                    <p className="text-slate-500 font-medium leading-relaxed">
                      Tuangkan ide, masalah, atau fenomena awal. PharisAI akan membantu membedahnya menjadi struktur akademik.
                    </p>
                  </Dialog.Description>
                </div>

                {error && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="p-1.5 rounded-lg bg-amber-100 text-amber-600 shrink-0">
                      <AlertCircle size={16} />
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-sm font-medium text-amber-800 leading-relaxed">
                        {error}
                      </p>
                      <button 
                        onClick={() => handleBrainstorm()}
                        className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors underline decoration-2 underline-offset-4"
                      >
                        Coba Lagi
                      </button>
                    </div>
                  </div>
                )}

                <div className="relative">
                  <textarea
                    autoFocus
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Contoh: Pengaruh AI terhadap efisiensi penulisan jurnal mahasiswa tingkat akhir..."
                    className="w-full bg-slate-50/50 rounded-2xl p-6 min-h-[220px] text-lg text-slate-800 placeholder-slate-300 border-none focus:ring-2 focus:ring-slate-200 transition-all resize-none"
                    disabled={isGenerating}
                  />
                  
                  <div className="absolute bottom-4 right-4">
                    <button
                      onClick={handleBrainstorm}
                      disabled={!topic || isGenerating}
                      className={cn(
                        "flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95",
                        isGenerating 
                          ? "bg-slate-800 text-white" 
                          : "bg-slate-900 text-white hover:bg-black"
                      )}
                    >
                      {isGenerating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          <span className="text-sm">{step1LoadingMessages[loadingIndex]}</span>
                        </>
                      ) : (
                        <>
                          <span>Lanjut</span>
                          <ArrowRight size={18} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-900">
                    <Sparkles size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Title Selection</span>
                  </div>
                  <Dialog.Title asChild>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Pilih Arah Judul Penelitian</h2>
                  </Dialog.Title>
                  <Dialog.Description asChild>
                    <p className="text-slate-500 font-medium">Berdasarkan research gap yang ditemukan, pilih satu arah yang paling sesuai.</p>
                  </Dialog.Description>
                </div>

                {error && (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="p-1.5 rounded-lg bg-amber-100 text-amber-600 shrink-0">
                      <AlertCircle size={16} />
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-sm font-medium text-amber-800 leading-relaxed">
                        {error}
                      </p>
                      <button 
                        onClick={() => handleConfirmSelection(selectedIdx!)}
                        className="text-xs font-bold text-amber-600 hover:text-amber-700 transition-colors underline decoration-2 underline-offset-4"
                      >
                        Coba Lagi
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid gap-4">
                  {titleOptions.map((option, i) => (
                    <button
                      key={i}
                      disabled={isGenerating}
                      onClick={() => handleConfirmSelection(i)}
                      className={cn(
                        "text-left p-6 rounded-2xl border-2 transition-all group relative overflow-hidden",
                        selectedIdx === i 
                          ? "border-slate-900 bg-slate-50" 
                          : "border-slate-100 hover:border-slate-200 bg-white"
                      )}
                    >
                      <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                          {i === 0 && <Target size={20} />}
                          {i === 1 && <Lightbulb size={20} />}
                          {i === 2 && <Sparkles size={20} />}
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-bold text-slate-900 group-hover:text-black transition-colors leading-snug">
                            {option.title}
                          </h3>
                          <p className="text-sm text-slate-500 leading-relaxed">
                            {option.gap}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {isGenerating && (
                  <div className="flex flex-col items-center gap-3 py-4 animate-in fade-in duration-500">
                    <div className="w-10 h-10 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
                    <p className="text-sm font-bold text-slate-600 animate-pulse">{step2LoadingMessages[loadingIndex]}</p>
                  </div>
                )}
              </div>
            )}
            
            {/* Shimmer overlay (during generation) */}
            {isGenerating && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[2.5rem]">
                 <div className="absolute inset-0 bg-linear-to-r from-transparent via-slate-100/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
              </div>
            )}

            {/* Cancel Confirmation Overlay */}
            {showCancelConfirm && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-12 text-center animate-in fade-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-500 flex items-center justify-center mb-6">
                  <AlertCircle size={32} />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Batalkan pembuatan riset?</h3>
                <p className="text-slate-500 font-medium leading-relaxed mb-10 max-w-sm">
                  Seluruh progres analisis dan pencarian jurnal saat ini akan dibatalkan dan tidak akan disimpan.
                </p>
                <div className="flex flex-col w-full max-w-xs gap-3">
                  <button 
                    onClick={confirmCancel}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-95"
                  >
                    Ya, Batalkan
                  </button>
                  <button 
                    onClick={() => setShowCancelConfirm(false)}
                    className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all active:scale-95"
                  >
                    Lanjutkan Riset
                  </button>
                </div>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          margin: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
      <ModelLimitDialog 
        isOpen={isRateLimitOpen} 
        onOpenChange={setIsRateLimitOpen} 
      />
    </Dialog.Root>
  );
}

// Side-effect to reset state when modal is fully closed
function useResetModalState(open: boolean, resetFn: () => void) {
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(resetFn, 300); // Wait for exit animation
      return () => clearTimeout(timer);
    }
  }, [open, resetFn]);
}

