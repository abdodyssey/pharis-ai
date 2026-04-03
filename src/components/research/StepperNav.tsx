// src/components/research/StepperNav.tsx
import { useResearchStore } from "@/store/useResearchStore";

const steps = [
  { id: 1, name: "Research Idea" },
  { id: 2, name: "Title & Objectives" },
  { id: 3, name: "Structure" },
  { id: 4, name: "Review" },
  { id: 5, name: "Export" },
];

export default function StepperNav() {
  const currentStep = useResearchStore((state) => state.currentStep);

  return (
    <nav className="relative flex justify-between items-center w-full px-2">
      {/* Connecting Line Background */}
      <div className="absolute top-3 left-0 w-full h-[2px] bg-slate-100 -z-10" />
      
      {/* Active Line Progress */}
      <div 
        className="absolute top-3 left-0 h-[2px] bg-blue-500 transition-all duration-500 ease-in-out -z-10"
        style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
      />

      {steps.map((step) => {
        const isActive = currentStep >= step.id;
        const isCurrent = currentStep === step.id;
        
        return (
          <div key={step.id} className="flex flex-col items-center group">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-500 ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-100"
                  : "bg-white border-2 border-slate-100 text-slate-300"
              } ${isCurrent ? "ring-4 ring-blue-50" : ""}`}
            >
              {step.id}
            </div>
            <span
              className={`text-[10px] mt-2 tracking-tight transition-colors duration-300 ${
                isCurrent 
                  ? "font-semibold text-slate-900" 
                  : "font-medium text-slate-400"
              }`}
            >
              {step.name}
            </span>
          </div>
        );
      })}
    </nav>
  );
}
