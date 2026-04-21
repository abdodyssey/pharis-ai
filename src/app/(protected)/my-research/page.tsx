"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ResearchSession } from "@/types/research";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Delete02Icon, 
  Search01Icon, 
  ArrowLeft01Icon, 
  Link01Icon,
  Calendar03Icon,
  Layers01Icon,
  Database01Icon,
  PlusSignIcon,
  Loading01Icon
} from "@hugeicons/core-free-icons";
import { motion } from "framer-motion";
import { useToastStore } from "@/store/useToastStore";
import DeleteConfirmationDialog from "@/components/shared/DeleteConfirmationDialog";
import EduUpgradeModal from "@/components/shared/EduUpgradeModal";

export default function MyResearchPage() {
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [targetId, setTargetId] = useState<string | null>(null);
  const { addToast } = useToastStore();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [userPlan, setUserPlan] = useState("free");

  const planLimit = userPlan === "pro" ? 10 : userPlan === "inst" ? 1000 : 2;

  const handleCreateNew = async () => {
    if (isCreating) return;
    
    // Limit Check
    if (sessions.length >= planLimit) {
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

      // Create an empty session
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

  useEffect(() => {
    const fetchAllSessions = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Fetch plan with DB fallback for consistency
        const { data: subData } = await supabase
          .from("user_subscriptions")
          .select("plan_type")
          .eq("user_id", user.id)
          .maybeSingle();

        const finalPlan = user.user_metadata?.plan_type || subData?.plan_type || "free";
        setUserPlan(finalPlan);

        const { data } = await supabase
          .from("research_sessions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        
        setSessions(data || []);
      }
      setLoading(false);
    };

    fetchAllSessions();
  }, [supabase]);

  const openDeleteDialog = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTargetId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!targetId) return;

    setDeletingId(targetId);
    try {
      const { error } = await supabase
        .from("research_sessions")
        .delete()
        .eq("id", targetId);

      if (error) {
        addToast({ 
          type: "error", 
          message: "Gagal Menghapus", 
          description: error.message 
        });
      } else {
        setSessions(prev => prev.filter(s => s.id !== targetId));
        addToast({ 
          type: "success", 
          message: "Data Berhasil Dihapus", 
          description: "Riset telah dihapus secara permanen dari database." 
        });
      }
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Kesalahan Sistem";
      addToast({ 
        type: "error", 
        message: "Kesalahan Sistem", 
        description: errorMessage || "Gagal menghapus riset." 
      });
    } finally {
      setDeletingId(null);
      setIsDeleteDialogOpen(false);
      setTargetId(null);
    }
  };

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => {
      const title = (s.refined_title || s.initial_topic || "Tanpa Judul").toLowerCase();
      return title.includes(searchTerm.toLowerCase());
    });
  }, [sessions, searchTerm]);

  return (
    <main className="max-w-6xl mx-auto p-6 md:p-8 space-y-10 min-h-screen bg-transparent">
      {/* Header & Global Actions */}
      <div className="space-y-4">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-500 hover:text-accent-lime transition-all group"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          Back to Overview
        </Link>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">
              My Research <span className="text-accent-lime font-normal italic">Vault</span>
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                Manage and continue your academic manuscripts.
              </p>
              <div className="h-1 w-1 rounded-full bg-slate-100 dark:bg-white/10" />
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400">Usage:</span>
                <span className={cn(
                  "text-[10px] font-black px-2 py-0.5 rounded-md",
                  sessions.length >= planLimit 
                    ? "bg-rose-500/10 text-rose-500" 
                    : "bg-accent-lime/10 text-accent-lime"
                )}>
                  {sessions.length} / {planLimit} ARTIKEL
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Bar */}
            <div className="relative w-full sm:w-64 group">
              <HugeiconsIcon icon={Search01Icon} className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-accent-lime transition-colors" />
              <input 
                type="text"
                placeholder="Search research..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-obsidian-2 border border-slate-200 dark:border-white/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent-lime/10 focus:border-accent-lime/30 transition-all font-medium text-slate-700 dark:text-white text-xs"
              />
            </div>

            <button 
              onClick={handleCreateNew}
              disabled={isCreating}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-950 dark:bg-accent-lime text-white dark:text-slate-950 rounded-xl font-bold text-[11px] hover:bg-slate-800 dark:hover:bg-white transition-all active:scale-95 disabled:opacity-50 h-10 shadow-sm"
            >
              {isCreating ? (
                <HugeiconsIcon icon={Loading01Icon} className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <HugeiconsIcon icon={PlusSignIcon} className="w-3.5 h-3.5" />
              )}
              {isCreating ? "Loading..." : "New Research"}
            </button>
          </div>
        </div>
      </div>

      <div className="h-px w-full bg-slate-100 dark:bg-white/5" />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-obsidian-1/30 border border-slate-100 dark:border-white/5 rounded-2xl text-center px-6">
          <div className="w-16 h-16 bg-slate-50 dark:bg-obsidian-2 rounded-2xl flex items-center justify-center mb-6 text-slate-300 dark:text-slate-700 border border-slate-100 dark:border-white/5">
            <HugeiconsIcon icon={Database01Icon} className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            No research found
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xs font-medium text-xs leading-relaxed">
            {searchTerm 
              ? `No manuscript found matching "${searchTerm}"`
              : "Your vault is ready. Start your academic journey today."}
          </p>
          <button
            onClick={handleCreateNew}
            className="mt-8 px-8 py-3 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-xl font-bold text-xs hover:bg-slate-800 transition-all"
          >
            Create Research
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSessions.map((session, idx) => (
            <motion.div 
              key={session.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="group relative flex flex-col p-6 bg-white dark:bg-obsidian-1 border border-slate-200/60 dark:border-white/5 rounded-2xl transition-all hover:border-accent-lime/30 dark:hover:border-accent-lime/30 shadow-sm"
            >
              <div className="relative z-10 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-accent-lime/10 flex items-center justify-center text-slate-400 dark:text-accent-lime border border-slate-100 dark:border-accent-lime/20">
                      <HugeiconsIcon icon={Layers01Icon} className="w-3 h-3" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      Step {session.current_step}/9
                    </span>
                  </div>
                  
                  <button
                    onClick={(e) => openDeleteDialog(session.id, e)}
                    disabled={deletingId === session.id}
                    className="w-7 h-7 flex items-center justify-center text-slate-300 dark:text-slate-700 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    {deletingId === session.id ? (
                      <HugeiconsIcon icon={Loading01Icon} className="w-3 h-3 animate-spin" />
                    ) : (
                      <HugeiconsIcon icon={Delete02Icon} className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="space-y-2 mb-6">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-accent-lime transition-colors min-h-[2.5rem]">
                    {session.refined_title || session.initial_topic || "Untitled Research"}
                  </h3>
                  
                  <div className="flex items-center flex-wrap gap-x-3 gap-y-1">
                    <div className="flex items-center gap-1.5 text-[9px] font-medium text-slate-400">
                      <HugeiconsIcon icon={Calendar03Icon} className="w-3 h-3 opacity-50" />
                      {new Date(session.created_at).toLocaleDateString("en-US", {
                         day: "numeric",
                         month: "short",
                         year: "numeric"
                      })}
                    </div>
                    <div className="text-[9px] font-mono text-slate-500 dark:text-slate-600">
                      ID: {session.id.slice(0, 8)}
                    </div>
                  </div>
                </div>

                <div className="mt-auto space-y-4">
                   {/* Progress Visual */}
                   <div className="w-full h-1 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-accent-lime transition-all duration-1000"
                        style={{ width: `${(session.current_step / 9) * 100}%` }}
                      />
                   </div>

                   <Link
                    href={`/research/${session.id}`}
                    className="flex items-center justify-between w-full p-3.5 bg-slate-950 dark:bg-white/5 group-hover:bg-accent-lime text-white dark:text-slate-400 group-hover:text-slate-950 rounded-xl font-bold text-[10px] transition-all"
                  >
                    <span className="ml-1 tracking-tight">Continue Research</span>
                    <HugeiconsIcon icon={Link01Icon} className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      <EduUpgradeModal 
        isOpen={isUpgradeModalOpen}
        onOpenChange={setIsUpgradeModalOpen}
      />
      <DeleteConfirmationDialog 
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        isLoading={deletingId !== null}
      />
    </main>
  );
}
