"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon, Loading01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

interface ActionConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "default";
}

export default function ActionConfirmDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  isLoading = false,
  title = "Konfirmasi Tindakan",
  description = "Apakah Anda yakin ingin melanjutkan tindakan ini?",
  confirmText = "Lanjutkan",
  cancelText = "Kembali",
  variant = "default",
}: ActionConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-obsidian-1 border border-slate-200 dark:border-obsidian-2 shadow-2xl p-0 overflow-hidden rounded-2xl">
        <div className="p-8 pb-6">
          <DialogHeader className="flex flex-col items-center text-center space-y-4">
            <div className={cn(
               "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg",
               variant === "danger" ? "bg-red-500/10 text-red-400" : 
               variant === "warning" ? "bg-amber-500/10 text-amber-500" :
               "bg-accent-lime/10 text-accent-lime"
            )}>
              <HugeiconsIcon icon={AlertCircleIcon} size={24} />
            </div>
            
            <div className="space-y-1.5">
              <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {title}
              </DialogTitle>
              <DialogDescription className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                {description}
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="flex gap-3 pt-8">
            <button
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1 h-11 px-4 rounded-lg bg-slate-100 dark:bg-obsidian-2 text-slate-500 dark:text-slate-400 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className={cn(
                "flex-1 h-11 px-4 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50",
                variant === "danger" ? "bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/10" :
                variant === "warning" ? "bg-amber-500 text-obsidian-0 hover:bg-amber-400 shadow-lg shadow-amber-500/10" :
                "bg-accent-lime text-obsidian-0 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-obsidian-0"
              )}
            >
              {isLoading ? (
                <HugeiconsIcon icon={Loading01Icon} className="w-4 h-4 animate-spin" />
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
