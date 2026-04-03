"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useResearchStore } from "@/store/useResearchStore";

import StepperNav from "@/components/research/StepperNav";
import Step1Idea from "@/components/research/Step1Idea";
import Step2TitleObjective from "@/components/research/Step2TitleObjective";
import Step3Structure from "@/components/research/Step3Structure";
import ModularEditorWorkspace from "@/components/research/ModularEditorWorkspace";

export default function ResearchEditorPage() {
  const { id } = useParams();
  const { currentStep, fetchSession, isLoading, error, sections } = useResearchStore();

  useEffect(() => {
    if (id) {
      fetchSession(id as string);
    }
  }, [id, fetchSession]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-pulse">
        <div className="h-12 w-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
        <span className="mt-6 text-sm font-bold text-slate-400 tracking-widest uppercase animate-bounce">
          Sinkronisasi PharisAI...
        </span>
      </div>
    );
  }

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

  const isWorkspaceView = currentStep > 2 && sections.length > 0;

  return (
    <div className="min-h-screen bg-white">
      {!isWorkspaceView ? (
        <div className="max-w-4xl mx-auto p-4 md:p-8 animate-in fade-in duration-700">
          <StepperNav />
          
          <main className="mt-8">
            {currentStep === 1 && <Step1Idea />}
            {currentStep === 2 && <Step2TitleObjective />}
            {currentStep === 3 && <Step3Structure />}
          </main>

          <footer className="mt-20 py-10 border-t border-slate-100 text-center text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
            PharisAI © 2026 - Digital Transformation for Researchers
          </footer>
        </div>
      ) : (
        <div className="w-full h-screen animate-in fade-in duration-1000">
          <ModularEditorWorkspace />
        </div>
      )}
    </div>
  );
}


