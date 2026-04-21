"use client";
import { useEffect, useState } from "react";
import { useResearchStore } from "@/store/useResearchStore";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Loading01Icon, 
  SparklesIcon, 
  SentIcon, 
  Layout01Icon, 
  PlusSignIcon, 
  Delete02Icon, 
  Sorting05Icon, 
  Tick01Icon, 
  ArrowRight01Icon, 
  FlashIcon, 
  BookBookmark02Icon, 
  MicroscopeIcon, 
  File01Icon 
} from "@hugeicons/core-free-icons";
import { useToastStore } from "@/store/useToastStore";
import { callResearchAI } from "@/lib/ai-service";
import { OutlineNode } from "@/types/research";
import { cn } from "@/lib/utils";

const DEFAULT_OUTLINE: OutlineNode[] = [
  {
    id: "abs",
    title: "Abstrak",
    children: [
      { id: "abs-1", title: "Latar Belakang Singkat", children: [] },
      { id: "abs-2", title: "Tujuan Penelitian", children: [] },
      { id: "abs-3", title: "Metodologi", children: [] },
      { id: "abs-4", title: "Temuan Kunci", children: [] },
      { id: "abs-5", title: "Kesimpulan", children: [] },
    ],
  },
  {
    id: "intro",
    title: "Pendahuluan",
    children: [
      { id: "intro-1", title: "Konteks & Urgensi (CARS Move 1)", children: [] },
      { id: "intro-2", title: "Kajian Literatur Singkat (CARS Move 2)", children: [] },
      { id: "intro-3", title: "Research Gap (CARS Move 3)", children: [] },
      { id: "intro-4", title: "Tujuan & Pertanyaan Penelitian", children: [] },
    ],
  },
  {
    id: "method",
    title: "Metode Penelitian",
    children: [
      { id: "met-1", title: "Desain Penelitian", children: [] },
      { id: "met-2", title: "Populasi & Sampel", children: [] },
      { id: "met-3", title: "Instrumen Penelitian", children: [] },
      { id: "met-4", title: "Teknik Analisis Data", children: [] },
    ],
  },
  {
    id: "results",
    title: "Hasil dan Pembahasan",
    children: [
      { id: "res-1", title: "Deskripsi Data", children: [] },
      { id: "res-2", title: "Analisis & Interpretasi", children: [] },
      { id: "res-3", title: "Pembahasan Temuan", children: [] },
    ],
  },
  {
    id: "conclusion",
    title: "Kesimpulan dan Saran",
    children: [
      { id: "conc-1", title: "Kesimpulan", children: [] },
      { id: "conc-2", title: "Saran Praktis", children: [] },
      { id: "conc-3", title: "Rekomendasi Penelitian Lanjutan", children: [] },
    ],
  },
  {
    id: "ref",
    title: "Daftar Pustaka",
    children: [],
  },
];

