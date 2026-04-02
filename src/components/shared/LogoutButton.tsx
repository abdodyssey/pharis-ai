// src/components/shared/LogoutButton.tsx
"use client";

import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useResearchStore } from "@/store/useResearchStore";

export default function LogoutButton() {
  const router = useRouter();
  const resetStore = useResearchStore((state) => state.resetStore);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Error logging out:", error.message);
    } else {
      // 1. Bersihkan data riset di frontend
      resetStore();
      // 2. Tendang ke halaman login
      router.push("/login");
      // 3. Refresh halaman untuk memastikan middleware bekerja bersih
      router.refresh();
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="text-sm font-medium text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl transition-all border border-red-100"
    >
      Keluar
    </button>
  );
}
