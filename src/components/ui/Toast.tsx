"use client";

import { useToastStore } from "@/store/useToastStore";
import { AnimatePresence, motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Cancel01Icon, 
  CheckmarkCircle02Icon, 
  AlertCircleIcon, 
  InformationCircleIcon, 
  Alert01Icon 
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

export default function CustomToaster() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={cn(
              "pointer-events-auto min-w-[320px] max-w-md p-5 rounded-2xl shadow-2xl shadow-slate-900/20 dark:shadow-black/80 border flex items-start gap-4 transition-all",
              "bg-white/95 backdrop-blur-md dark:bg-obsidian-1/95 dark:border-white/10",
              toast.type === "success" && "border-emerald-100 dark:border-emerald-500/20 text-emerald-900 dark:text-emerald-400",
              toast.type === "error" && "border-red-100 dark:border-red-500/20 text-red-900 dark:text-red-400",
              toast.type === "warning" && "border-amber-100 dark:border-amber-500/20 text-amber-900 dark:text-amber-400",
              toast.type === "info" && "border-slate-100 dark:border-white/5 text-slate-900 dark:text-slate-300"
            )}
          >
            <div className="shrink-0 pt-0.5">
              {toast.type === "success" && <HugeiconsIcon icon={CheckmarkCircle02Icon} className="w-5 h-5 text-emerald-500" />}
              {toast.type === "error" && <HugeiconsIcon icon={AlertCircleIcon} className="w-5 h-5 text-red-500" />}
              {toast.type === "warning" && <HugeiconsIcon icon={Alert01Icon} className="w-5 h-5 text-amber-500" />}
              {toast.type === "info" && <HugeiconsIcon icon={InformationCircleIcon} className="w-5 h-5 text-slate-900 dark:text-slate-300" />}
            </div>
            
            <div className="flex-1 space-y-1">
              <h4 className="font-black text-[13px] tracking-tight leading-none">
                {toast.message}
              </h4>
              {toast.description && (
                <p className="text-xs opacity-80 leading-relaxed font-medium">
                  {toast.description}
                </p>
              )}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors opacity-40 hover:opacity-100"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
