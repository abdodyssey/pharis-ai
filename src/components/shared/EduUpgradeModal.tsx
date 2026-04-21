"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  SparklesIcon, 
  ArrowRight01Icon, 
  CheckmarkCircle02Icon,
  CrownIcon
} from "@hugeicons/core-free-icons";

interface EduUpgradeModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EduUpgradeModal({
  isOpen,
  onOpenChange,
}: EduUpgradeModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] bg-white dark:bg-obsidian-1 border-none shadow-2xl p-8 rounded-2xl">
        <DialogHeader className="flex flex-col items-center justify-center space-y-6 text-center">
          <div className="w-16 h-16 bg-accent-lime/10 text-accent-lime rounded-xl flex items-center justify-center shrink-0">
            <HugeiconsIcon icon={CrownIcon} size={32} />
          </div>
          <div className="space-y-3">
            <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              Limit Research <br/> <span className="text-accent-lime">Free Plan Tercapai</span>
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed">
              Anda telah mencapai batas 2 artikel riset pada Free Plan. Lanjut eksplorasi tanpa batas dengan Edu Plan.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-8">
          <div className="space-y-3">
             <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                <div className="w-8 h-8 rounded-lg bg-accent-lime/20 flex items-center justify-center text-accent-lime shrink-0">
                   <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />
                </div>
                <div className="flex-1">
                   <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">Unlimited Research</p>
                   <p className="text-[10px] text-slate-500 font-medium">Buat naskah riset sebanyak yang Anda butuhkan.</p>
                </div>
             </div>
             
             <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                <div className="w-8 h-8 rounded-lg bg-accent-lime/20 flex items-center justify-center text-accent-lime shrink-0">
                   <HugeiconsIcon icon={SparklesIcon} size={16} />
                </div>
                <div className="flex-1">
                   <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">Priority AI Processing</p>
                   <p className="text-[10px] text-slate-500 font-medium">Tanpa antrian dengan model AI terbaru (Grounded v2).</p>
                </div>
             </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => window.location.href = "/billing"}
            className="w-full px-6 py-4 rounded-lg bg-slate-950 dark:bg-accent-lime text-white dark:text-obsidian-0 font-black text-sm hover:scale-[1.02] transition-all shadow-xl shadow-slate-900/10 dark:shadow-accent-lime/10 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            Upgrade ke Edu Plan
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
          </button>
          
          <button
            onClick={() => onOpenChange(false)}
            className="w-full px-6 py-3 rounded-lg bg-transparent text-slate-400 dark:text-slate-500 font-bold text-xs hover:text-slate-900 dark:hover:text-white transition-all"
          >
            Nanti Saja
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
