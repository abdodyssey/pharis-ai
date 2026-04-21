"use client";
import AutomatedDraftStep from "./AutomatedDraftStep";
import { HugeiconsIcon } from "@hugeicons/react";
import { LibraryIcon } from "@hugeicons/core-free-icons";

export default function Step5Results() {
  return (
    <AutomatedDraftStep
      stepNumber={5}
      title="Findings & Results"
      description="Penyajian data hasil temuan penelitian secara objektif dan sistematis sesuai metodologi."
      sectionTitle="Hasil dan Pembahasan"
      mode="generate_results"
      subtitle="Visualisasi dan narasi data temuan kunci penelitian."
      icon={<HugeiconsIcon icon={LibraryIcon} size={40} />}
    />
  );
}
