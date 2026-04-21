"use client";
import AutomatedDraftStep from "./AutomatedDraftStep";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon } from "@hugeicons/core-free-icons";

export default function Step7Synthesis() {
  return (
    <AutomatedDraftStep
      stepNumber={7}
      title="Penyusunan Akhir"
      description="AI menyatukan seluruh temuan riset untuk menyusun Abstrak, Kesimpulan, dan Daftar Pustaka secara sistematis."
      sectionTitle="Abstrak"
      mode="generate_synthesis"
      subtitle="Finalisasi naskah akademik sebelum masuk ke Workspace."
      icon={<HugeiconsIcon icon={SparklesIcon} size={40} />}
    />
  );
}
