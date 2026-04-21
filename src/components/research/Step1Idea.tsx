import { HugeiconsIcon } from "@hugeicons/react";
import { 
  ArrowRight01Icon, 
  SparklesIcon, 
  ArrowLeft01Icon, 
  Idea01Icon,
  Cancel01Icon,
  FlashIcon,
  Tick01Icon,
  File01Icon,
  Search01Icon,
  BookOpen01Icon,
  PlusSignIcon,
  AnalyticsIcon
} from "@hugeicons/core-free-icons";
import { useResearchStore } from "@/store/useResearchStore";
import { useToastStore } from "@/store/useToastStore";
import { callResearchAI, fetchReferences } from "@/lib/ai-service";
import { cn } from "@/lib/utils";
import ResearchLoader from "./ResearchLoader";
import ModelLimitDialog from "@/components/shared/ModelLimitDialog";
import ActionConfirmDialog from "@/components/shared/ActionConfirmDialog";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type DiscoverStage = "idea" | "titles" | "references";

export default function Step1Idea() {
  const router = useRouter();
  const { 
    topic, 
    setTopic, 
    updateResearchData, 
    sessionId, 
    completeStep, 
    initializeProgress,
    titleOptions,
    deleteSession
  } = useResearchStore();
  
  const { addToast } = useToastStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isRateLimitOpen, setIsRateLimitOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleBack = () => {
    if (!titleOptions || titleOptions.length === 0) {
      setIsConfirmOpen(true);
    } else {
      router.push("/");
    }
  };

  const handleConfirmExit = async () => {
    await deleteSession();
    router.push("/");
  };

  const handleGenerate = async () => {
    if (!topic) return;
    setIsGenerating(true);
    try {
      const result = await callResearchAI(topic, sessionId, "brainstorm");

      if (result.error) throw new Error(result.error);

      if (result.data?.session) {
        const newSessionId = result.data.session.id;
        updateResearchData({
          sessionId: newSessionId,
          topic: topic,
          titleOptions: result.data.session.title_options || [],
          currentStep: 2
        });
        await initializeProgress(newSessionId);
        await completeStep(1);
      } else {
        updateResearchData({
          topic: topic,
          titleOptions: result.data.options || [],
          currentStep: 2
        });
        if (sessionId) await completeStep(1);
      }
      
      await useResearchStore.getState().saveToDb();
    } catch (err: any) {
      if (err.status === 429) setIsRateLimitOpen(true);
      else addToast({ type: "error", message: "Kesalahan AI", description: err.message });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-6 py-12 md:py-20 relative">
      {/* Top Header */}
      <div className="absolute top-0 left-0 w-full px-8 py-6 flex items-center justify-between z-20">
        <button
          onClick={handleBack}
          className="flex items-center gap-2.5 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-white dark:bg-obsidian-1 border border-slate-200 dark:border-white/5 flex items-center justify-center group-hover:border-slate-400 dark:group-hover:border-white/10 shadow-sm transition-all">
            <HugeiconsIcon icon={ArrowLeft01Icon} size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          </div>
          <span className="text-[10px] font-bold">Dashboard</span>
        </button>

        <div className="flex items-center gap-2 opacity-40">
           <HugeiconsIcon icon={FlashIcon} size={12} className="text-accent-lime" />
           <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Discovery Engine Active</span>
        </div>
      </div>

      <div className="w-full max-w-2xl space-y-12">
        <AnimatePresence mode="wait">
          {isGenerating ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <ResearchLoader />
            </motion.div>
          ) : (
            <motion.div
              key="stage-idea"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-10"
            >
              <div className="space-y-5 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="px-3 py-1 bg-slate-100 dark:bg-obsidian-2 rounded-lg text-[9px] font-black text-accent-lime">
                    Initial Ideation
                  </div>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                    Deskripsikan Fenomena Riset
                  </h2>
                </div>
                <p className="text-sm text-slate-500 font-medium max-w-md mx-auto leading-relaxed">
                  Masukkan draf ide atau masalah penelitian yang ingin Anda kaji secara mendalam.
                </p>
              </div>

              <div className="bg-white/80 dark:bg-obsidian-1/80 backdrop-blur-2xl border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden focus-within:ring-4 focus-within:ring-accent-lime/10 focus-within:border-accent-lime/30 transition-all duration-500 shadow-2xl shadow-slate-200/50 dark:shadow-black/50 dark:shadow-[0_40px_100px_-24px_rgba(0,0,0,0.9)] group relative">
                {/* Header Input Area */}
                <div className="p-4 px-8 border-b border-slate-100 dark:border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50 dark:bg-white/[0.01]">
                   <div className="flex items-center gap-2">
                     <HugeiconsIcon icon={Idea01Icon} size={16} className="text-accent-lime" />
                     <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Research Input Container</span>
                   </div>
                   <div className="text-[10px] text-slate-400 font-medium italic">
                     *Sebutkan subjek, masalah, atau metode
                   </div>
                </div>

                <div className="relative">
                  <textarea
                    className="w-full bg-transparent border-none focus:ring-0 text-lg md:text-xl font-medium text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-slate-700 min-h-[200px] p-8 md:px-10 md:py-8 resize-none leading-relaxed outline-none"
                    placeholder="Contoh: Saya ingin meneliti sentimen audiens Twitter terhadap kebijakan pemilu menggunakan algoritma Naive Bayes dan NLP..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    autoFocus
                  />
                  <div className="absolute font-mono text-[10px] bottom-6 right-8 text-slate-300 dark:text-slate-600 pointer-events-none group-focus-within:text-accent-lime transition-colors">
                    {topic.length} karakter
                  </div>
                </div>
                
                {/* Footer Action Area */}
                <div className="p-6 px-8 flex flex-col sm:flex-row justify-between items-center gap-6 bg-slate-50/50 dark:bg-white/[0.01] border-t border-slate-100 dark:border-white/5">
                  <div className="flex items-start gap-3">
                    <HugeiconsIcon icon={SparklesIcon} size={20} className="text-accent-lime shrink-0 mt-0.5" />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-[280px] leading-relaxed hidden sm:block">
                      AI Pharis akan mensintesiskan narasi Anda untuk menyusun opsi <strong className="text-slate-700 dark:text-slate-200">Judul Riset Akademik</strong> yang tervalidasi.
                    </p>
                  </div>
                  <button
                    onClick={handleGenerate}
                    disabled={!topic || topic.length < 10}
                    className="flex w-full sm:w-auto items-center justify-center gap-2.5 h-12 px-8 bg-slate-900 dark:bg-accent-lime text-white dark:text-obsidian-0 rounded-2xl font-bold text-xs hover:bg-accent-lime hover:text-obsidian-0 dark:hover:bg-white dark:hover:text-obsidian-0 transition-all active:scale-95 disabled:opacity-30 disabled:scale-100 shadow-xl shadow-slate-900/10 dark:shadow-accent-lime/10"
                  >
                    <span>Terbitkan Opsi Judul</span>
                    <HugeiconsIcon icon={ArrowRight01Icon} size={14} className="animate-pulse" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ActionConfirmDialog
        isOpen={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={handleConfirmExit}
        title="Keluar Pembentukan Riset?"
        description="Semua data topik dan referensi pada tahap ini akan hilang jika Anda belum menyimpannya. Yakin ingin keluar?"
        cancelText="Tetap di Sini"
        confirmText="Ya, Keluar"
        variant="warning"
      />

      <ModelLimitDialog
        isOpen={isRateLimitOpen}
        onOpenChange={setIsRateLimitOpen}
      />
    </div>
  );
}
