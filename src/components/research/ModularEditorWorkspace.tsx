"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import { useResearchStore } from "@/store/useResearchStore";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Download01Icon, 
  ArrowLeft01Icon,
  Book01Icon,
  SidebarLeftIcon,
  DashboardSquare01Icon,
} from "@hugeicons/core-free-icons";
import { SidebarSkeleton, EditorSkeleton } from "../shared/Skeletons";

// Lazy-loaded components
const SidebarOutline = lazy(() => import("./editor/SidebarOutline"));
const EditorCanvas = lazy(() => import("./editor/EditorCanvas"));
const BibliographyDrawer = lazy(() => import("./editor/BibliographyDrawer"));
import { exportToDocx } from "@/lib/export-utils";
import { MIN_WORDS_PER_SECTION } from "@/types/research";
import { getWordCount, cn } from "@/lib/utils";

export default function ModularEditorWorkspace() {
  const { 
    refinedTitle, 
    topic,
    keywords,
    objectives, 
    sections, 
    sessionId,
    activeSectionId,
    ensureIMRADStructure,
    syncBibliographyToSection,
    bibliography,
    updateSectionInStore,
    completeStep,
    updateResearchData,
  } = useResearchStore();

  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);

  useEffect(() => {
    ensureIMRADStructure();
  }, [ensureIMRADStructure]);

  useEffect(() => {
    syncBibliographyToSection();
  }, [bibliography, syncBibliographyToSection]);
  
  const [showBibliography, setShowBibliography] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Check if all sections are complete enough to proceed to Step 7
  const allSectionsComplete = sections
    .filter(s => s.title.toLowerCase() !== "abstrak" && s.title.toLowerCase() !== "daftar pustaka")
    .every(s => getWordCount(s.content || "") >= MIN_WORDS_PER_SECTION);

  const handleCompleteStep6 = async () => {
    await completeStep(6);
    updateResearchData({ currentStep: 7 });
  };

  // ─── Stitching Export: Fetch all sections fresh from DB ─────────
  const handleFullExport = async () => {
    if (!refinedTitle || !sessionId) return;
    setIsExporting(true);
    
    try {
      const { data: freshSections, error: fetchErr } = await supabase
        .from("research_sections")
        .select("*")
        .eq("session_id", sessionId)
        .order("order_index", { ascending: true });

      if (fetchErr) throw fetchErr;
      const allSections = freshSections || sections;

      await exportToDocx(
        { 
          refined_title: refinedTitle, 
          initial_topic: topic,
          keywords, 
          research_objectives: objectives, 
          bibliography 
        }, 
        allSections
      );
      
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  // Get active section name for breadcrumb
  const activeSec = sections.find(s => s.id === activeSectionId);

  // Section framework labels
  const getSectionFramework = (title: string): string | null => {
    const lower = title.toLowerCase();
    if (lower === "pendahuluan") return "CARS Model";
    if (lower === "metode penelitian") return "Justification Framework";
    if (lower === "hasil dan pembahasan") return "Data-Driven Narration";
    return null;
  };

  const activeFramework = activeSec ? getSectionFramework(activeSec.title) : null;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white dark:bg-obsidian-0 transition-colors duration-200">
      {/* Consolidated Slim Header */}
      <header className="bg-white dark:bg-obsidian-1 border-b border-slate-100 dark:border-obsidian-2 flex justify-between items-center px-4 lg:px-6 h-12 z-30 shrink-0 no-print">
        {/* Left: Breadcrumb & Toggles */}
        <div className="flex items-center gap-3 min-w-0 text-[11px] tracking-tight">
          <button
             onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
             className={cn(
               "p-1.5 rounded-md transition-all",
               leftSidebarOpen ? "text-accent-lime bg-accent-lime/10" : "text-slate-400 hover:bg-slate-50 dark:hover:bg-obsidian-2"
             )}
             title="Toggle Navigator"
          >
            <HugeiconsIcon icon={SidebarLeftIcon} size={16} />
          </button>

          <Link
            href="/my-research"
            className="text-slate-400 dark:text-slate-500 hover:text-slate-950 dark:hover:text-accent-lime transition-colors font-medium shrink-0 flex items-center gap-1 bg-slate-50 dark:bg-obsidian-2 px-2.5 py-1 rounded-md"
            title="Selesai & Kembali ke Profil"
          >
            <HugeiconsIcon icon={DashboardSquare01Icon} size={12} />
            <span className="hidden md:inline">Dashboard</span>
          </Link>

          <button
            onClick={() => updateResearchData({ currentStep: 3 })}
            className="text-slate-400 dark:text-slate-500 hover:text-slate-950 dark:hover:text-accent-lime transition-colors font-medium shrink-0 flex items-center gap-1"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={12} />
            Back to Wizard
          </button>
          <HugeiconsIcon icon={ArrowLeft01Icon} size={10} className="text-slate-200 dark:text-obsidian-2 rotate-180 shrink-0" />
          <span className="text-slate-400 dark:text-slate-500 font-medium truncate max-w-[150px] lg:max-w-[300px]" title={refinedTitle || ""}>
            {refinedTitle || "Untitled Project"}
          </span>
          {activeSec && (
            <>
              <HugeiconsIcon icon={ArrowLeft01Icon} size={10} className="text-slate-200 dark:text-obsidian-2 rotate-180 shrink-0" />
              <span className="text-slate-950 dark:text-slate-100 font-black shrink-0 text-[10px]">
                {activeSec.title}
              </span>
              {activeFramework && (
                <span className="text-[8px] font-bold text-accent-lime/60 bg-accent-lime/10 px-2 py-0.5 rounded-full ml-1">
                  {activeFramework}
                </span>
              )}
            </>
          )}
        </div>

        {/* Right: Actions (compact) */}
        <div className="flex items-center gap-1">

          <button
            onClick={() => setShowBibliography(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-obsidian-2 hover:text-slate-900 dark:hover:text-slate-100 transition-all"
          >
            <HugeiconsIcon icon={Book01Icon} size={13} />
            <span className="hidden md:inline">Pustaka</span>
          </button>
          <button
            onClick={handleFullExport}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-slate-900 dark:bg-accent-lime text-white dark:text-obsidian-0 hover:bg-black dark:hover:bg-white transition-all shadow-sm disabled:opacity-50"
          >
            <HugeiconsIcon icon={Download01Icon} size={13} />
            <span className="hidden md:inline">{isExporting ? "..." : "Export"}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Left Navigator (Outline) */}
        <div className={cn(
          "transition-all duration-500 ease-in-out flex flex-col shrink-0 no-print overflow-hidden",
          leftSidebarOpen ? "w-64 opacity-100" : "w-0 opacity-0 invisible"
        )}>
          <Suspense fallback={<SidebarSkeleton />}>
            <SidebarOutline />
          </Suspense>
        </div>
        
        {/* Center Canvas (Editing) — Keyed by activeSectionId for clean remount */}
        <section className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <Suspense fallback={<EditorSkeleton />}>
            <EditorCanvas key={activeSectionId} />
          </Suspense>
        </section>
      </main>


      {/* Bibliography Drawer */}
      <Suspense fallback={null}>
        <BibliographyDrawer 
          isOpen={showBibliography} 
          onClose={() => setShowBibliography(false)} 
        />
      </Suspense>

    </div>
  );
}
