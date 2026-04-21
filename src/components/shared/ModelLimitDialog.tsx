"use client";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon, Clock01Icon, FlashIcon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

interface ModelLimitDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ModelLimitDialog({
  isOpen,
  onOpenChange,
}: ModelLimitDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-lg px-4"
        >
          <div className="bg-white/95 dark:bg-obsidian-1/95 backdrop-blur-xl border border-red-100 dark:border-red-500/20 rounded-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-[0_40px_100px_-24px_rgba(0,0,0,0.9)] p-6 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-50/50 dark:bg-red-900/10 rounded-full blur-3xl -mr-16 -mt-16" />
            
            <button 
              onClick={() => onOpenChange(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={16} />
            </button>

            <div className="flex items-start gap-5">
              <div className="w-14 h-14 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center shrink-0 animate-pulse">
                <HugeiconsIcon icon={AlertCircleIcon} size={28} />
              </div>

              <div className="space-y-4 flex-1">
                <div className="space-y-1">
                  <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">AI Sedang Istirahat</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    Wah, PharisAI baru saja mencapai batas kuota pemrosesan (Rate Limit). 
                  </p>
                </div>

                 <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-obsidian-2 border border-slate-100 dark:border-white/5">
                    <HugeiconsIcon icon={Clock01Icon} size={16} className="text-slate-400 dark:text-slate-500" />
                    <div>
                      <p className="text-[10px] font-black text-slate-400">Tunggu</p>
                      <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-none mt-1">~60 Detik</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-obsidian-2 border border-slate-100 dark:border-white/5">
                    <HugeiconsIcon icon={FlashIcon} size={16} className="text-slate-400 dark:text-slate-500" />
                    <div>
                      <p className="text-[10px] font-black text-slate-400">Saran</p>
                      <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-none mt-1">Prompt Singkat</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onOpenChange(false)}
                  className="w-full bg-slate-900 dark:bg-red-500 text-white py-3 rounded-xl font-bold text-sm transition-all active:scale-[0.98] hover:bg-black dark:hover:bg-red-600"
                >
                  Siaaap, Lanjutkan Nanti
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
