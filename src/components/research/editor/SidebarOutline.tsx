// src/components/research/editor/SidebarOutline.tsx
import { useResearchStore } from "@/store/useResearchStore";
import { cn } from "@/lib/utils";
import { ListTree, Circle, Sparkles, FileSearch } from "lucide-react";

const FIXED_STRUCTURE = [
  'Abstrak',
  'Pendahuluan',
  'Tinjauan Pustaka',
  'Metode Penelitian',
  'Hasil dan Pembahasan',
  'Kesimpulan dan Saran',
  'Daftar Pustaka'
];

export default function SidebarOutline() {
  const { sections, activeSectionId, setActiveSectionId } = useResearchStore();

  return (
    <aside className="w-72 border-r border-slate-200/60 h-full bg-slate-50/50 flex flex-col shrink-0">
      <div className="p-6">
        <div className="flex items-center gap-2 text-slate-400 mb-6 px-2">
          <ListTree size={14} />
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase">IMRAD Structure</span>
        </div>
        
        <nav className="space-y-1">
          {FIXED_STRUCTURE.map((title, index) => {
            const section = sections.find(s => s.title.toLowerCase() === title.toLowerCase());
            const isActive = activeSectionId === section?.id;
            const hasContent = section?.content && section.content.trim().length > 0;
            const isMissing = !section;

            return (
              <button
                key={title}
                onClick={() => section && setActiveSectionId(section.id)}
                className={cn(
                  "w-full text-left px-4 py-2.5 text-sm transition-all duration-200 rounded-lg flex items-center gap-3 group relative overflow-hidden",
                  isActive
                    ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50 font-semibold"
                    : isMissing
                    ? "text-slate-300 hover:bg-white hover:text-slate-900 group"
                    : "text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm"
                )}
              >
                <span className={cn(
                  "text-[10px] w-6 h-6 rounded-md flex items-center justify-center border transition-colors shrink-0",
                  isActive 
                    ? "bg-blue-50 border-blue-100 text-blue-600" 
                    : "bg-slate-100 border-slate-200 text-slate-400 group-hover:border-slate-300"
                )}>
                  {index + 1}
                </span>
                
                <div className="flex flex-col min-w-0">
                  <span className="truncate leading-tight">{title}</span>
                  {isMissing ? (
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Empty</span>
                  ) : !hasContent ? (
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Drafting...</span>
                  ) : null}
                </div>

                {hasContent && (
                  <div className="ml-auto flex items-center gap-1.5">
                    <Sparkles size={10} className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Circle className="text-blue-500 fill-blue-500" size={6} />
                  </div>
                )}
                
                {isActive && !hasContent && (
                  <Circle className="ml-auto text-slate-300 fill-slate-300" size={6} />
                )}
              </button>
            );
          })}
        </nav>
      </div>
      
      <div className="mt-auto p-6 border-t border-slate-200/40 bg-white/40">
        <div className="text-[9px] font-black text-slate-450 uppercase tracking-[0.2em] mb-2 px-1">AI Grounding</div>
        <div className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-sm shadow-blue-100">
            <FileSearch size={14} />
          </div>
          <div className="space-y-0.5">
            <div className="text-[10px] font-bold text-slate-900">RAG Analysis</div>
            <div className="text-[9px] text-blue-600/70 font-semibold uppercase tracking-widest">Bibliography Active</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
