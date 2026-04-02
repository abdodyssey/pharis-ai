// src/components/research/Step4Review.tsx
import { useResearchStore } from "@/store/useResearchStore";

export default function Step4Review() {
  const { refinedTitle, objectives, structure, nextStep, prevStep } =
    useResearchStore();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Final Review</h2>
      <p className="text-gray-600">
        Tinjau kembali struktur riset Anda sebelum diekspor ke format dokumen.
      </p>

      <div className="space-y-4 border-t pt-4">
        <section>
          <h3 className="font-semibold text-blue-600">Judul Penelitian</h3>
          <p className="text-lg">{refinedTitle || "Belum ditentukan"}</p>
        </section>

        <section>
          <h3 className="font-semibold text-blue-600">
            Tujuan Penelitian (SMART)
          </h3>
          <ul className="list-disc ml-5">
            {objectives.map((obj, i) => (
              <li key={i}>{obj}</li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="font-semibold text-blue-600">Kerangka Akademik</h3>
          <p className="text-sm text-gray-500 italic">
            Struktur IMRaD telah disusun berdasarkan tujuan riset[cite: 28].
          </p>
        </section>
      </div>

      <div className="flex gap-4 pt-6">
        <button
          onClick={prevStep}
          className="flex-1 px-4 py-3 border rounded-xl hover:bg-gray-50"
        >
          Revisi Struktur
        </button>
        <button
          onClick={nextStep}
          className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold"
        >
          Siap Ekspor
        </button>
      </div>
    </div>
  );
}
