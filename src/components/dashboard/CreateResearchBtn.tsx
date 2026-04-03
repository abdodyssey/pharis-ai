"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import NewResearchModal from "./NewResearchModal";

export default function CreateResearchBtn() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use a fallback while mounting to ensure stable layout
  const content = (
    <button className="group relative flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-[1.25rem] font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200 cursor-pointer">
      <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
      <span>Mulai Riset Baru</span>
    </button>
  );

  if (!mounted) return content;

  return (
    <NewResearchModal trigger={content} />
  );
}
