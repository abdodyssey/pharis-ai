"use client";

import { lazy, Suspense } from "react";
import { useResearchStore } from "@/store/useResearchStore";
import ResearchJourneySidebar from "./ResearchJourneySidebar";
import { motion, AnimatePresence } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading01Icon } from "@hugeicons/core-free-icons";

// Lazy-loaded step components
const Step1Idea = lazy(() => import("./Step1Idea"));
const Step2TitleObjective = lazy(() => import("./Step2TitleObjective"));
const Step3LiteratureVault = lazy(() => import("./Step3LiteratureVault"));
const ModularEditorWorkspace = lazy(() => import("./ModularEditorWorkspace"));

const StepLoadingFallback = () => (
  <div className="flex-1 flex items-center justify-center p-20">
    <div className="flex flex-col items-center gap-4">
      <HugeiconsIcon icon={Loading01Icon} className="w-10 h-10 text-accent-lime animate-spin" />
      <p className="text-slate-500 font-black text-[10px]">Assembling Discovery Workspace...</p>
    </div>
  </div>
);

/**
 * StepController: Maps the current step number to its corresponding component.
 */
function StepController({ step }: { step: number }) {
  switch (step) {
    case 1: return <Step1Idea />;
    case 2: return <Step2TitleObjective />;
    case 3: return <Step3LiteratureVault />;
    default: return <Step1Idea />;
  }
}

/**
 * ResearchWizard: Master layout that orchestrates the 7-step research journey.
 */
export default function ResearchWizard() {
  const { currentStep, progress } = useResearchStore();

  const activeProgress = progress || [];
  const isStep3Done = activeProgress.find(p => p.step_number === 3)?.status === 'completed';

  // Entry to full-screen editor once the discovery phase (Steps 1-3) is complete
  if (isStep3Done) {
    return (
      <div className="w-full h-screen bg-obsidian-0">
        <Suspense fallback={<StepLoadingFallback />}>
          <ModularEditorWorkspace />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-obsidian-0 transition-colors duration-300">
      {/* Left: Research Journey Sidebar */}
      <ResearchJourneySidebar />

      {/* Center: Step Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-transparent">
        <Suspense fallback={<StepLoadingFallback />}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="min-h-full"
            >
              <StepController step={currentStep} />
            </motion.div>
          </AnimatePresence>
        </Suspense>
      </main>
    </div>
  );
}
