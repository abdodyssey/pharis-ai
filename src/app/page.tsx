"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";

export default function HomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      } else {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, [router]);

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const startNewResearch = async () => {
    setLoading(true);
    // 1. Buat record kosong di Supabase untuk mendapatkan UUID
    const { data, error } = await supabase
      .from("research_sessions")
      .insert([{ initial_topic: "" }])
      .select()
      .single();

    if (error) {
      alert("Gagal membuat sesi: " + error.message);
      setLoading(false);
      return;
    }

    // 2. Redirect ke halaman research dengan ID tersebut
    router.push(`/research/${data.id}`);
  };

  return (
    <main className="flex flex-col items-center justify-center pt-20 px-4 text-center">
      <h1 className="text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
        PharisAI
      </h1>
      <p className="text-gray-600 max-w-lg mb-8 text-lg">
        Ubah ide mentah menjadi struktur riset akademik yang solid dalam 5
        langkah mudah.
      </p>
      <button
        onClick={startNewResearch}
        disabled={loading}
        className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-xl shadow-xl hover:bg-blue-700 transition-all disabled:opacity-50"
      >
        {loading ? "Menyiapkan Workspace..." : "Mulai Riset Sekarang"}
      </button>
    </main>
  );
}
