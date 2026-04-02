// src/components/research/Step1Idea.tsx
import { useState } from "react";
import { useResearchStore } from "@/store/useResearchStore";
import { callResearchAI } from "@/lib/ai-service";

export default function Step1Idea() {
  const { topic, setTopic, nextStep, updateResearchData } = useResearchStore();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!topic) return;
    setIsGenerating(true);
    try {
      // Memanggil Gemini melalui Edge Function
      const result = await callResearchAI(1, topic);
      // Simpan hasil perspektif AI ke metadata atau state sementara
      updateResearchData({ metadata: { perspectives: result } });
      nextStep(); // Lanjut ke Step 2 (Title & Objectives)
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Mulai dengan Ide Riset Anda</h2>
      <p className="text-gray-600">
        PharisAI akan membantu memperjelas ide Anda menjadi penelitian yang
        terarah[cite: 24].
      </p>
      <textarea
        className="w-full p-4 border rounded-lg h-32"
        placeholder="Contoh: Pengaruh AI terhadap produktivitas mahasiswa IT..."
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
      />
      <button
        onClick={handleGenerate}
        disabled={isGenerating || !topic}
        className="bg-blue-600 text-white px-6 py-2 rounded-lg disabled:opacity-50"
      >
        {isGenerating ? "Memproses Ide..." : "Lanjut ke Judul & Tujuan"}
      </button>
    </div>
  );
}
