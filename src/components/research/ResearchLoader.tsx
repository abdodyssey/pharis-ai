"use client";

import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon, TargetIcon, Idea01Icon } from "@hugeicons/core-free-icons";
import { useState, useEffect } from "react";

const messages = [
  "Scanning Global Academic Databases...",
  "Identifying Research Gaps...",
  "Curating 15+ Verified Literature Sources...",
  "Synthesizing Formal Title Recommendations...",
];

export default function ResearchLoader() {
  const [loadingIndex, setLoadingIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingIndex((prev) => (prev + 1) % messages.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center justify-center space-y-6 py-20">
      {/* Ultra-minimal Spinner/Icon */}
      <div className="relative">
         <motion.div
           animate={{ rotate: 360 }}
           transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
           className="w-12 h-12 rounded-full border border-slate-200 dark:border-white/5 border-t-accent-lime"
         />
         <div className="absolute inset-0 flex items-center justify-center">
            <HugeiconsIcon icon={SparklesIcon} size={16} className="text-accent-lime/40" />
         </div>
      </div>

      <div className="space-y-1.5 text-center">
        <motion.p
          key={loadingIndex}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-wide"
        >
          {messages[loadingIndex]}
        </motion.p>
        <div className="h-px w-12 bg-accent-lime/20 mx-auto" />
        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-600">
          High-Performance Academic RAG
        </p>
      </div>
    </div>
  );
}

