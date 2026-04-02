"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useResearchStore } from "@/store/useResearchStore";

// Import Komponen Research (Pastikan file-file ini sudah kamu buat di components/research)
import StepperNav from "@/components/research/StepperNav";
import Step1Idea from "@/components/research/Step1Idea";
import Step2TitleObjective from "@/components/research/Step2TitleObjective";
import Step3Structure from "@/components/research/Step3Structure";
import Step4Review from "@/components/research/Step4Review";
import Step5Export from "@/components/research/Step5Export";

export default function ResearchEditorPage() {
  const { id } = useParams();
  const { currentStep, fetchSession, isLoading, error } = useResearchStore();

  useEffect(() => {
    if (id) {
      fetchSession(id as string);
    }
  }, [id, fetchSession]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        <span className="ml-4 font-medium text-gray-600">
          Memuat Sesi PharisAI...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 bg-red-50 border border-red-200 rounded-xl text-red-700">
        <h2 className="font-bold mb-2">Error Terjadi</h2>
        <p>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 text-sm underline"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  // Di dalam return src/app/research/[id]/page.tsx
  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <StepperNav />

      {/* Menggunakan custom utility dari globals.css */}
      <div className="step-container">
        {currentStep === 1 && <Step1Idea />}
        {currentStep === 2 && <Step2TitleObjective />}
        {currentStep === 3 && <Step3Structure />}
        {currentStep === 4 && <Step4Review />}
        {currentStep === 5 && <Step5Export />}
      </div>

      <footer className="mt-10 text-center text-slate-400 text-xs">
        PharisAI © 2026 - Digital Transformation for Researchers
      </footer>
    </div>
  );
}
