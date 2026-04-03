// src/components/research/editor/EditorPane.tsx
import { useResearchStore } from "@/store/useResearchStore";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Info, ShieldCheck } from "lucide-react";

export default function EditorPane() {
  const { sections, activeSectionId, updateSectionInStore } = useResearchStore();
  const activeSection = sections.find((s) => s.id === activeSectionId);
  const [localContent, setLocalContent] = useState(activeSection?.content || "");

  // Update local state when active section changes
  useEffect(() => {
    setLocalContent(activeSection?.content || "");
  }, [activeSectionId, activeSection?.content]);

  if (!activeSection) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-300 font-medium">
        Pilih bab untuk mulai mengedit.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
      {/* Top Header Section - Minimalist & Premium */}
      <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-end">
        <div className="space-y-1">
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400">
            BAB {sections.findIndex(s => s.id === activeSectionId) + 1}
          </span>
          <h3 className="text-3xl font-bold tracking-tight text-slate-900 leading-tight">
            {activeSection.title}
          </h3>
        </div>
        
        {/* Grounding Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50/50 border border-blue-100 rounded-full group cursor-help transition-all hover:bg-blue-50">
          <ShieldCheck size={14} className="text-blue-600" />
          <span className="text-[10px] font-bold text-blue-700 tracking-wider">GROUNDING: ENABLED</span>
          <Info size={10} className="text-blue-400 group-hover:text-blue-500" />
        </div>
      </div>

      {/* Editor Canvas - Maximizing clean space for typography */}
      <div className="flex-1 overflow-y-auto p-12 bg-white relative scroll-smooth scrollbar-hide">
        <div className="max-w-4xl mx-auto space-y-6">
          <textarea
            className={cn(
              "w-full h-full min-h-[600px] border-none focus:outline-none p-0 resize-none",
              "text-slate-800 text-lg leading-relaxed placeholder:text-slate-200",
              "font-serif antialiased"
            )}
            placeholder="Tulis draf riset Anda di sini. Gunakan chat di bawah untuk bantuan AI berbasis data..."
            value={localContent}
            onChange={(e) => {
              setLocalContent(e.target.value);
              updateSectionInStore(activeSection.id, e.target.value);
            }}
          />
        </div>

        {/* Sub-badge bottom markers */}
        <div className="max-w-4xl mx-auto mt-20 pt-8 border-t border-slate-50 flex justify-between items-center opacity-30">
          <div className="flex items-center gap-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            <span>Editor Draft</span>
            <span>•</span>
            <span>Real-time Sync</span>
          </div>
          <p className="text-[10px] text-slate-300 font-medium italic">Powered by Research-Builder Engine</p>
        </div>
      </div>
    </div>
  );
}
