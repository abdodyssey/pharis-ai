"use client";
import AutomatedDraftStep from "./AutomatedDraftStep";
import { HugeiconsIcon } from "@hugeicons/react";
import { MicroscopeIcon } from "@hugeicons/core-free-icons";

export default function Step5Bab3() {
  return (
    <AutomatedDraftStep
      stepNumber={5}
      title="Bab 3: Metode Penelitian"
      description="Menentukan pendekatan, desain, dan instrumen penelitian yang sinkron dengan tujuan riset."
      sectionTitle="Metode Penelitian"
      mode="generate_methods"
      subtitle="Teknis pelaksanaan riset secara detail dan akademis."
      icon={<HugeiconsIcon icon={MicroscopeIcon} size={40} />}
    />
  );
}
