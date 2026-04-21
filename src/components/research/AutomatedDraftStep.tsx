"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useResearchStore } from "@/store/useResearchStore";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Loading01Icon, 
  FlashIcon, 
  Tick01Icon, 
  ArrowRight01Icon, 
  File01Icon,
  SparklesIcon,
  BookOpen01Icon,
  BubbleChatIcon,
  LibraryIcon
} from "@hugeicons/core-free-icons";
import { useToastStore } from "@/store/useToastStore";
import { callResearchAI, expandSection } from "@/lib/ai-service";
import { cn } from "@/lib/utils";
import { getWordCountFromHTML, hasCitations } from "@/store/useResearchStore";
import { motion, AnimatePresence } from "framer-motion";

interface AutomatedDraftStepProps {
  stepNumber: number;
  title: string;
  description: string;
  sectionTitle: string; // e.g. "Pendahuluan"
  mode: "generate_intro" | "generate_literature" | "generate_methods" | "generate_results" | "generate_discussion" | "generate_conclusion" | "generate_abstract" | "generate_bibliography" | "generate_synthesis";
  icon: React.ReactNode;
  subtitle: string;
  buttonText?: string;
}

export default function AutomatedDraftStep({
  stepNumber,
  title,
  description,
  sectionTitle,
  mode,
  icon,
  subtitle,
  buttonText = "Mulai Drafting"
}: AutomatedDraftStepProps) {
  const { 
    sessionId, 
    sections, 
    fetchSections, 
    completeStep, 
    updateResearchData,
    refinedTitle,
    bibliography,
    saveToDb
  } = useResearchStore();
  
  const [isTaskRunning, setIsTaskRunning] = useState(false);
  const autoStartedRef = useRef(false);
  const { addToast } = useToastStore();

  const section = sections.find(s => s.title === sectionTitle);
  const wordCount = getWordCountFromHTML(section?.content || "");
  const cited = hasCitations(section?.content || "");
  const isDone = !!section?.content && section.content.length > 20;
  const minWordRequirement = stepNumber === 8 ? 200 : stepNumber === 9 ? 0 : 500;
  const meetsGate = wordCount >= minWordRequirement && (cited || ![3, 4, 7].includes(stepNumber));

  const [isExpanding, setIsExpanding] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!sessionId || isTaskRunning) return;
    
    setIsTaskRunning(true);
    try {
      const { error } = await callResearchAI("", sessionId, mode);
      
      if (error) {
        if (error.includes("429")) {
          addToast({ 
            type: "warning", 
            message: "AI Sedang Istirahat", 
            description: "Kuota limit tercapai. Harap tunggu ~60 detik lalu coba lagi." 
          });
        } else {
          addToast({ 
            type: "error", 
            message: "Gagal Menghasilkan Naskah", 
            description: "Harap periksa koneksi atau API Key Groq Anda." 
          });
        }
        return;
      }
      
      addToast({
        type: "success",
        message: `${sectionTitle} Selesai`,
        description: "Naskah akademik telah tersusun secara naratif.",
      });

      await fetchSections(sessionId);
      await saveToDb();

      // Automatically proceed to Workspace if Step 9 is finished
      if (stepNumber === 9) {
        setTimeout(() => {
          handleNext();
        }, 1500);
      }
    } catch (err: any) {
      console.warn("Generation Error:", err.message);
      addToast({ 
        type: "error", 
        message: "Kesalahan Teknis", 
        description: "Terjadi gangguan saat menghubungi server AI." 
      });
    } finally {
      setIsTaskRunning(false);
    }
  }, [sessionId, isTaskRunning, mode, sectionTitle, addToast, fetchSections, saveToDb]);

  useEffect(() => {
    const isAutoStep = [3, 4, 5, 6, 7, 8, 9].includes(stepNumber);
    if (isAutoStep && sessionId && !isDone && !isTaskRunning && !autoStartedRef.current) {
      autoStartedRef.current = true;
      handleGenerate();
    }
  }, [stepNumber, sessionId, isDone, isTaskRunning, handleGenerate]);

  const handleExpand = async () => {
    if (!sessionId || !section || isExpanding) return;
    
    setIsExpanding(true);
    try {
      const { error } = await expandSection(sessionId, sectionTitle, section.content);
      
      if (error) {
        if (error.includes("429")) {
          addToast({ message: "Batas limit tercapai. Mohon tunggu.", type: "warning" });
        } else {
          addToast({ message: "Gagal memperluas narasi.", type: "error" });
        }
        return;
      }
      
      addToast({ type: "success", message: "Narasi Berhasil Diperluas" });
      await fetchSections(sessionId);
    } catch (err: any) {
      addToast({ message: "Gagal menyambungkan narasi.", type: "error" });
    } finally {
      setIsExpanding(false);
    }
  };

  const handleNext = async () => {
    try {
      await completeStep(stepNumber as any);
      updateResearchData({ currentStep: (stepNumber + 1) as any });
    } catch (err: any) {
      addToast({ type: "error", message: "Gagal Verifikasi Kualitas", description: err.message });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-16 lg:py-24 space-y-12">
      {/* Narrative Header */}
      <div className="space-y-6 max-w-2xl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3"
        >
          <div className="px-2 py-0.5 bg-slate-100 dark:bg-white/5 text-[10px] font-black tracking-[0.2em] uppercase rounded-md text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-white/5">
            Phase 0{stepNumber}
          </div>
          <div className="h-px w-8 bg-slate-200 dark:bg-white/10" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-2"
        >
          <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">
            {title}
          </h2>
          <p className="text-lg font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
            {description}
          </p>
        </motion.div>
      </div>

      {/* Modern Action Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* Left: Progress & Constraints */}
        <div className="lg:col-span-4 space-y-6 order-2 lg:order-1">
          <div className="p-8 bg-slate-50 dark:bg-obsidian-1 border border-slate-100 dark:border-white/5 rounded-3xl space-y-6">
            <div className="flex items-center gap-3">
              <HugeiconsIcon icon={BookOpen01Icon} size={18} className="text-accent-lime" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Quality Gates</span>
            </div>
            
            <div className="space-y-4">
              <div className={cn(
                "flex items-center justify-between p-4 rounded-2xl border transition-all",
                wordCount >= minWordRequirement ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-white dark:bg-obsidian-2 border-slate-100 dark:border-white/5 text-slate-400 dark:text-slate-600"
              )}>
                <span className="text-[11px] font-black uppercase tracking-tight">Length</span>
                <span className="text-xs font-black">{wordCount} / {minWordRequirement} words</span>
              </div>
              
              {([3, 4, 7].includes(stepNumber)) && (
                <div className={cn(
                  "flex items-center justify-between p-4 rounded-2xl border transition-all",
                  cited ? "bg-accent-lime/5 border-accent-lime/20 text-accent-lime" : "bg-white dark:bg-obsidian-2 border-slate-100 dark:border-white/5 text-slate-400 dark:text-slate-600"
                )}>
                  <span className="text-[11px] font-black uppercase tracking-tight">Citations</span>
                  <span className="text-xs font-black uppercase tracking-tighter">{cited ? "Verified" : "Author, Year Read"}</span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 leading-relaxed italic">
                Tips: Gunakan "Expand" untuk mendalami analisis naskah secara otomatis berdasarkan basis data literatur Anda.
              </p>
            </div>
          </div>

          {refinedTitle && (
            <div className="p-8 bg-slate-900 text-white rounded-3xl space-y-3">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Active Project</span>
              <p className="text-sm font-bold leading-tight line-clamp-3">{refinedTitle}</p>
            </div>
          )}
        </div>

        {/* Right: Main Editor/Action Area */}
        <div className="lg:col-span-8 order-1 lg:order-2">
          <div className="relative group min-h-[400px] h-full">
            <div className="absolute -inset-2 bg-gradient-to-r from-accent-lime/10 to-emerald-500/10 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-1000" />
            
            <div className={cn(
              "relative h-full bg-white dark:bg-obsidian-1 border-2 rounded-3xl p-4 flex flex-col transition-all duration-500",
              isDone ? "border-slate-100 dark:border-white/5" : "border-slate-900 border-dashed dark:border-accent-lime/30"
            )}>
              <AnimatePresence mode="wait">
                {!isDone && !isTaskRunning ? (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center text-center p-10 space-y-8"
                  >
                    <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-3xl flex items-center justify-center text-slate-300 dark:text-slate-700 animate-pulse">
                      {icon}
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white">Ready to Draft</h3>
                      <p className="text-slate-400 dark:text-slate-500 text-sm font-medium leading-relaxed max-w-xs mx-auto">
                        {subtitle}
                      </p>
                    </div>
                    <button
                      onClick={handleGenerate}
                      className="group bg-slate-900 dark:bg-accent-lime text-white dark:text-obsidian-0 px-10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
                    >
                      <HugeiconsIcon icon={SparklesIcon} size={18} />
                      {buttonText}
                    </button>
                  </motion.div>
                ) : isTaskRunning ? (
                  <motion.div 
                    key="running"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col items-center justify-center text-center p-10 space-y-6"
                  >
                    <div className="w-16 h-16 bg-accent-lime/10 text-accent-lime rounded-full flex items-center justify-center shadow-2xl shadow-accent-lime/20 relative">
                       <div className="absolute inset-0 rounded-full border-4 border-accent-lime/30 animate-ping" />
                       <HugeiconsIcon icon={Loading01Icon} size={32} className="animate-spin" />
                    </div>
                    <div className="space-y-2">
                       <h4 className="text-xl font-black text-slate-900 dark:text-white">Menyusun Narasi...</h4>
                       <p className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                          Grounded AI Logic Engaged
                       </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="done"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col bg-slate-50 dark:bg-obsidian-1/50 rounded-3xl overflow-hidden"
                  >
                    <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white dark:bg-obsidian-1">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white">
                             <HugeiconsIcon icon={Tick01Icon} size={16} />
                          </div>
                          <div>
                             <h4 className="text-sm font-black text-slate-900 dark:text-white leading-none">{sectionTitle} Draft</h4>
                             <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Live Preview & Analysis</span>
                          </div>
                       </div>
                       <button 
                        onClick={handleGenerate}
                        className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                        title="Regenerate"
                       >
                         <HugeiconsIcon icon={Loading01Icon} size={18} />
                       </button>
                    </div>

                    <div className="flex-1 p-10 overflow-y-auto max-h-[500px] custom-scrollbar">
                       <div 
                        className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed prose prose-slate dark:prose-invert prose-p:mb-6 prose-p:font-medium"
                        dangerouslySetInnerHTML={{ __html: section?.content || "" }}
                       />
                    </div>

                    <div className="p-6 bg-white dark:bg-obsidian-1 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row gap-4">
                       <button
                        onClick={handleExpand}
                        disabled={isExpanding}
                        className="flex-1 bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all hover:bg-slate-200 dark:hover:bg-white/10 active:scale-95 flex items-center justify-center gap-3 border border-slate-200 dark:border-white/5"
                       >
                         {isExpanding ? <HugeiconsIcon icon={Loading01Icon} className="animate-spin" size={18} /> : <HugeiconsIcon icon={SparklesIcon} size={18} />}
                         Expand Analysis
                       </button>

                       <button
                        onClick={handleNext}
                        disabled={!meetsGate}
                        className={cn(
                          "flex-[1.5] py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 shadow-xl flex items-center justify-center gap-3",
                          meetsGate ? "bg-accent-lime text-obsidian-0 shadow-accent-lime/20" : "bg-slate-200 dark:bg-white/5 text-slate-400 dark:text-slate-600 grayscale"
                        )}
                       >
                         <span>{stepNumber === 9 ? "Review Complete" : "Lanjut ke Step Berikutnya"}</span>
                         <HugeiconsIcon icon={ArrowRight01Icon} size={20} />
                       </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

      </div>

      {/* Sync Footer */}
      <div className="flex items-center justify-center pt-6 gap-6 opacity-30 select-none grayscale">
        <div className="flex items-center gap-2">
           <HugeiconsIcon icon={BubbleChatIcon} size={12} className="text-slate-400" />
           <span className="text-[9px] font-black uppercase tracking-widest">Cognitive Engine v2.0</span>
        </div>
        <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
        <div className="flex items-center gap-2">
           <HugeiconsIcon icon={FlashIcon} size={12} className="text-accent-lime" />
           <span className="text-[9px] font-black uppercase tracking-widest text-accent-lime">Low Latency Active</span>
        </div>
      </div>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); }
      `}</style>
    </div>
  );
}
