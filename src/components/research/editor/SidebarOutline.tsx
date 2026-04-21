// src/components/research/editor/SidebarOutline.tsx
"use client";

import { useResearchStore } from "@/store/useResearchStore";
import { cn, getWordCount } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { File02Icon, FileSearchIcon, ArrowRight01Icon } from "@hugeicons/core-free-icons";

const FIXED_STRUCTURE = [
  'Abstrak',
  'Pendahuluan',
  'Metode Penelitian',
  'Hasil dan Pembahasan',
  'Kesimpulan dan Saran',
  'Daftar Pustaka'
];

// Section framework labels
const SECTION_FRAMEWORKS: Record<string, string> = {
  'pendahuluan': 'CARS',
  'metode penelitian': 'Justify',
  'hasil dan pembahasan': 'Data',
};

/**
 * SidebarOutline: A clean, Obsidian Deep document navigation component.
 */
export default function SidebarOutline() {
  const { sections, activeSectionId, setActiveSectionId, saveSectionToDb } = useResearchStore();

  const handleSectionClick = (sectionId: string) => {
    if (sectionId === activeSectionId) return;

    // Save current section before switching
    const currentSection = sections.find(s => s.id === activeSectionId);
    if (currentSection && activeSectionId) {
      saveSectionToDb(activeSectionId, currentSection.content);
    }

    // Switch to new section
    setActiveSectionId(sectionId);
  };

  return (
    <aside className="w-64 border-r border-slate-100 dark:border-white/5 h-full bg-white dark:bg-obsidian-1 flex flex-col shrink-0 no-print animate-in slide-in-from-left duration-700">
      {/* Header */}
      <div className="px-6 pt-10 pb-6">
        <div className="flex items-center gap-3 text-slate-900 dark:text-white mb-1">
          <div className="w-6 h-6 rounded-lg bg-slate-950 dark:bg-accent-lime/15 flex items-center justify-center text-white dark:text-accent-lime shadow-xl shadow-slate-900/10 dark:shadow-black/50">
            <HugeiconsIcon icon={File02Icon} size={12} />
          </div>
          <span className="text-[10px] font-black">Manuscript</span>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 pb-10 space-y-2 custom-scrollbar">
        {FIXED_STRUCTURE.map((title) => {
          const section = sections.find(s => s.title.toLowerCase() === title.toLowerCase());
          const isActive = activeSectionId === section?.id;
          const wordCount = section?.content ? getWordCount(section.content) : 0;
          const isCompleted = wordCount >= 100;
          const hasContent = wordCount > 0;
          const framework = SECTION_FRAMEWORKS[title.toLowerCase()];

          return (
            <button
              key={title}
              onClick={() => section && handleSectionClick(section.id)}
              disabled={!section}
              className={cn(
                "w-full text-left p-4 transition-all duration-300 rounded-[22px] flex items-center justify-between group relative border",
                isActive
                  ? "bg-white dark:bg-white/5 border-slate-950 dark:border-accent-lime/30 shadow-2xl shadow-slate-900/10 dark:shadow-black/60 ring-1 ring-slate-950 dark:ring-accent-lime/20"
                  : section
                  ? "border-transparent hover:border-slate-100 dark:hover:border-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.02] shadow-sm"
                  : "opacity-20 cursor-not-allowed"
              )}
            >
              <div className="flex flex-col min-w-0 pr-4">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[12px] leading-tight transition-all",
                    isActive ? "font-black text-slate-950 dark:text-white" : "font-semibold text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white"
                  )}>
                    {title}
                  </span>
                  {framework && (
                    <span className="text-[7px] font-bold text-accent-lime/50 bg-accent-lime/5 px-1.5 py-0.5 rounded">
                      {framework}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all duration-500",
                    isCompleted 
                      ? "bg-slate-900 dark:bg-accent-lime" 
                      : hasContent
                      ? "bg-slate-300 dark:bg-amber-500 animate-pulse" 
                      : "bg-slate-100 dark:bg-obsidian-2"
                  )} />
                  
                  <span className={cn(
                    "text-[8px] font-bold",
                    isActive ? "text-slate-900 dark:text-slate-300" : "text-slate-300 dark:text-slate-600 group-hover:text-slate-400"
                  )}>
                    {isCompleted ? "Completed" : hasContent ? "Drafting" : "Empty"}
                    {wordCount > 0 && ` · ${wordCount}w`}
                  </span>
                </div>
              </div>

              {isActive && (
                <HugeiconsIcon icon={ArrowRight01Icon} size={14} className="text-slate-950 dark:text-accent-lime animate-in slide-in-from-left-2 duration-300" />
              )}
            </button>
          );
        })}
      </nav>
      
      {/* Bottom Panel */}
      <div className="p-6 border-t border-slate-50 dark:border-white/5 mt-auto">
        <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-obsidian-2/50 rounded-2xl">
          <div className="w-8 h-8 rounded-xl bg-slate-950 dark:bg-accent-lime/15 flex items-center justify-center text-white dark:text-accent-lime shrink-0 shadow-lg shadow-slate-200 dark:shadow-none">
            <HugeiconsIcon icon={FileSearchIcon} size={14} />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-black text-slate-950 dark:text-white leading-none mb-1">Project Progress</div>
            <div className="text-[8px] text-slate-400 dark:text-slate-500 font-bold truncate">
              {sections.filter(s => getWordCount(s.content || "") >= 100).length}/{FIXED_STRUCTURE.length} Chapters Ready
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
