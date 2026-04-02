// src/components/research/Step3Structure.tsx
import { useState } from "react";
import { useResearchStore } from "@/store/useResearchStore";
import { callResearchAI } from "@/lib/ai-service";
import { parseAcademicStructure } from "@/utils/parser";

export default function Step3Structure() {
  const { refinedTitle, objectives, nextStep, updateResearchData, structure } =
    useResearchStore();
  const [isBuilding, setIsBuilding] = useState(false);

  const handleBuildStructure = async () => {
    setIsBuilding(true);
    try {
      const context = `Judul: ${refinedTitle}. Tujuan: ${objectives.join(", ")}`;
      const result = await callResearchAI(3, context);
      const parsedStructure = parseAcademicStructure(result);

      updateResearchData({ structure: parsedStructure });
    } catch (err) {
      console.error("Gagal membangun struktur:", err);
    } finally {
      setIsBuilding(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Academic Structure Builder</h2>
      <p className="text-gray-600 italic">
        &qoute;Riset yang baik dimulai dari struktur berpikir yang jelas.&quote;
        [cite: 15]
      </p>

      {Object.keys(structure).length > 0 ? (
        <div className="space-y-4">
          {Object.entries(structure).map(([section, content]) => (
            <details
              key={section}
              className="group border rounded-lg p-4 bg-gray-50"
            >
              <summary className="font-bold uppercase cursor-pointer flex justify-between">
                {section}
                <span className="text-blue-600 text-sm font-normal">
                  Lihat Panduan
                </span>
              </summary>
              <div className="mt-4 text-gray-700 whitespace-pre-line text-sm leading-relaxed">
                {content as string}
              </div>
            </details>
          ))}

          <div className="pt-6">
            <button
              onClick={nextStep}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-md"
            >
              Lanjut ke Review & Validasi Orisinalitas
            </button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-blue-200 rounded-2xl p-10 text-center">
          <p className="mb-6 text-gray-500">
            Klik tombol di bawah untuk membangun blueprint akademik lengkap.
          </p>
          <button
            onClick={handleBuildStructure}
            disabled={isBuilding}
            className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-all"
          >
            {isBuilding
              ? "Menyusun Struktur..."
              : "Generate Academic Blueprint"}
          </button>
        </div>
      )}
    </div>
  );
}
