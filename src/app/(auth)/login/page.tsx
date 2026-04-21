"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginFormValues } from "@/lib/validations/auth";
import Link from "next/link";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log("[Login] User already logged in, redirecting to /");
        router.push("/");
      }
    };
    checkUser();
  }, [router, supabase]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    console.log("[Login] Starting login process for:", values.email);
    setLoading(true);
    setGlobalError(null);
    
    try {
      console.log("[Login] Calling signInWithPassword...");
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        console.error("[Login] Supabase error:", error.message);
        let errMsg = "Terjadi kesalahan saat masuk.";
        if (error.message.includes("Invalid login credentials")) {
          errMsg = "Email atau password yang Anda masukkan keliru.";
        } else if (error.message.includes("Email not confirmed")) {
          errMsg = "Silakan verifikasi email Anda terlebih dahulu melalui tautan yang dikirimkan.";
        } else {
          errMsg = error.message;
        }
        setGlobalError(errMsg);
        return;
      }

      if (data?.session) {
        console.log("[Login] Session established successfully. Delegating navigation to AuthListener.");
        // Navigation and refresh are deliberately omitted here to prevent Race Conditions.
        // The global AuthListener will catch the 'SIGNED_IN' event and push to '/' securely.
      } else {
        console.warn("[Login] No session data returned from Supabase");
        setGlobalError("Gagal mendapatkan session. Silakan coba lagi.");
      }
    } catch (err) {
      console.error("[Login] Unexpected error during login:", err);
      setGlobalError("Terjadi kesalahan yang tidak terduga.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-obsidian-0">
      <main className="w-full max-w-sm mx-4 p-8 bg-white dark:bg-obsidian-1 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-slate-100 dark:border-white/5 relative z-10 transition-shadow">
      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-12 h-12 bg-slate-900 dark:bg-white rounded-xl flex items-center justify-center mb-5 shadow-sm">
          <div className="w-6 h-1.5 bg-accent-lime dark:bg-slate-900 rounded-full rotate-45 translate-y-[-3px]" />
          <div className="w-6 h-1.5 bg-accent-lime dark:bg-slate-900 rounded-full -rotate-45 translate-y-[3px] absolute" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Masuk ke PharisAI</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">Gunakan akses Anda untuk melanjutkan.</p>
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

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-6 bg-slate-900 dark:bg-accent-lime text-white dark:text-slate-950 p-3 rounded-xl font-medium text-sm transition-opacity hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Memverifikasi..." : "Masuk"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Belum punya akun?{" "}
        <Link href="/register" className="text-slate-900 dark:text-accent-lime font-bold hover:underline">
          Daftar 
        </Link>
      </p>
      </main>
    </div>
  );
}
