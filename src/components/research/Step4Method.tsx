"use client";
import AutomatedDraftStep from "./AutomatedDraftStep";
import { HugeiconsIcon } from "@hugeicons/react";
import { Settings01Icon } from "@hugeicons/core-free-icons";

export default function Step4Method() {
  return (
    <AutomatedDraftStep
      stepNumber={4}
      title="Methodology"
      description="Susun prosedur penelitian, desain eksperimen, dan teknik pengumpulan data secara mendetail."
      sectionTitle="Metode Penelitian"
      mode="generate_methods"
      subtitle="Menetapkan blueprint pelaksanaan riset agar kredibel dan terukur."
      icon={<HugeiconsIcon icon={Settings01Icon} size={40} />}
    />
  );
}
