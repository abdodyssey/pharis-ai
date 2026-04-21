"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusSignIcon, Loading01Icon } from "@hugeicons/core-free-icons";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function CreateResearchBtn() {
  const [mounted, setMounted] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCreateNew = async () => {
    if (isCreating) return;
    setIsCreating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/login";
        return;
      }

      // Create an empty session to start the journey
      const { data: session, error } = await supabase
        .from("research_sessions")
        .insert({
          user_id: user.id,
          current_step: 1, // Start at Step 1
          initial_topic: "",
          refined_title: null,
          keywords: [],
          research_objectives: [],
          academic_structure: {},
          bibliography: [],
        })
        .select("id")
        .single();

      if (error) throw error;

      router.push(`/research/${session.id}`);
    } catch (err) {
      console.error("Failed to create research session:", err);
      setIsCreating(false);
    }
  };

  if (!mounted) {
    return (
      <button className="group relative flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-[1.25rem] font-bold opacity-50 cursor-wait">
        <HugeiconsIcon icon={PlusSignIcon} size={20} />
        <span>Mulai Riset Baru</span>
      </button>
    );
  }

  return (
    <button 
      onClick={handleCreateNew}
      disabled={isCreating}
      className="group relative flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-[1.25rem] font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200 cursor-pointer disabled:opacity-70 disabled:cursor-wait"
    >
      {isCreating ? (
        <HugeiconsIcon icon={Loading01Icon} size={20} className="animate-spin text-accent-lime" />
      ) : (
        <HugeiconsIcon icon={PlusSignIcon} size={20} className="group-hover:rotate-90 transition-transform duration-300" />
      )}
      <span>{isCreating ? "Menyiapkan Sesi..." : "Mulai Riset Baru"}</span>
    </button>
  );
}
