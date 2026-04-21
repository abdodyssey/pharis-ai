"use client";
import AutomatedDraftStep from "./AutomatedDraftStep";
import { HugeiconsIcon } from "@hugeicons/react";
import { File01Icon } from "@hugeicons/core-free-icons";

export default function Step3Bab1() {
  return (
    <AutomatedDraftStep
      stepNumber={3}
      title="Bab 1: Pendahuluan"
      description="Tahap ini AI akan menyusun Latar Belakang, Urgensi, dan Research Gap menggunakan Model CARS."
      sectionTitle="Pendahuluan"
      mode="generate_intro"
      subtitle="Menghubungkan judul dengan fenomena akademik terkini."
      icon={<HugeiconsIcon icon={File01Icon} size={40} />}
    />
  );
}
