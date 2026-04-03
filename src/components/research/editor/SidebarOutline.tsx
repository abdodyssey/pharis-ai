// src/components/research/editor/SidebarOutline.tsx
import { useResearchStore } from "@/store/useResearchStore";
import { cn } from "@/lib/utils";
import { ListTree, Circle } from "lucide-react";

export default function SidebarOutline() {
  const { sections, activeSectionId, setActiveSectionId } = useResearchStore();

  return (
    <aside className="w-72 border-r border-slate-200/60 h-full bg-slate-50/50 flex flex-col shrink-0">
      <div className="p-6">
        <div className="flex items-center gap-2 text-slate-400 mb-6 px-2">
          <ListTree size={14} />
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Struktur Riset</span>
        </div>
        
        <nav className="space-y-1">
          {sections.map((section, index) => {
            const isActive = activeSectionId === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSectionId(section.id)}
                className={cn(
                  "w-full text-left px-4 py-2.5 text-sm transition-all duration-200 rounded-lg flex items-center gap-3 group",
                  isActive
                    ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50 font-semibold"
                    : "text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm"
                )}
              >
                <span className={cn(
                  "text-[10px] w-5 h-5 rounded-md flex items-center justify-center border transition-colors",
                  isActive 
                    ? "bg-blue-50 border-blue-100 text-blue-600" 
                    : "bg-slate-100 border-slate-200 text-slate-400 group-hover:border-slate-300"
                )}>
                  {index + 1}
                </span>
                <span className="truncate">{section.title}</span>
                {isActive && (
                  <Circle className="ml-auto text-blue-600 fill-blue-600" size={6} />
                )}
              </button>
            );
          })}
        </nav>
      </div>
      
      <div className="mt-auto p-6 border-t border-slate-200/40 opacity-40 grayscale group hover:grayscale-0 hover:opacity-100 transition-all">
        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Status Proyek</div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] text-slate-400">Live Sync Enabled</span>
        </div>
      </div>
    </aside>
  );
}
