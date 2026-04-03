"use client";

import { useToastStore } from "@/store/useToastStore";
import { AnimatePresence, motion } from "framer-motion";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";
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
              "pointer-events-auto min-w-[320px] max-w-md p-4 rounded-2xl shadow-2xl border flex items-start gap-4 glass-effect",
              toast.type === "success" && "border-emerald-100 bg-white/95 text-emerald-900",
              toast.type === "error" && "border-red-100 bg-white/95 text-red-900",
              toast.type === "warning" && "border-amber-100 bg-white/95 text-amber-900",
              toast.type === "info" && "border-slate-100 bg-white/95 text-slate-900"
            )}
          >
            <div className="shrink-0 pt-0.5">
              {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
              {toast.type === "error" && <AlertCircle className="w-5 h-5 text-red-500" />}
              {toast.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-500" />}
              {toast.type === "info" && <Info className="w-5 h-5 text-slate-900" />}
            </div>
            
            <div className="flex-1 space-y-1">
              <h4 className="font-bold text-sm tracking-tight leading-none">
                {toast.message}
              </h4>
              {toast.description && (
                <p className="text-xs opacity-70 leading-relaxed font-medium">
                  {toast.description}
                </p>
              )}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 p-1 rounded-lg hover:bg-slate-100/50 transition-colors opacity-40 hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
