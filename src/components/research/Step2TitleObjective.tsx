// src/components/research/Step2TitleObjective.tsx
import { useState } from "react";
import { useResearchStore } from "@/store/useResearchStore";
import { callResearchAI } from "@/lib/ai-service";

export default function Step2TitleObjective() {
  const { topic, nextStep, updateResearchData, refinedTitle, objectives, sessionId } =
    useResearchStore();
  const [isRefining, setIsRefining] = useState(false);

  const handleRefine = async () => {
    setIsRefining(true);
    try {
      // Step 2: Rumuskan tujuan SMART & Judul (menggunakan sessionId yang sama)
      const result = await callResearchAI(topic, sessionId);
      
      if (result.session) {
        updateResearchData({
          refinedTitle: result.session.refined_title || "",
          objectives: result.session.research_objectives || [],
          bibliography: result.session.bibliography || [],
        });
      }
    } catch (err: any) {
      console.error("Gagal merumuskan tujuan:", err);
      alert(err.message || "Gagal merumuskan tujuan riset.");
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Judul & Tujuan Penelitian</h2>

      {refinedTitle ? (
        <div className="space-y-4 animate-in fade-in">
          <div className="p-4 bg-blue-50 border-l-4 border-blue-500">
            <label className="text-sm font-semibold text-blue-700">
              Usulan Judul:
            </label>
            <p className="text-lg font-medium">{refinedTitle}</p>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-600">
              Tujuan SMART:
            </label>
            <ul className="list-disc ml-5 mt-2 space-y-2">
              {objectives.map((obj, i) => (
                <li key={i} className="text-gray-800">
                  {obj}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleRefine}
              className="text-blue-600 border border-blue-600 px-4 py-2 rounded-lg"
            >
              Generate Ulang
            </button>
            <button
              onClick={nextStep}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg"
            >
              Lanjut ke Struktur Dokumen
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-10">
          <button
            onClick={handleRefine}
            disabled={isRefining}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl shadow-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isRefining
              ? "Merumuskan Tujuan SMART..."
              : "Rumuskan Judul & Tujuan Sekarang"}
          </button>
        </div>
      )}
    </div>
  );
}