export default function Step3Structure() {
  const {
    sessionId,
    sections,
    fetchSections,
    initializeIMRADSections,
    outlineNodes,
    setOutlineNodes,
    saveToDb,
    completeStep,
    updateResearchData,
    refinedTitle,
  } = useResearchStore();
  const [isInitializing, setIsInitializing] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  
  // Automation State
  const [autoStatus, setAutoStatus] = useState<"idle" | "intro" | "lit" | "methods" | "done">("idle");
  const [isTaskRunning, setIsTaskRunning] = useState(false);
  
  const { addToast } = useToastStore();

  // Initialize outline on mount
  useEffect(() => {
    if (outlineNodes.length === 0) {
      setOutlineNodes(DEFAULT_OUTLINE);
    }
  }, [outlineNodes.length, setOutlineNodes]);

  useEffect(() => {
    if (sessionId && sections.length === 0) {
      fetchSections(sessionId);
    }
  }, [sessionId, sections.length, fetchSections]);

  const addSubSection = (parentId: string) => {
    const newNode: OutlineNode = {
      id: `sub-${Date.now()}`,
      title: "Sub-bagian Baru",
      children: [],
    };

    const addToParent = (nodes: OutlineNode[]): OutlineNode[] =>
      nodes.map((n) => {
        if (n.id === parentId) {
          return { ...n, children: [...n.children, newNode] };
        }
        return { ...n, children: addToParent(n.children) };
      });

    setOutlineNodes(addToParent(outlineNodes));
  };

  const removeNode = (nodeId: string) => {
    const removeFromTree = (nodes: OutlineNode[]): OutlineNode[] =>
      nodes
        .filter((n) => n.id !== nodeId)
        .map((n) => ({ ...n, children: removeFromTree(n.children) }));

    setOutlineNodes(removeFromTree(outlineNodes));
  };

  const renameNode = (nodeId: string, newTitle: string) => {
    const rename = (nodes: OutlineNode[]): OutlineNode[] =>
      nodes.map((n) => {
        if (n.id === nodeId) return { ...n, title: newTitle };
        return { ...n, children: rename(n.children) };
      });

    setOutlineNodes(rename(outlineNodes));
    setEditingId(null);
  };

  const handleFinalize = async () => {
    if (!sessionId) return;
    setIsInitializing(true);
    try {
      await initializeIMRADSections(sessionId);
      await saveToDb();
      setIsFinalized(true);
      // Don't auto-proceed to step 4 yet, we stay here for the auto-drafter
      addToast({
        type: "info",
        message: "Blueprint Finalized",
        description: "Now use the AI Drafter to build your core sections.",
      });
    } catch (err: unknown) {
      console.error("Gagal inisialisasi bab:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Kesalahan Sistem";
      addToast({
        type: "error",
        message: "Gagal Inisialisasi",
        description:
          errorMessage || "Gagal menyiapkan struktur riset akademik.",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const handleAutoDraft = async (type: "intro" | "lit" | "methods") => {
    if (!sessionId || isTaskRunning) return;
    
    setIsTaskRunning(true);
    setAutoStatus(type);
    
    const mode = type === "intro" ? "generate_intro" : type === "lit" ? "generate_literature" : "generate_methods";
    
    try {
      const { error } = await callResearchAI("", sessionId, mode as any);
      if (error) throw new Error(error);
      
      addToast({
        type: "success",
        message: `${type === "intro" ? "Pendahuluan" : type === "lit" ? "Tinjauan Pustaka" : "Metode"} Selesai`,
        description: "Draft telah disimpan ke database.",
      });

      if (type === "intro") setAutoStatus("intro");
      else setAutoStatus("methods");

      // Refresh sections in store
      await fetchSections(sessionId);
    } catch (err) {
      console.error(err);
      addToast({ type: "error", message: "Gagal Menghasilkan Draft", description: "Coba lagi nanti." });
    } finally {
      setIsTaskRunning(false);
    }
  };

  const proceedToNextStep = async () => {
    await completeStep(3);
    updateResearchData({ currentStep: 4 });
  };

  const renderNode = (node: OutlineNode, depth: number = 0) => {
    const isMainChapter = depth === 0;
    return (
      <div key={node.id} className={cn("group/node", depth > 0 && "ml-6")}>
        <div
          className={cn(
            "flex items-center gap-3 p-3 rounded-xl transition-all",
            isMainChapter
              ? "bg-obsidian-2/50 border border-obsidian-2"
              : "hover:bg-obsidian-2/30"
          )}
        >
          {depth > 0 && (
            <HugeiconsIcon
              icon={Sorting05Icon}
              size={12}
              className="text-slate-600 opacity-0 group-hover/node:opacity-100 transition-opacity cursor-grab"
            />
          )}

          <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={12}
            className={cn(
              "text-slate-500 transition-transform shrink-0",
              node.children.length > 0 && "text-accent-lime/60"
            )}
          />

          {editingId === node.id ? (
            <input
              autoFocus
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={() => renameNode(node.id, editText)}
              onKeyDown={(e) =>
                e.key === "Enter" && renameNode(node.id, editText)
              }
              className="flex-1 bg-obsidian-2 border border-accent-lime/30 rounded-lg px-3 py-1 text-sm text-white outline-none"
            />
          ) : (
            <span
              onDoubleClick={() => {
                setEditingId(node.id);
                setEditText(node.title);
              }}
              className={cn(
                "flex-1 text-sm font-medium cursor-text transition-colors",
                isMainChapter
                  ? "text-white font-bold"
                  : "text-slate-300"
              )}
            >
              {node.title}
            </span>
          )}

          <div className="flex items-center gap-1 opacity-0 group-hover/node:opacity-100 transition-opacity">
            <button
              onClick={() => addSubSection(node.id)}
              className="p-1.5 text-slate-500 hover:text-accent-lime hover:bg-accent-lime/10 rounded-lg transition-all"
              title="Add sub-section"
            >
              <HugeiconsIcon icon={PlusSignIcon} size={12} />
            </button>
            {depth > 0 && (
              <button
                onClick={() => removeNode(node.id)}
                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                title="Remove"
              >
                <HugeiconsIcon icon={Delete02Icon} size={12} />
              </button>
            )}
          </div>
        </div>

        {node.children.length > 0 && (
          <div className="mt-1 space-y-1 border-l border-obsidian-2/50 ml-3 pl-1">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-16 space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-black text-accent-lime">
            Phase 03
          </span>
          <div className="h-px w-8 bg-obsidian-2" />
        </div>
        <h2 className="text-3xl font-bold text-white tracking-tight">
          Structure Blueprint
        </h2>
        <p className="text-slate-400 font-medium leading-relaxed max-w-2xl">
          Periksa dan sesuaikan kerangka IMRAD di bawah ini. Klik dua kali untuk
          mengedit nama, gunakan + untuk menambahkan sub-bagian.
        </p>
        {refinedTitle && (
          <div className="mt-4 p-4 bg-obsidian-1 border border-obsidian-2 rounded-2xl">
            <span className="text-[9px] font-black text-slate-500 mb-1 block">
              Selected Title
            </span>
            <p className="text-sm font-bold text-accent-lime leading-snug">
              {refinedTitle}
            </p>
          </div>
        )}
      </div>

      {/* Editable Outline Tree */}
      <div className="bg-obsidian-1 border border-obsidian-2 rounded-3xl p-6 space-y-2">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-xl bg-accent-lime/10 flex items-center justify-center text-accent-lime">
            <HugeiconsIcon icon={Layout01Icon} size={16} />
          </div>
          <span className="text-[10px] font-black text-slate-400">
            IMRAD Outline
          </span>
        </div>

        <div className="space-y-2">
          {outlineNodes.map((node) => renderNode(node))}
        </div>
      </div>

      {/* Finalize Button */}
      {!isFinalized ? (
        <div className="flex justify-end">
          <button
            onClick={handleFinalize}
            disabled={isInitializing}
            className="group bg-accent-lime text-obsidian-0 px-10 py-4 rounded-2xl font-bold hover:bg-white disabled:opacity-50 transition-all shadow-lg shadow-accent-lime/10 flex items-center gap-3 active:scale-95"
          >
            {isInitializing ? (
              <HugeiconsIcon icon={Loading01Icon} className="animate-spin" size={20} />
            ) : (
              <>
                <HugeiconsIcon
                  icon={SparklesIcon}
                  size={18}
                  className="text-obsidian-0/60 group-hover:scale-125 transition-transform"
                />
                <span>Finalize Blueprint</span>
                <HugeiconsIcon
                  icon={SentIcon}
                  size={14}
                  className="opacity-40 group-hover:translate-x-1 transition-transform"
                />
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-8 bg-obsidian-2/50 border border-accent-lime/20 rounded-[2.5rem] space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-accent-lime flex items-center justify-center text-obsidian-0 shadow-lg shadow-accent-lime/20">
                  <HugeiconsIcon icon={FlashIcon} size={24} />
                </div>
                <div>
                  <h4 className="text-xl font-black text-white tracking-tight">AI Core Drafter</h4>
                  <p className="text-xs text-slate-500 font-bold mt-1">Sequential Generation Engine</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              {/* Task 1: Intro */}
              <div className={cn(
                "flex items-center justify-between p-6 rounded-3xl border transition-all",
                sections.find(s => s.title === "Pendahuluan")?.content ? "bg-emerald-500/5 border-emerald-500/20" : "bg-obsidian-3 border-obsidian-2"
              )}>
                <div className="flex items-center gap-4">
                   <div className={cn(
                     "w-10 h-10 rounded-xl flex items-center justify-center",
                     sections.find(s => s.title === "Pendahuluan")?.content ? "bg-emerald-500 text-white" : "bg-obsidian-4 text-slate-500"
                   )}>
                     <HugeiconsIcon icon={File01Icon} size={20} />
                   </div>
                   <div>
                     <p className="text-sm font-bold text-white">Draft Bab 1: Pendahuluan</p>
                     <p className="text-[10px] text-slate-500 font-medium">Model CARS (Hook, Gap, Goal)</p>
                   </div>
                </div>
                <button
                  disabled={isTaskRunning || !!sections.find(s => s.title === "Pendahuluan")?.content}
                  onClick={() => handleAutoDraft("intro")}
                  className={cn(
                    "px-6 py-2.5 rounded-xl font-black text-[10px] transition-all",
                    sections.find(s => s.title === "Pendahuluan")?.content 
                      ? "bg-transparent text-emerald-500" 
                      : "bg-white text-obsidian-0 hover:bg-accent-lime"
                  )}
                >
                  {isTaskRunning && autoStatus === "intro" ? <HugeiconsIcon icon={Loading01Icon} className="animate-spin" size={16} /> : sections.find(s => s.title === "Pendahuluan")?.content ? "Completed" : "Generate"}
                </button>
              </div>


              {/* Task 2: Methods */}
              <div className={cn(
                "flex items-center justify-between p-6 rounded-3xl border transition-all",
                sections.find(s => s.title === "Metode Penelitian")?.content ? "bg-emerald-500/5 border-emerald-500/20" : "bg-obsidian-3 border-obsidian-2",
                !sections.find(s => s.title === "Pendahuluan")?.content && "opacity-50 grayscale"
              )}>
                <div className="flex items-center gap-4">
                   <div className={cn(
                     "w-10 h-10 rounded-xl flex items-center justify-center",
                     sections.find(s => s.title === "Metode Penelitian")?.content ? "bg-emerald-500 text-white" : "bg-obsidian-4 text-slate-500"
                   )}>
                     <HugeiconsIcon icon={MicroscopeIcon} size={20} />
                   </div>
                   <div>
                     <p className="text-sm font-bold text-white">Draft Bab 2: Metode Penelitian</p>
                     <p className="text-[10px] text-slate-500 font-medium">Methodological Consistency</p>
                   </div>
                </div>
                <button
                  disabled={isTaskRunning || !sections.find(s => s.title === "Pendahuluan")?.content || !!sections.find(s => s.title === "Metode Penelitian")?.content}
                  onClick={() => handleAutoDraft("methods")}
                  className="px-6 py-2.5 rounded-xl font-black text-[10px] bg-white text-obsidian-0 hover:bg-accent-lime disabled:opacity-50 transition-all"
                >
                  {isTaskRunning && autoStatus === "methods" ? <HugeiconsIcon icon={Loading01Icon} className="animate-spin" size={16} /> : sections.find(s => s.title === "Metode Penelitian")?.content ? <HugeiconsIcon icon={Tick01Icon} size={16} className="text-emerald-500" /> : "Generate"}
                </button>
              </div>
            </div>
            
            {/* Proceed Button */}
            {sections.find(s => s.title === "Metode Penelitian")?.content && (
               <div className="pt-6 border-t border-obsidian-3">
                 <button
                  onClick={proceedToNextStep}
                  className="w-full py-5 bg-accent-lime text-obsidian-0 rounded-2xl font-black text-[11px] hover:bg-white transition-all shadow-xl shadow-accent-lime/10 flex items-center justify-center gap-3 animate-bounce"
                 >
                   <span>Buka Literature Vault</span>
                   <HugeiconsIcon icon={ArrowRight01Icon} size={20} />
                 </button>
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
