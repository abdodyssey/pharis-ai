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
    <nav className="flex justify-between items-center mb-8 border-b pb-4">
      {steps.map((step) => (
        <div key={step.id} className="flex flex-col items-center">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              currentStep >= step.id
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-500"
            }`}
          >
            {step.id}
          </div>
          <span
            className={`text-xs mt-1 ${currentStep === step.id ? "font-bold" : ""}`}
          >
            {step.name}
          </span>
        </div>
      ))}
    </nav>
  );
}
