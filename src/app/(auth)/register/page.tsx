"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterFormValues } from "@/lib/validations/auth";
import { useToastStore } from "@/store/useToastStore";
import Link from "next/link";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const router = useRouter();
  const { addToast } = useToastStore();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push("/");
      }
    };
    checkUser();
  }, [router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setLoading(true);
    setGlobalError(null);

    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      let errMsg = "Terjadi kesalahan saat pendaftaran.";
      if (error.message.includes("User already registered") || error.message.includes("already exists")) {
        errMsg = "Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.";
      } else {
        errMsg = error.message;
      }
      setGlobalError(errMsg);
    } else {
      addToast({
        type: "success",
        message: "Registrasi Berhasil",
        description: "Cek email kamu untuk konfirmasi pendaftaran!"
      });
      router.push("/login");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-obsidian-0">
      <main className="w-full max-w-sm mx-4 p-8 bg-white dark:bg-obsidian-1 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-white/5 relative z-10 animate-fade-in-up transition-shadow">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-12 h-12 bg-slate-900 dark:bg-white rounded-xl flex items-center justify-center mb-5 shadow-sm">
          <div className="w-6 h-1.5 bg-accent-lime dark:bg-slate-900 rounded-full rotate-45 translate-y-[-3px]" />
          <div className="w-6 h-1.5 bg-accent-lime dark:bg-slate-900 rounded-full -rotate-45 translate-y-[3px] absolute" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Daftar PharisAI</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">Buat akun agar Anda dapat memiliki akses riset AI.</p>
      </div>

      {globalError && (
        <div className="mb-6 p-4 bg-red-500/10 dark:bg-red-500/5 border border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl text-sm font-medium text-center">
          {globalError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
          <input
            {...register("email")}
            type="email"
            placeholder="nama@institusi.edu"
            className={`w-full p-3 bg-white dark:bg-obsidian-2 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 border outline-none transition-colors ${
              errors.email ? "border-red-400 focus:border-red-500" : "border-slate-200 dark:border-white/10 focus:border-slate-400 dark:focus:border-white/20"
            }`}
          />
          {errors.email && (
            <p className="text-[11px] text-red-500 font-medium">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Kata sandi</label>
          <input
            {...register("password")}
            type="password"
            placeholder="••••••••"
            className={`w-full p-3 bg-white dark:bg-obsidian-2 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 border outline-none transition-colors ${
              errors.password ? "border-red-400 focus:border-red-500" : "border-slate-200 dark:border-white/10 focus:border-slate-400 dark:focus:border-white/20"
            }`}
          />
          {errors.password && (
            <p className="text-[11px] text-red-500 font-medium">{errors.password.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Konfirmasi Kata sandi</label>
          <input
            {...register("confirmPassword")}
            type="password"
            placeholder="••••••••"
            className={`w-full p-3 bg-white dark:bg-obsidian-2 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 border outline-none transition-colors ${
              errors.confirmPassword ? "border-red-400 focus:border-red-500" : "border-slate-200 dark:border-white/10 focus:border-slate-400 dark:focus:border-white/20"
            }`}
          />
          {errors.confirmPassword && (
            <p className="text-[11px] text-red-500 font-medium">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-6 bg-slate-900 dark:bg-accent-lime text-white dark:text-slate-950 p-3 rounded-xl font-medium text-sm transition-opacity hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Menyiapkan Akses..." : "Daftar"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Sudah memiliki akun?{" "}
        <Link href="/login" className="text-slate-900 dark:text-accent-lime font-bold hover:underline">
          Masuk
        </Link>
      </p>
      </main>
    </div>
  );
}
