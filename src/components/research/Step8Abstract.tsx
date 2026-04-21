"use client";
import AutomatedDraftStep from "./AutomatedDraftStep";
import { HugeiconsIcon } from "@hugeicons/react";
import { SparklesIcon } from "@hugeicons/core-free-icons";

export default function Step8Abstract() {
  return (
    <AutomatedDraftStep
      stepNumber={8}
      title="Research Abstract"
      description="AI menyatukan seluruh komponen riset (Latar Belakang hingga Kesimpulan) ke dalam Abstrak yang ringkas dan profesional."
      sectionTitle="Abstrak"
      mode="generate_abstract"
      subtitle="Finalisasi draf inti naskah sebelum menyusun daftar pustaka."
      icon={<HugeiconsIcon icon={SparklesIcon} size={40} />}
    />
  );
}
