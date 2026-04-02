"use client";
import { useState } from "react";
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
        setGlobalError(error.message);
        return;
      }

      if (data?.session) {
        console.log("[Login] Session established successfully");
        console.log("[Login] Refreshing router to sync server-side state...");
        router.refresh();
        
        console.log("[Login] Redirecting to /dashboard...");
        router.push("/dashboard");
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
    <main className="max-w-md mx-auto mt-20 p-8 bg-white rounded-3xl shadow-xl border border-slate-100">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Masuk ke PharisAI</h1>
        <p className="text-slate-500 mt-2">Gunakan akun Anda untuk melanjutkan</p>
      </div>

      {globalError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
          {globalError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input
            {...register("email")}
            type="email"
            placeholder="Email"
            className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-brand-primary outline-none transition-all ${
              errors.email ? "border-red-400" : "border-slate-200"
            }`}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500 font-medium">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <input
            {...register("password")}
            type="password"
            placeholder="Password"
            className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-brand-primary outline-none transition-all ${
              errors.password ? "border-red-400" : "border-slate-200"
            }`}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-500 font-medium">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white p-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-lg shadow-brand-primary/20"
        >
          {loading ? "Memproses..." : "Masuk Sekarang"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-500">
        Belum punya akun?{" "}
        <Link href="/register" className="text-brand-primary font-bold hover:underline">
          Daftar Sekarang
        </Link>
      </p>
    </main>
  );
}
