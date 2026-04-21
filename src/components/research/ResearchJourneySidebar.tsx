"use client";

import { useResearchStore } from "@/store/useResearchStore";
import { RESEARCH_STEPS, ResearchStep } from "@/types/research";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Idea01Icon,
  PencilIcon,
  DashboardSquare01Icon,
  BookOpen01Icon,
  MicroscopeIcon,
  Comment01Icon,
  Task01Icon,
  SparklesIcon,
  Settings01Icon,
  LibraryIcon,
  LockIcon,
  Tick01Icon,
  FlashIcon,
} from "@hugeicons/core-free-icons";

const stepIcons: Record<number, any> = {
  1: Idea01Icon,
  2: PencilIcon,
  3: LibraryIcon,
};

export default function ResearchJourneySidebar() {
  const { currentStep, progress, goToStep, canAccessStep } = useResearchStore();

  const getStepStatus = (stepNumber: ResearchStep): 'completed' | 'active' | 'locked' => {
    const p = progress.find(pr => pr.step_number === stepNumber);
    if (p) return p.status as 'completed' | 'active' | 'locked';
    if (stepNumber < currentStep) return 'completed';
    if (stepNumber === currentStep) return 'active';
    return 'locked';
  };

  return (
    <aside className="w-[260px] shrink-0 bg-slate-50 dark:bg-obsidian-1 border-r border-slate-200 dark:border-white/5 h-full flex flex-col overflow-hidden transition-colors duration-300">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <Link href="/my-research" className="flex items-center gap-2 group transition-all">
          <div className="w-8 h-8 bg-accent-lime rounded-lg flex items-center justify-center text-obsidian-0 shadow-lg shadow-accent-lime/10">
            <HugeiconsIcon icon={FlashIcon} className="w-4 h-4 fill-obsidian-0" strokeWidth={2} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-900 dark:text-white tracking-tight leading-none block">Research</span>
            <span className="text-[9px] font-medium text-slate-500 mt-0.5">Journey</span>
          </div>
        </Link>
      </div>

      {/* Progress Tracker */}
      <nav className="flex-1 overflow-y-auto px-4 pb-6 custom-scrollbar">
        <div className="relative pt-2">
          {RESEARCH_STEPS.map((step, index) => {
            const status = getStepStatus(step.number);
            const Icon = stepIcons[step.number];
            const isLast = index === RESEARCH_STEPS.length - 1;
            const isCurrentActive = currentStep === step.number;
            const accessible = canAccessStep(step.number);

            return (
              <div key={step.number} className="relative mb-0.5">
                {/* Connector Line */}
                {!isLast && (
                  <div
                    className={cn(
                      "absolute left-[23px] top-6 w-px h-full z-0 transition-colors duration-500",
                      canAccessStep((step.number + 1) as ResearchStep)
                        ? "bg-accent-lime/20" 
                        : "bg-slate-100 dark:bg-white/[0.03]"
                    )}
                  />
                )}

                {/* Step Node */}
                <button
                  onClick={() => accessible && goToStep(step.number)}
                  disabled={!accessible}
                  className={cn(
                    "relative w-full flex items-center gap-3 p-1.5 rounded-xl transition-all duration-200 group z-10",
                    isCurrentActive 
                      ? "bg-white dark:bg-white/[0.02] shadow-sm ring-1 ring-slate-200 dark:ring-white/5" 
                      : "border border-transparent",
                    accessible && !isCurrentActive && "hover:bg-slate-200/40 dark:hover:bg-white/5",
                    !accessible && "opacity-30 cursor-not-allowed"
                  )}
                >
                  {/* Node Circle */}
                  <div
                    className={cn(
                      "w-[30px] h-[30px] rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 z-10",
                      status === 'completed' && "bg-accent-lime/10 text-accent-lime",
                      isCurrentActive && "bg-accent-lime text-obsidian-0 shadow-lg shadow-accent-lime/20",
                      status === 'locked' && "bg-slate-50 dark:bg-obsidian-1 text-slate-300 dark:text-slate-700 border border-slate-100 dark:border-white/5"
                    )}
                  >
                    {status === 'completed' ? (
                      <HugeiconsIcon icon={Tick01Icon} size={14} strokeWidth={3} />
                    ) : status === 'locked' && !isCurrentActive ? (
                      <HugeiconsIcon icon={LockIcon} size={12} strokeWidth={2} />
                    ) : (
                      <HugeiconsIcon icon={Icon || MicroscopeIcon} size={14} strokeWidth={isCurrentActive ? 2.5 : 1.5} />
                    )}
                  </div>

                  {/* Labels Section */}
                  <div className="flex-1 min-w-0 text-left">
                    <span className={cn(
                      "text-[10px] font-bold block leading-tight truncate transition-colors",
                      status === 'completed' && "text-slate-400 dark:text-slate-500 font-semibold",
                      isCurrentActive && "text-slate-900 dark:text-white",
                      status === 'locked' && "text-slate-400 dark:text-slate-600"
                    )}>
                      {step.label}
                    </span>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </nav>

      {/* Footer Progress Indicator */}
      <div className="px-5 py-4 border-t border-slate-200 dark:border-white/5 bg-slate-100/50 dark:bg-obsidian-1/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-bold text-slate-500">Progress</span>
          <span className="text-[10px] font-bold text-accent-lime">
            {progress.filter(p => p.status === 'completed').length}/{RESEARCH_STEPS.length}
          </span>
        </div>
        <div className="w-full h-1 bg-slate-200 dark:bg-obsidian-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-lime transition-all duration-700 ease-out"
            style={{
              width: `${(progress.filter(p => p.status === 'completed').length / RESEARCH_STEPS.length) * 100}%`
            }}
          />
        </div>
        
        <div className="mt-4">
           <Link 
            href="/" 
            className="flex items-center justify-center gap-2 w-full h-9 bg-slate-200/50 dark:bg-obsidian-2/50 hover:bg-slate-300/50 dark:hover:bg-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl text-[10px] font-bold transition-all border border-slate-200 dark:border-white/5"
          >
            <HugeiconsIcon icon={DashboardSquare01Icon} size={12} />
            <span>Simpan & Kembali</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
