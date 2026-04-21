"use client";
import AutomatedDraftStep from "./AutomatedDraftStep";
import { HugeiconsIcon } from "@hugeicons/react";
import { LibraryIcon } from "@hugeicons/core-free-icons";

export default function Step6Bab45() {
  return (
    <AutomatedDraftStep
      stepNumber={6}
      title="Chapter 4 & 5 Construction"
      description="Penyusunan bab Analisis dan Pembahasan secara komprehensif berdasarkan temuan data."
      sectionTitle="Hasil dan Pembahasan"
      mode="generate_results"
      subtitle="Sintesis data hasil penelitian menjadi narasi akademik yang kuat."
      icon={<HugeiconsIcon icon={LibraryIcon} size={40} />}
    />
  );
}
