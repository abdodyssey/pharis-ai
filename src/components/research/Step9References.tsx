"use client";
import AutomatedDraftStep from "./AutomatedDraftStep";
import { HugeiconsIcon } from "@hugeicons/react";
import { Book02Icon } from "@hugeicons/core-free-icons";

export default function Step9References() {
  return (
    <AutomatedDraftStep
      stepNumber={9}
      title="Research Bibliography"
      description="AI menyusun Daftar Pustaka secara otomatis menggunakan format standar akademik berdasarkan referensi yang dikumpulkan."
      sectionTitle="Daftar Pustaka"
      mode="generate_bibliography"
      subtitle="Finalisasi referensi naskah sebelum masuk ke Workspace."
      buttonText="Generate Reference"
      icon={<HugeiconsIcon icon={Book02Icon} size={40} />}
    />
  );
}
