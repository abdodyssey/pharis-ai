"use client";

import { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  PlusSignIcon, 
  CheckmarkCircle02Icon, 
  FlashIcon, 
  ArrowUpRight01Icon, 
  CreditCardIcon, 
  Loading01Icon, 
  File01Icon, 
  Layers01Icon 
} from "@hugeicons/core-free-icons";
import { motion } from "framer-motion";
import ManuscriptTable from "./ManuscriptTable";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import EduUpgradeModal from "@/components/shared/EduUpgradeModal";

export default function DashboardMain() {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [stats, setStats] = useState({
    projectsCount: 0,
    completedCount: 0,
    planType: "...",
  });
  const router = useRouter();

  useEffect(() => {
    async function loadStats() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count } = await supabase
        .from("research_sessions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      const { count: completedCount } = await supabase
        .from("research_sessions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("current_step", 7);

      const { data: subData } = await supabase
        .from("user_subscriptions")
        .select("plan_type")
        .eq("user_id", user.id)
        .maybeSingle();

      const finalPlan = user.user_metadata?.plan_type || subData?.plan_type || "free";

      setStats({
        projectsCount: count || 0,
        completedCount: completedCount || 0,
        planType: finalPlan === "pro" ? "Education" : finalPlan === "inst" ? "Institutional" : "Standard",
      });
    }
    loadStats();
  }, []);

  const handleCreateNew = async () => {
    if (isCreating) return;

    // Limit Check: Standard=2, Education=10, Institutional=Unlimited (1000)
    const planLimit = stats.planType === "Education" ? 10 : stats.planType === "Institutional" ? 1000 : 2;
    if (stats.projectsCount >= planLimit) {
      setIsUpgradeModalOpen(true);
      return;
    }

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
          current_step: 1,
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

  return (
    <div className="flex-1 w-full animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Compact Header */}
        <header className="flex items-center justify-between gap-4 pt-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Dashboard Overview
            </h1>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Monitoring <span className="text-slate-900 dark:text-accent-lime font-bold">{stats.projectsCount} active projects</span> and academic performance.
            </p>
          </div>
          
          <button 
            onClick={handleCreateNew}
            disabled={isCreating}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-950 dark:bg-accent-lime text-white dark:text-slate-950 rounded-xl font-bold text-xs hover:bg-slate-800 dark:hover:bg-white transition-all shadow-lg shadow-slate-900/10 dark:shadow-accent-lime/10"
          >
            {isCreating ? <HugeiconsIcon icon={Loading01Icon} className="w-4 h-4 animate-spin" /> : <HugeiconsIcon icon={PlusSignIcon} className="w-4 h-4" />}
            <span>Start New Research</span>
          </button>
        </header>

        {/* Dense Analytics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
          <StatCard 
            label="Total Artikel Acuan" 
            value={`${stats.projectsCount} Artikel`} 
            subValue={`${stats.completedCount} Selesai Ditulis`}
            icon={<HugeiconsIcon icon={File01Icon} className="w-4 h-4" />}
          />
          <StatCard 
            label="Current Plan" 
            value={stats.planType} 
            subValue="PharisAI Subscription"
            icon={<HugeiconsIcon icon={CreditCardIcon} className="w-4 h-4" />}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
             <h2 className="text-sm font-bold text-slate-900 dark:text-white">Active Manuscripts</h2>
             <button className="text-[10px] font-bold text-slate-400 hover:text-accent-lime transition-colors flex items-center gap-1">
               View All Research <HugeiconsIcon icon={ArrowUpRight01Icon} size={10} />
             </button>
          </div>
          <ManuscriptTable />
        </div>
      </div>
      <EduUpgradeModal 
        isOpen={isUpgradeModalOpen}
        onOpenChange={setIsUpgradeModalOpen}
      />
    </div>
  );
}

function StatCard({ label, value, subValue, icon }: { label: string, value: string, subValue: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-obsidian-1 p-5 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm space-y-4 transition-all hover:border-slate-300 dark:hover:border-white/10 group">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{label}</span>
        <div className="text-slate-300 dark:text-slate-700 group-hover:text-accent-lime transition-colors">
          {icon}
        </div>
      </div>
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{value}</h2>
        <p className="text-[10px] text-slate-500 dark:text-slate-500 font-medium mt-1">{subValue}</p>
      </div>
    </div>
  );
}
