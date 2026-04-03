"use client";

import { useState, useEffect } from "react";
import { useResearchStore } from "@/store/useResearchStore";
import { callResearchAI } from "@/lib/ai-service";
import { useToastStore } from "@/store/useToastStore";
import ModelLimitDialog from "@/components/shared/ModelLimitDialog";
import { cn } from "@/lib/utils";
import { ArrowRight, Sparkles } from "lucide-react";

const loadingMessages = [
  "Searching for 15 relevant journals...",
  "Categorizing literature by themes...",
  "Synthesizing research gaps...",
  "Mapping academic contradictions...",
  "Preparing your workspace...",
];

export default function Step1Idea() {
  const { topic, setTopic, nextStep, updateResearchData, sessionId } =
    useResearchStore();
  const { addToast } = useToastStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [isRateLimitOpen, setIsRateLimitOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      interval = setInterval(() => {
        setLoadingIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleGenerate = async () => {
    if (!topic) return;
    setIsGenerating(true);
    setLoadingIndex(0);
    try {
      const result = await callResearchAI(topic, sessionId, "brainstorm");

      if (result.error) {
        addToast({ 
          type: "error", 
          message: "Kesalahan AI", 
          description: result.error 
        });
        return;
      }

      if (result.session) {
        updateResearchData({
          sessionId: result.session.id,
          titleOptions: result.session.title_options || [],
          bibliography: result.session.bibliography || [],
          currentStep: 2,
        });
      }

      nextStep();
    } catch (err: any) {
      console.error(err);
      if (err.status === 429) {
        setIsRateLimitOpen(true);
      } else {
        addToast({ 
          type: "error", 
          message: "Kesalahan Sistem", 
          description: err.message || "Terjadi kesalahan sistem saat memproses ide." 
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 animate-in fade-in duration-1000">
      <div className="w-full max-w-2xl space-y-12">
        {/* Header Section */}
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center gap-3 px-3 py-1 rounded-full bg-blue-50 border border-blue-100/50">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">
              Phase 01
            </span>
            <div className="w-1 h-1 rounded-full bg-blue-400/50" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">
              Research Idea
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
            Mari bangun fondasi riset Anda hari ini.
          </h2>
          <p className="text-slate-500 text-lg leading-relaxed max-w-lg mx-auto">
            Tuangkan ide atau fenomena yang ingin Anda teliti. PharisAI akan membantu mengubahnya menjadi struktur akademik yang kokoh.
          </p>
        </div>

        {/* Premium Card Container */}
        <div className="relative group">
          {/* Animated Glow Border (visible only during generation) */}
          <div 
            className={cn(
              "absolute -inset-[2px] rounded-[2rem] bg-linear-to-r from-blue-600 via-indigo-500 to-emerald-400 opacity-0 blur-md transition-all duration-1000",
              isGenerating && "opacity-40 animate-pulse scale-[1.01]"
            )} 
          />

          {/* Main Card */}
          <div className="relative bg-white border border-slate-100 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all duration-500 group-focus-within:shadow-[0_20px_50px_rgba(37,99,235,0.08)] group-focus-within:border-blue-100/50">
            <div className="p-8 md:p-10 space-y-6">
              <div className="relative">
                <textarea
                  className="w-full bg-transparent border-none focus:ring-0 text-xl font-medium text-slate-800 placeholder-slate-300 min-h-[180px] md:min-h-[220px] resize-none leading-relaxed"
                  placeholder="Tuliskan idea, fenomena, atau keresahan yang ingin Anda teliti di sini..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={isGenerating}
                  autoFocus
                />
              </div>

              {/* Bottom Row / Action area */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-50/80">
                <div className="flex items-center gap-2 text-slate-400">
                  <span className="text-[10px] uppercase font-black tracking-widest">
                    {isGenerating ? "Processing..." : "Powered by Gemini 2.5"}
                  </span>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={!mounted || isGenerating || !topic}
                  className={cn(
                    "relative group flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none hover:bg-black hover:shadow-xl hover:shadow-slate-200",
                    isGenerating && "bg-blue-600"
                  )}
                >
                  {isGenerating ? (
                    <div className="flex items-center gap-4">
                      <div className="w-5 h-5 border-3 border-white/20 border-t-white rounded-full animate-spin" />
                      <span className="text-sm tracking-tight">{loadingMessages[loadingIndex]}</span>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm">Lanjut ke Judul & Tujuan</span>
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Shimmer overlay (during generation) */}
            {isGenerating && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[2rem]">
                 <div className="absolute inset-0 bg-linear-to-r from-transparent via-blue-50/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
              </div>
            )}
          </div>
        </div>

        {/* Support Note */}
        <div className="flex justify-center gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
           <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Semantic Scholar</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-slate-900" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">IA Academic RAG</span>
           </div>
        </div>
      </div>
      
      <style jsx>{`
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
    </div>
  );
}
