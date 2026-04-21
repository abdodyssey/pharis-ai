"use client";

import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  MoreHorizontalIcon, 
  File01Icon, 
  Calendar03Icon, 
  Layers01Icon, 
  Link01Icon, 
  ArrowUpRight01Icon, 
  Loading01Icon 
} from "@hugeicons/core-free-icons";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

type Manuscript = {
  id: string;
  title: string;
  section: string;
  lastEdited: string;
  progress: number;
};

export default function ManuscriptTable() {
  const [manuscripts, setManuscripts] = useState<Manuscript[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchManuscripts() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("research_sessions")
        .select("id, refined_title, initial_topic, current_step, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(5);

      if (!error && data) {
        const mapped = data.map((item: any) => {
          const stepLabels = ["Topic Selection", "Literature", "Drafting", "Active Writing", "Active Writing", "Synthesis", "Export"];
          const currentStepLevel = Math.min(Math.max(item.current_step, 1), 7);
          const sectionLabel = `Tahap ${currentStepLevel} - ${stepLabels[currentStepLevel - 1] || "Process"}`;
          const progressPercent = Math.round((currentStepLevel / 7) * 100);
          
          let dateStr = "Baru saja";
          try {
            dateStr = formatDistanceToNow(new Date(item.updated_at), { addSuffix: true, locale: id });
          } catch (e) {}

          return {
            id: item.id,
            title: item.refined_title || item.initial_topic || "Untitled Research",
            section: sectionLabel,
            lastEdited: dateStr,
            progress: progressPercent,
          };
        });
        setManuscripts(mapped);
      }
      setIsLoading(false);
    }
    fetchManuscripts();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-obsidian-1 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden p-8 flex items-center justify-center min-h-[250px]">
        <HugeiconsIcon icon={Loading01Icon} className="w-5 h-5 animate-spin text-slate-300 dark:text-slate-600" />
      </div>
    );
  }

  if (manuscripts.length === 0) {
    return (
      <div className="bg-white dark:bg-obsidian-1 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden p-8 text-center min-h-[250px] flex flex-col justify-center items-center">
        <HugeiconsIcon icon={File01Icon} className="w-8 h-8 text-slate-200 dark:text-slate-700 mb-3" />
        <h3 className="text-[13px] font-bold text-slate-700 dark:text-slate-300 tracking-tight">Belum Ada Riset Aktif</h3>
        <p className="text-[11px] font-medium text-slate-400 mt-1">Mulai jendela riset baru untuk melihat daftar manuskrip Anda di sini.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-obsidian-1 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-obsidian-2/30 border-b border-slate-100 dark:border-white/5">
              <th className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500">Manuscript Title</th>
              <th className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500">Current Phase</th>
              <th className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500">Progress</th>
              <th className="px-6 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500">Last Activity</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/5">
            {manuscripts.map((item, idx) => (
              <motion.tr 
                key={item.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => router.push(`/research/${item.id}`)}
                className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all duration-150 cursor-pointer"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-obsidian-2 flex items-center justify-center text-slate-400 group-hover:text-accent-lime transition-colors border border-transparent group-hover:border-slate-200 dark:group-hover:border-white/10 shrink-0">
                      <HugeiconsIcon icon={File01Icon} className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-700 dark:text-white line-clamp-1 max-w-[200px] sm:max-w-xs xl:max-w-md group-hover:text-black dark:group-hover:text-accent-lime transition-colors leading-relaxed">
                      {item.title}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <HugeiconsIcon icon={Layers01Icon} className="w-3 h-3" />
                    <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">{item.section}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="w-24 sm:w-32 space-y-1.5">
                    <div className="flex items-center justify-between">
                       <span className="text-[10px] font-bold text-slate-900 dark:text-white">{item.progress}%</span>
                    </div>
                    <div className="h-1 w-full bg-slate-100 dark:bg-obsidian-2 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${item.progress}%` }}
                        transition={{ duration: 1, ease: "circOut", delay: idx * 0.1 }}
                        className="h-full bg-slate-900 dark:bg-accent-lime rounded-full"
                      />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-400 dark:text-slate-500 text-[11px] font-medium italic whitespace-nowrap">
                  {item.lastEdited}
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-1.5 text-slate-300 dark:text-slate-700 hover:text-slate-950 dark:hover:text-white transition-all opacity-0 group-hover:opacity-100">
                    <HugeiconsIcon icon={ArrowUpRight01Icon} className="w-4 h-4" />
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
