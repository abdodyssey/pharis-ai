"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import { AlertCircle, Clock, Zap } from "lucide-react";

interface ModelLimitDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ModelLimitDialog({
  isOpen,
  onOpenChange,
}: ModelLimitDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white border-red-50">
        <DialogHeader className="flex flex-col items-center justify-center space-y-4 pt-4">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center animate-pulse">
            <AlertCircle size={32} />
          </div>
          <div className="text-center space-y-1">
            <DialogTitle className="text-2xl font-bold text-slate-900 leading-tight">
              AI Sedang Istirahat Sejenak
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-base leading-relaxed px-4">
              Wah, PharisAI baru saja mencapai batas kuota pemrosesan (Rate Limit). 
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 py-6 px-2">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-blue-50/50 border border-blue-100/30">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Tunggu Sebentar</p>
              <p className="text-xs text-slate-500">Coba lagi dalam 30-60 detik ke depan.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/30">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Zap size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Saran</p>
              <p className="text-xs text-slate-500">Gunakan prompt yang lebih spesifik atau singkat.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={() => onOpenChange(false)}
            className="w-full bg-slate-900 text-white hover:bg-black py-4 rounded-2xl font-bold transition-all shadow-xl shadow-slate-200 active:scale-[0.98]"
          >
            Siaaap, Saya Mengerti
          </button>
          <p className="text-[10px] text-center text-slate-400 font-medium italic">
            Error: 429 Too Many Requests (Gemini Safety Limit)
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
