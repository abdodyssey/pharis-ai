"use client";

import { useEffect, useState } from "react";
import { useResearchStore } from "@/store/useResearchStore";

import StepperNav from "@/components/research/StepperNav";
import Step1Idea from "@/components/research/Step1Idea";
import Step2TitleObjective from "@/components/research/Step2TitleObjective";
import Step3Structure from "@/components/research/Step3Structure";
import ModularEditorWorkspace from "@/components/research/ModularEditorWorkspace";
import { EditorSkeleton } from "@/components/shared/Skeletons";

export default function ResearchPageClient({ id }: { id: string }) {
  const { currentStep, fetchSession, isLoading, error, sections } = useResearchStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (id) {
      fetchSession(id);
    }
  }, [id, fetchSession]);

  if (!isMounted) {
    return <EditorSkeleton />;
  }

  // Still handle error but not global loading (handled by Suspense fallback)
  if (error) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-white border border-red-100 rounded-4xl shadow-xl text-center">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Terjadi Gangguan</h2>
        <p className="text-slate-500 text-sm mb-8 leading-relaxed">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-black transition-all"
        >
          Muat Ulang Sesi
        </button>
      </div>
    );
  }

  // To trigger Suspense if fetchSession is in progress, 
  // though fetchSession uses an action, 
  // for now we can still use if(isLoading) if we want fine-grained loading in client components 
  // but if we want Suspense from the Server Page to work, 
  // we could potentially throw a promise or use 'use' but that's for later.
  // For now let's just make it NOT show a global loading spinner.
  if (isLoading && !isMounted) return <EditorSkeleton />;

  const isWorkspaceView = currentStep > 2 && sections.length > 0;

  return (
    <div className={`min-h-screen transition-colors duration-500 ${isWorkspaceView ? "bg-white" : "bg-slate-50"}`}>
      {!isWorkspaceView ? (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="w-full max-w-2xl">
            <StepperNav />
            
            <main className="mt-8 bg-white p-8 md:p-12 rounded-4xl shadow-sm border border-slate-200/50">
              {currentStep === 1 && <Step1Idea />}
              {currentStep === 2 && <Step2TitleObjective />}
              {currentStep === 3 && <Step3Structure />}
            </main>

            <footer className="mt-12 py-8 text-center">
              <p className="text-slate-400 text-[11px] font-medium tracking-wider">
                PharisAI &copy; 2026 &middot; Modern Academic Research Architecture
              </p>
            </footer>
          </div>
        </div>
      ) : (
        <div className="w-full h-screen animate-in fade-in duration-1000">
          <ModularEditorWorkspace />
        </div>
      )}
    </div>
  );
}
