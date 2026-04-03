"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import { useResearchStore } from "@/store/useResearchStore";
import Link from "next/link";
import { 
  Send, 
  Eye, 
  Download, 
  X, 
  FileText, 
  CheckCircle2,
  ChevronLeft,
  Book
} from "lucide-react";
import { SidebarSkeleton, EditorSkeleton } from "../shared/Skeletons";

// Lazy-loaded components for Suspense
const SidebarOutline = lazy(() => import("./editor/SidebarOutline"));
const EditorPane = lazy(() => import("./editor/EditorPane"));
const ChatBar = lazy(() => import("./editor/ChatBar"));
const BibliographyDrawer = lazy(() => import("./editor/BibliographyDrawer"));
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { saveAs } from "file-saver";

export default function ModularEditorWorkspace() {
  const { 
    refinedTitle, 
    objectives, 
    sections, 
    activeSectionId, 
    nextStep,
    ensureIMRADStructure,
    syncBibliographyToSection,
    bibliography
  } = useResearchStore();

  useEffect(() => {
    ensureIMRADStructure();
  }, [ensureIMRADStructure]);

  useEffect(() => {
    syncBibliographyToSection();
  }, [bibliography, syncBibliographyToSection]);
  
  const [showReview, setShowReview] = useState(false);
  const [showBibliography, setShowBibliography] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!refinedTitle) return;
    setIsExporting(true);
    try {
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({ text: refinedTitle, heading: HeadingLevel.TITLE }),
              new Paragraph({
                text: "Research Objectives",
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400 },
              }),
              ...objectives.map(
                (obj) => new Paragraph({ text: `• ${obj}`, bullet: { level: 0 } })
              ),
              ...sections.flatMap((section) => {
                const cleanContent = (section.content || "")
                  .replace(/<\/h[1-6]>|<\/p>|<\/li>/g, "\n") // Replace closing tags with newlines
                  .replace(/<[^>]*>/g, ""); // Strip all other tags

                return [
                  new Paragraph({
                    text: section.title.toUpperCase(),
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 400 },
                  }),
                  new Paragraph({ children: [new TextRun(cleanContent)] }),
                ];
              }),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `PharisAI_${refinedTitle.replace(/\s+/g, "_")}.docx`);
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      {/* Workspace Header - Premium & Clear */}
      <header className="bg-white border-b border-slate-100 flex justify-between items-center px-6 lg:px-10 h-20 z-30 shrink-0">
        <div className="flex items-center gap-6 max-w-2xl">
          <Link href="/dashboard" className="p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-slate-400 border border-transparent hover:border-slate-100">
             <ChevronLeft size={20} />
          </Link>
          
          <div className="h-10 w-px bg-slate-100 hidden sm:block" />

          <div className="space-y-0.5">
            <h2 className="text-lg lg:text-xl font-extrabold text-slate-950 tracking-tight leading-none line-clamp-1">
              {refinedTitle || "Penelitian Tanpa Judul"}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Workspace V2.5</span>
              <div className="w-1 h-1 rounded-full bg-slate-200" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Autosave Active</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-100">
            <button
              onClick={() => setShowReview(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-white hover:text-slate-950 transition-all hover:shadow-xs"
            >
              <Eye size={16} />
              <span>Preview</span>
            </button>

            <div className="w-px h-6 bg-slate-200 mx-1" />

            <button
              onClick={() => setShowBibliography(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-white hover:text-slate-950 transition-all hover:shadow-xs"
            >
              <Book size={16} />
              <span>Daftar Pustaka</span>
            </button>

            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
            >
              <Download size={16} />
              <span>{isExporting ? "Memroses..." : "Export"}</span>
            </button>
          </div>

          <button
            onClick={nextStep}
            className="group bg-slate-950 text-white pl-6 pr-5 py-2.5 rounded-2xl text-sm font-bold hover:bg-black transition-all flex items-center gap-3 shadow-xl shadow-slate-200"
          >
            <span>Selesaikan </span>
            <Send size={14} className="opacity-40 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </button>
        </div>
      </header>

      {/* Main Workspace Body - 100% Height */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Left Navigator (Outline) - Suspense Boundary */}
        <Suspense fallback={<SidebarSkeleton />}>
          <SidebarOutline />
        </Suspense>
        
        {/* Center Canvas (Editing) - Suspense Boundary */}
        <section className="flex-1 flex flex-col min-w-0 bg-white overflow-hidden">
          <Suspense fallback={<EditorSkeleton />}>
            <EditorPane key={activeSectionId} />
          </Suspense>
        </section>

        {/* Interaction Bar (Chat) - Suspense Boundary */}
        <Suspense fallback={<div className="w-80 bg-slate-50 border-l border-slate-100 animate-pulse" />}>
          <ChatBar />
        </Suspense>
      </main>

      {/* Review Slide-over / Modal */}
      {showReview && (
        <div className="fixed inset-0 z-100 flex items-center justify-end">
          <div 
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-500"
            onClick={() => setShowReview(false)}
          />
          <div className="relative w-full max-w-4xl h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-700 ease-out">
            <div className="px-10 py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-950 tracking-tight">Manuscript Preview</h3>
                  <p className="text-xs text-slate-400 font-medium">Review format akademik Anda sebelum ekspor.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowReview(false)}
                className="p-3 hover:bg-slate-100 rounded-2xl transition-all"
              >
                <X size={24} className="text-slate-950" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-16 lg:p-24 bg-slate-50/30">
              <div className="max-w-3xl mx-auto bg-white shadow-2xl shadow-slate-200 ring-1 ring-slate-100 p-16 lg:p-24 rounded-[2.5rem]">
                <header className="space-y-10 border-b border-slate-100 pb-16">
                  <h1 className="text-5xl font-black text-slate-950 leading-[1.1] tracking-tight">
                    {refinedTitle}
                  </h1>
                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-blue-600 uppercase tracking-[0.3em]">Research Objectives</h4>
                    <ul className="space-y-3">
                      {objectives.map((obj, i) => (
                        <li key={i} className="text-lg text-slate-600 flex gap-4">
                          <CheckCircle2 size={24} className="text-emerald-500 shrink-0 mt-0.5" /> 
                          {obj}
                        </li>
                      ))}
                    </ul>
                  </div>
                </header>

                <div className="space-y-20 pt-16">
                  {sections.map((section) => (
                    <div key={section.id} className="space-y-6">
                      <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        <span className="w-2 h-10 bg-slate-950 rounded-full" />
                        {section.title}
                      </h2>
                      <div 
                        className="text-slate-700 text-xl leading-relaxed font-serif prose max-w-none prose-slate"
                        dangerouslySetInnerHTML={{ __html: section.content || "<p class='italic text-slate-300'>Section content is empty.</p>" }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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

