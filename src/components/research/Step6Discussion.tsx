"use client";
import AutomatedDraftStep from "./AutomatedDraftStep";
import { HugeiconsIcon } from "@hugeicons/react";
import { Message01Icon } from "@hugeicons/core-free-icons";

export default function Step6Discussion() {
  return (
    <AutomatedDraftStep
      stepNumber={6}
      title="Research Discussion"
      description="Interpretasi mendalam atas temuan riset, menghubungkannya dengan teori, dan mendiskusikan implikasinya."
      sectionTitle="Hasil dan Pembahasan"
      mode="generate_discussion"
      subtitle="Dialog akademik untuk memaknai data temuan."
      icon={<HugeiconsIcon icon={Message01Icon} size={40} />}
    />
  );
}
