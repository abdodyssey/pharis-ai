// src/components/research/Step5Export.tsx
import { useResearchStore } from "@/store/useResearchStore";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { saveAs } from "file-saver";

export default function Step5Export() {
  const { refinedTitle, objectives, structure } = useResearchStore();

  const generateDocx = async () => {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({ text: refinedTitle, heading: HeadingLevel.TITLE }),
            new Paragraph({
              text: "Research Objectives",
              heading: HeadingLevel.HEADING_1,
              spacing: { before: 400 },
            }),
            ...objectives.map(
              (obj) =>
                new Paragraph({ text: `• ${obj}`, bullet: { level: 0 } }),
            ),

            ...Object.entries(structure).flatMap(([section, content]) => [
              new Paragraph({
                text: section.toUpperCase(),
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 400 },
              }),
              new Paragraph({ children: [new TextRun(content as string)] }),
            ]),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `PharisAI_${refinedTitle.replace(/\s+/g, "_")}.docx`);
  };

  return (
    <div className="text-center space-y-8 py-10">
      <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
        <svg
          className="w-10 h-10 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <div>
        <h2 className="text-3xl font-bold text-gray-900">
          Riset Siap Digunakan!
        </h2>
        <p className="text-gray-600 mt-2">
          Struktur riset Anda telah divalidasi dan siap untuk penulisan lebih
          lanjut[cite: 15].
        </p>
      </div>

      <button
        onClick={generateDocx}
        className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-bold shadow-xl transition-all flex items-center justify-center mx-auto gap-2"
      >
        <span>Unduh File .docx</span>
      </button>
    </div>
  );
}
