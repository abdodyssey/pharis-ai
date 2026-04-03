// src/components/research/Step1Idea.tsx
import { useState } from "react";
import { useResearchStore } from "@/store/useResearchStore";
import { callResearchAI } from "@/lib/ai-service";

export default function Step1Idea() {
  const { topic, setTopic, nextStep, updateResearchData, sessionId } = useResearchStore();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!topic) return;
    setIsGenerating(true);
    try {
      // Memanggil Gemini melalui Edge Function dengan topic dan sessionId (jika ada)
      const result = await callResearchAI(topic, sessionId);
      
      if (result.error) {
        alert("Error: " + result.error);
        return;
      }

      // Sync data returned from Edge Function to store
      if (result.session) {
        updateResearchData({
          sessionId: result.session.id,
          refinedTitle: result.session.refined_title || "",
          objectives: result.session.research_objectives || [],
          bibliography: result.session.bibliography || [],
          currentStep: 2,
        });
      }
      
      nextStep(); // Lanjut ke Step 2 (Title & Objectives)
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Terjadi kesalahan sistem saat memproses ide.");
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
