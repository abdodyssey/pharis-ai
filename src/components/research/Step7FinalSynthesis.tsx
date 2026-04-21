"use client";

import { useState, useEffect } from "react";
import { useResearchStore } from "@/store/useResearchStore";
import { useToastStore } from "@/store/useToastStore";
import { generateAbstract, generateConclusion } from "@/lib/ai-service";
import { cn, getWordCount } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { exportToDocx } from "@/lib/export-utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  SparklesIcon, 
  Tick01Icon, 
  AlertCircleIcon, 
  Loading01Icon, 
  BookOpen01Icon, 
  File01Icon, 
  SecurityIcon, 
  Download01Icon, 
  ViewIcon, 
  ArrowDown01Icon, 
  ArrowRight01Icon 
} from "@hugeicons/core-free-icons";

export default function Step7FinalSynthesis() {
  const {
    refinedTitle,
    topic,
    keywords,
    objectives,
    sections,
    bibliography,
    sessionId,
    updateSectionInStore,
    saveSectionToDb,
    completeStep,
    updateResearchData,
  } = useResearchStore();

  const { addToast } = useToastStore();
  const [isGeneratingAbstract, setIsGeneratingAbstract] = useState(false);
  const [isGeneratingConclusion, setIsGeneratingConclusion] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [apaCheckPassed, setApaCheckPassed] = useState<boolean | null>(null);
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string>("free");

  useEffect(() => {
    async function loadPlan() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("user_subscriptions")
          .select("plan_type")
          .eq("user_id", user.id)
          .maybeSingle();
        if (data?.plan_type) setUserPlan(data.plan_type);
      }
    }
    loadPlan();
  }, []);

  // Find sections
  const abstrakSection = sections.find(s => s.title.toLowerCase() === "abstrak");
  const conclusionSection = sections.find(s => s.title.toLowerCase() === "kesimpulan dan saran");
  
  const abstractWordCount = abstrakSection?.content ? getWordCount(abstrakSection.content) : 0;
  const conclusionWordCount = conclusionSection?.content ? getWordCount(conclusionSection.content) : 0;
  
  const hasAbstract = abstractWordCount >= 50;
  const hasConclusion = conclusionWordCount >= 50;

  // ─── APA 7th Sync Check ────────────────────────────────────────
  const runAPACheck = () => {
    const allContent = sections
      .filter(s => s.title.toLowerCase() !== "daftar pustaka" && s.title.toLowerCase() !== "abstrak")
      .map(s => s.content)
      .join(" ");

    // Check if at least 50% of bibliography authors appear in text
    let citedCount = 0;
    for (const ref of bibliography) {
      const lastName = ref.authors?.split(",")[0]?.split(" ").pop()?.trim() || "";
      if (lastName && allContent.toLowerCase().includes(lastName.toLowerCase())) {
        citedCount++;
      }
    }

    const citationRatio = bibliography.length > 0 ? citedCount / bibliography.length : 0;
    const passed = citationRatio >= 0.3; // At least 30% of references cited
    setApaCheckPassed(passed);

    if (passed) {
      addToast({
        type: "success",
        message: "APA 7th Check Passed",
        description: `${citedCount}/${bibliography.length} references found in manuscript text.`,
      });
    } else {
      addToast({
        type: "error",
        message: "APA 7th Check Warning",
        description: `Only ${citedCount}/${bibliography.length} references cited in text. Consider adding more in-text citations.`,
      });
    }
  };

  // ─── Generate Abstract ─────────────────────────────────────────
  const handleGenerateAbstract = async () => {
    setIsGeneratingAbstract(true);
    try {
      const result = await generateAbstract(refinedTitle, sections, bibliography);
      
      if (result.error) {
        addToast({ type: "error", message: "Generation Failed", description: result.error });
        return;
      }

      const content = result.data?.content || "";
      // Clean any markdown artifacts
      const cleaned = content
        .replace(/```html/g, "")
        .replace(/```/g, "")
        .trim();

      if (abstrakSection) {
        updateSectionInStore(abstrakSection.id, cleaned);
        await saveSectionToDb(abstrakSection.id, cleaned);
        addToast({ type: "success", message: "Abstract Generated", description: "150-300 word abstract created from your manuscript." });
      }
    } catch (err) {
      console.error(err);
      addToast({ type: "error", message: "Error", description: "Failed to generate abstract." });
    } finally {
      setIsGeneratingAbstract(false);
    }
  };

  // ─── Generate Conclusion ───────────────────────────────────────
  const handleGenerateConclusion = async () => {
    setIsGeneratingConclusion(true);
    try {
      const result = await generateConclusion(refinedTitle, sections, objectives);
      
      if (result.error) {
        addToast({ type: "error", message: "Generation Failed", description: result.error });
        return;
      }

      const content = result.data?.content || "";
      const cleaned = content.replace(/```html/g, "").replace(/```/g, "").trim();

      if (conclusionSection) {
        updateSectionInStore(conclusionSection.id, cleaned);
        await saveSectionToDb(conclusionSection.id, cleaned);
        addToast({ type: "success", message: "Conclusion Generated", description: "Kesimpulan dan Saran drafted from your manuscript." });
      }
    } catch (err) {
      console.error(err);
      addToast({ type: "error", message: "Error", description: "Failed to generate conclusion." });
    } finally {
      setIsGeneratingConclusion(false);
    }
  };

  // ─── Full DOCX Export ──────────────────────────────────────────
  const handleFullExport = async () => {
    if (!refinedTitle || !sessionId) return;
    setIsExporting(true);

    try {
      // Fetch fresh sections from DB
      const { data: freshSections, error: fetchErr } = await supabase
        .from("research_sections")
        .select("*")
        .eq("session_id", sessionId)
        .order("order_index", { ascending: true });

      if (fetchErr) throw fetchErr;
      const allSections = freshSections || sections;

      const filename = await exportToDocx(
        { 
          refined_title: refinedTitle, 
          initial_topic: topic,
          keywords,
          research_objectives: objectives,
          bibliography 
        } as any, 
        allSections
      );

      await completeStep(7);
      addToast({
        type: "success",
        message: "Export Complete",
        description: `${filename} downloaded successfully.`,
      });
    } catch (err) {
      console.error("Export failed:", err);
      addToast({ type: "error", message: "Export Failed", description: "Please try again." });
    } finally {
      setIsExporting(false);
    }
  };

  const canExport = hasAbstract && hasConclusion;

  return (
    <div className="max-w-3xl mx-auto px-6 py-16 space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-black text-accent-lime">
            Phase 07
          </span>
          <div className="h-px w-8 bg-obsidian-2" />
          <span className="text-[10px] font-black text-slate-500">
            Final
          </span>
        </div>
        <h2 className="text-3xl font-bold text-white tracking-tight">
          Final Synthesis
        </h2>
        <p className="text-slate-400 font-medium leading-relaxed max-w-2xl">
          Generate abstract dan kesimpulan, jalankan APA 7th audit, lalu export
          manuscript Anda.
        </p>
      </div>

      {/* ─── Abstract Generator ───────────────────────────────── */}
      <div className="bg-obsidian-1 border border-obsidian-2 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              hasAbstract ? "bg-accent-lime/15 text-accent-lime" : "bg-obsidian-2 text-slate-500"
            )}>
              <HugeiconsIcon icon={File01Icon} size={20} />
            </div>
            <div>
              <span className="text-sm font-bold text-white">Abstract</span>
              <span className="text-[10px] text-slate-500 ml-2">150-300 words</span>
            </div>
          </div>
          {hasAbstract ? (
            <div className="flex items-center gap-2 text-accent-lime">
              <HugeiconsIcon icon={Tick01Icon} size={14} />
              <span className="text-[10px] font-bold">{abstractWordCount}w</span>
            </div>
          ) : (
            <button
              onClick={handleGenerateAbstract}
              disabled={isGeneratingAbstract}
              className="flex items-center gap-2 px-4 py-2 bg-accent-lime text-obsidian-0 rounded-xl text-xs font-bold hover:bg-white transition-all disabled:opacity-50"
            >
              {isGeneratingAbstract ? (
                <HugeiconsIcon icon={Loading01Icon} size={14} className="animate-spin" />
              ) : (
                <HugeiconsIcon icon={SparklesIcon} size={14} />
              )}
              Generate Abstract
            </button>
          )}
        </div>

        {/* Preview Toggle */}
        {abstrakSection?.content && (
          <div>
            <button
              onClick={() => setShowPreview(showPreview === "abstract" ? null : "abstract")}
              className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <HugeiconsIcon icon={ViewIcon} size={12} />
              {showPreview === "abstract" ? "Hide Preview" : "Show Preview"}
              {showPreview === "abstract" ? <HugeiconsIcon icon={ArrowDown01Icon} size={12} /> : <HugeiconsIcon icon={ArrowRight01Icon} size={12} />}
            </button>
            {showPreview === "abstract" && (
              <div
                className="mt-3 p-4 bg-obsidian-2/50 rounded-xl text-sm text-slate-300 leading-relaxed prose prose-invert prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: abstrakSection.content }}
              />
            )}
          </div>
        )}
      </div>

      {/* ─── Conclusion Generator ─────────────────────────────── */}
      <div className="bg-obsidian-1 border border-obsidian-2 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              hasConclusion ? "bg-accent-lime/15 text-accent-lime" : "bg-obsidian-2 text-slate-500"
            )}>
              <HugeiconsIcon icon={BookOpen01Icon} size={20} />
            </div>
            <div>
              <span className="text-sm font-bold text-white">Kesimpulan & Saran</span>
              <span className="text-[10px] text-slate-500 ml-2">Conclusion</span>
            </div>
          </div>
          {hasConclusion ? (
            <div className="flex items-center gap-2 text-accent-lime">
              <HugeiconsIcon icon={Tick01Icon} size={14} />
              <span className="text-[10px] font-bold">{conclusionWordCount}w</span>
            </div>
          ) : (
            <button
              onClick={handleGenerateConclusion}
              disabled={isGeneratingConclusion}
              className="flex items-center gap-2 px-4 py-2 bg-accent-lime text-obsidian-0 rounded-xl text-xs font-bold hover:bg-white transition-all disabled:opacity-50"
            >
              {isGeneratingConclusion ? (
                <HugeiconsIcon icon={Loading01Icon} size={14} className="animate-spin" />
              ) : (
                <HugeiconsIcon icon={SparklesIcon} size={14} />
              )}
              Generate Conclusion
            </button>
          )}
        </div>

        {conclusionSection?.content && (
          <div>
            <button
              onClick={() => setShowPreview(showPreview === "conclusion" ? null : "conclusion")}
              className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <HugeiconsIcon icon={ViewIcon} size={12} />
              {showPreview === "conclusion" ? "Hide Preview" : "Show Preview"}
              {showPreview === "conclusion" ? <HugeiconsIcon icon={ArrowDown01Icon} size={12} /> : <HugeiconsIcon icon={ArrowRight01Icon} size={12} />}
            </button>
            {showPreview === "conclusion" && (
              <div
                className="mt-3 p-4 bg-obsidian-2/50 rounded-xl text-sm text-slate-300 leading-relaxed prose prose-invert prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: conclusionSection.content }}
              />
            )}
          </div>
        )}
      </div>

      {/* ─── APA 7th Audit ────────────────────────────────────── */}
      <div className="bg-obsidian-1 border border-obsidian-2 rounded-3xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              apaCheckPassed === true ? "bg-accent-lime/15 text-accent-lime" :
              apaCheckPassed === false ? "bg-amber-500/15 text-amber-400" :
              "bg-obsidian-2 text-slate-500"
            )}>
              <HugeiconsIcon icon={SecurityIcon} size={20} />
            </div>
            <div>
              <span className="text-sm font-bold text-white">APA 7th Sync</span>
              <span className="text-[10px] text-slate-500 ml-2">Citation Audit</span>
            </div>
          </div>
          <button
            onClick={runAPACheck}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
              apaCheckPassed === true
                ? "bg-accent-lime/10 text-accent-lime"
                : "bg-obsidian-2 text-slate-300 hover:bg-accent-lime/10 hover:text-accent-lime"
            )}
          >
            {apaCheckPassed === true ? <HugeiconsIcon icon={Tick01Icon} size={14} /> : <HugeiconsIcon icon={SecurityIcon} size={14} />}
            {apaCheckPassed === true ? "Passed" : apaCheckPassed === false ? "Run Again" : "Run Check"}
          </button>
        </div>
      </div>

       {/* ─── Export Section ────────────────────────────────────── */}
      <div className="pt-6 border-t border-white/5">
        {!canExport && (
          <div className="flex items-center gap-3 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl mb-6">
            <HugeiconsIcon icon={AlertCircleIcon} size={16} className="text-amber-400 shrink-0" />
            <p className="text-xs text-amber-400/80 font-medium">
              Generate abstract and conclusion before exporting your manuscript.
            </p>
          </div>
        )}

        {userPlan === "free" && (
          <div className="flex items-center gap-3 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl mb-6">
            <HugeiconsIcon icon={SparklesIcon} size={16} className="text-indigo-400 shrink-0" />
            <p className="text-xs text-indigo-400 font-medium">
              Fitur Ekspor merupakan fitur Eksklusif. Upgrade ke paket <strong>Education</strong> untuk mengunduh manuscript Anda.
            </p>
          </div>
        )}

        <button
          onClick={handleFullExport}
          disabled={!canExport || isExporting || userPlan === "free"}
          className={cn(
            "w-full group px-8 py-5 rounded-2xl font-bold transition-all shadow-lg flex items-center justify-center gap-3 active:scale-[0.98]",
            userPlan === "free" 
              ? "bg-obsidian-2 text-slate-500 cursor-not-allowed border border-white/5" 
              : "bg-accent-lime text-obsidian-0 hover:bg-white shadow-accent-lime/15"
          )}
        >
          {isExporting ? (
            <span className="flex items-center gap-3">
              <HugeiconsIcon icon={Loading01Icon} size={20} className="animate-spin" />
              Exporting Manuscript...
            </span>
          ) : (
            <>
              {userPlan === "free" ? <HugeiconsIcon icon={SecurityIcon} size={20} /> : <HugeiconsIcon icon={Download01Icon} size={20} />}
              <span className="text-base">
                {userPlan === "free" ? "Export Disabled (Upgrade Required)" : "Export Full Manuscript (DOCX)"}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
