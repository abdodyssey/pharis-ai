import { createClient } from "@/lib/supabase-server";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  File01Icon, 
  Clock01Icon, 
  CheckmarkCircle01Icon 
} from "@hugeicons/core-free-icons";

export default async function DashboardStatsLoader() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch Stats
  const { count: totalCount } = await supabase
    .from("research_sessions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { count: ongoingCount } = await supabase
    .from("research_sessions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .lt("current_step", 5);

  const { count: completedCount } = await supabase
    .from("research_sessions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("current_step", 5);

  const stats = [
    { label: "Total Riset", value: totalCount || 0, icon: File01Icon, color: "slateDark" },
    { label: "Progres Riset", value: ongoingCount || 0, icon: Clock01Icon, color: "slateLight" },
    { label: "Selesai", value: completedCount || 0, icon: CheckmarkCircle01Icon, color: "emerald" },
  ];

  const colorMap = {
    slateDark: "bg-slate-900 text-white border-slate-900",
    slateLight: "bg-slate-100 text-slate-900 border-slate-200",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
      {stats.map((stat, i) => (
        <div key={i} className="p-6 bg-white border border-slate-200/60 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl transition-colors ${colorMap[stat.color as keyof typeof colorMap]}`}>
              <HugeiconsIcon icon={stat.icon} size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-500 tracking-wide">
                {stat.label}
              </span>
              <span className="text-3xl font-black text-slate-900 tabular-nums">
                {stat.value}
              </span>
            </div>
          </div>
          <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity scale-150 rotate-12">
            <HugeiconsIcon icon={stat.icon} size={48} />
          </div>
        </div>
      ))}
    </div>
  );
}
