"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  AccessIcon, 
  ViewIcon, 
  ViewOffSlashIcon, 
  Loading01Icon,
  Tick01Icon,
  Cancel01Icon
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ChangePasswordModal({
  isOpen,
  onOpenChange,
}: ChangePasswordModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Password baru tidak cocok");
      return;
    }

    setIsLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        // Reset state after closing
        setTimeout(() => {
           setSuccess(false);
           setNewPassword("");
           setConfirmPassword("");
        }, 500);
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-obsidian-1 border border-slate-200 dark:border-white/5 shadow-2xl p-0 overflow-hidden rounded-2xl">
        <div className="p-8">
          <DialogHeader className="flex flex-col items-center text-center space-y-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-accent-lime/10 flex items-center justify-center text-accent-lime shadow-lg shadow-accent-lime/10">
              <HugeiconsIcon icon={AccessIcon} size={24} />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Ganti Password</DialogTitle>
              <DialogDescription className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                Masukkan password baru Anda di bawah ini untuk memperbarui akses akun.
              </DialogDescription>
            </div>
          </DialogHeader>

          {success ? (
            <div className="py-10 flex flex-col items-center text-center space-y-4 animate-in zoom-in duration-300">
               <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                  <HugeiconsIcon icon={Tick01Icon} size={32} />
               </div>
               <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Password Diperbarui!</p>
                  <p className="text-[11px] text-slate-500 font-medium">Sistem telah menyimpan perubahan Anda dengan aman.</p>
               </div>
            </div>
          ) : (
            <form onSubmit={handleUpdatePassword} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 ml-1">Password Baru</label>
                <div className="relative group">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 dark:bg-obsidian-2 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-accent-lime/10 focus:border-accent-lime/30 focus:bg-white dark:focus:bg-obsidian-1 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 hover:text-accent-lime transition-colors"
                  >
                    <HugeiconsIcon icon={showPassword ? ViewOffSlashIcon : ViewIcon} size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 ml-1">Konfirmasi Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-obsidian-2 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3 text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-accent-lime/10 focus:border-accent-lime/30 focus:bg-white dark:focus:bg-obsidian-1 transition-all"
                />
              </div>

              {error && (
                <p className="text-[10px] font-bold text-red-500 flex items-center gap-1.5 animate-in slide-in-from-top-1">
                  <HugeiconsIcon icon={Cancel01Icon} size={12} />
                  {error}
                </p>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 h-12 rounded-xl border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-400 font-bold text-xs hover:bg-slate-50 dark:hover:bg-white/5"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 h-12 rounded-xl bg-slate-950 dark:bg-accent-lime text-white dark:text-slate-950 font-bold text-xs hover:bg-slate-800 dark:hover:bg-white active:scale-95 transition-all shadow-lg shadow-accent-lime/20"
                >
                  {isLoading ? (
                    <HugeiconsIcon icon={Loading01Icon} className="w-4 h-4 animate-spin" />
                  ) : (
                    "Simpan Password"
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
