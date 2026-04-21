"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import { Alert01Icon, Delete02Icon, Loading01Icon } from "@hugeicons/core-free-icons";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
  title?: string;
}

export default function DeleteConfirmationDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  isLoading = false,
  title = "Hapus Riset Ini?",
}: DeleteConfirmationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-white dark:bg-obsidian-1 border-none shadow-2xl p-8 rounded-3xl">
        <DialogHeader className="flex flex-col items-center justify-center space-y-6 text-center">
          <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center shrink-0 animate-in fade-in zoom-in duration-500">
            <HugeiconsIcon icon={Alert01Icon} size={36} />
          </div>
          <div className="space-y-3">
            <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {title}
            </DialogTitle>
            <DialogDescription className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed">
              Tindakan ini bersifat <span className="text-rose-500 font-bold">permanen</span>. Seluruh progres riset, referensi, dan draf tulisan akan dihapus selamanya.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-3 pt-8">
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full px-6 py-4 rounded-xl bg-rose-500 text-white font-black text-sm hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 active:scale-[0.98] flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {isLoading ? (
              <HugeiconsIcon icon={Loading01Icon} className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <HugeiconsIcon icon={Delete02Icon} size={18} className="group-hover:rotate-12 transition-transform" />
                Ya, Hapus Permanen
              </>
            )}
          </button>
          
          <button
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="w-full px-6 py-3.5 rounded-xl bg-transparent text-slate-500 dark:text-slate-400 font-bold text-xs hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-all disabled:opacity-50"
          >
            Batalkan
          </button>
        </div>

        <div className="pt-6 border-t border-slate-100 dark:border-white/5 mt-4">
          <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest opacity-50">
            PharisAI Secure Content Management
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
