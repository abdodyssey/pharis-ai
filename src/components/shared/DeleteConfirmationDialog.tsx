"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";

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
      <DialogContent className="sm:max-w-md bg-white border-none shadow-2xl">
        <DialogHeader className="flex flex-col items-center justify-center space-y-4 pt-4 text-center">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center shrink-0">
            <AlertTriangle size={32} />
          </div>
          <div className="space-y-2">
            <DialogTitle className="text-2xl font-bold text-slate-900">
              {title}
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-base leading-relaxed max-w-[280px] mx-auto">
              Tindakan ini bersifat <span className="text-rose-600 font-bold italic">permanen</span> dan tidak dapat dibatalkan. Semua data riset Anda akan hilang.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row gap-3 pt-6">
          <button
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="flex-1 px-4 py-4 rounded-2xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            Batalkan
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-4 rounded-2xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition-all shadow-xl shadow-rose-200 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Trash2 size={18} />
                Ya, Hapus
              </>
            )}
          </button>
        </div>

        <p className="text-[10px] text-center text-slate-400 font-medium py-2">
          PharisAI Secure Content Management &middot; 2026
        </p>
      </DialogContent>
    </Dialog>
  );
}
