"use client";
import AutomatedDraftStep from "./AutomatedDraftStep";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";

export default function Step7Conclusion() {
  return (
    <AutomatedDraftStep
      stepNumber={7}
      title="Conclusion & Suggestions"
      description="AI menyusun Bab Kesimpulan dan Saran secara mendalam berdasarkan temuan dan pembahasan penelitian."
      sectionTitle="Kesimpulan dan Saran"
      mode="generate_conclusion"
      subtitle="Menyimpulkan temuan riset dan memberikan arah penelitian masa depan."
      icon={<HugeiconsIcon icon={CheckmarkCircle01Icon} size={40} />}
    />
  );
}
