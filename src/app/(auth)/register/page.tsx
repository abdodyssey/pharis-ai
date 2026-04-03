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
        router.push("/dashboard");
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
      setGlobalError(error.message);
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
    <main className="max-w-md mx-auto mt-20 p-8 bg-white rounded-3xl shadow-xl border border-slate-100 animate-fade-in-up">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Daftar PharisAI</h1>
        <p className="text-slate-500 mt-2">Mulai kelola riset akademikmu dengan AI</p>
      </div>

      {globalError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
          {globalError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block text-slate-700">Email</label>
          <input
            {...register("email")}
            type="email"
            placeholder="nama@email.com"
            className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-brand-primary outline-none transition-all ${
              errors.email ? "border-red-400" : "border-slate-200"
            }`}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500 font-medium">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block text-slate-700">Password</label>
          <input
            {...register("password")}
            type="password"
            placeholder="••••••••"
            className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-brand-primary outline-none transition-all ${
              errors.password ? "border-red-400" : "border-slate-200"
            }`}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-red-500 font-medium">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block text-slate-700">Konfirmasi Password</label>
          <input
            {...register("confirmPassword")}
            type="password"
            placeholder="••••••••"
            className={`w-full p-3 border rounded-xl focus:ring-2 focus:ring-brand-primary outline-none transition-all ${
              errors.confirmPassword ? "border-red-400" : "border-slate-200"
            }`}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-red-500 font-medium">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white p-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-lg shadow-brand-primary/20"
        >
          {loading ? "Mendaftarkan..." : "Buat Akun Sekarang"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-500">
        Sudah punya akun?{" "}
        <Link href="/login" className="text-brand-primary font-bold hover:underline">
          Masuk di sini
        </Link>
      </p>
    </main>
  );
}
