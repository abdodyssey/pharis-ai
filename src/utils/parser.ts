// src/utils/parser.ts
export const parseAIResponse = (text: string) => {
  // Mencari bagian judul dan poin-poin tujuan (biasanya diawali angka/bullet)
  const lines = text.split("\n").filter((line) => line.trim() !== "");
  const title =
    lines.find((l) => l.toLowerCase().includes("judul"))?.split(":")[1]
      ?.trim() || lines[0];
  const objectives = lines.filter((l) => /^\d+\.|\*/.test(l)).map((l) =>
    l.replace(/^\d+\.|\*/, "").trim()
  );

  return { title, objectives };
};

// src/utils/parser.ts (Tambahan)
export const parseAcademicStructure = (text: string) => {
  const sections: Record<string, string> = {};
  const keywords = [
    "introduction",
    "methodology",
    "results",
    "discussion",
    "conclusion",
  ];

  let currentSection = "";
  text.split("\n").forEach((line) => {
    const lowerLine = line.toLowerCase();
    const foundKey = keywords.find((key) => lowerLine.includes(key));

    if (foundKey) {
      currentSection = foundKey;
      sections[currentSection] = "";
    } else if (currentSection) {
      sections[currentSection] += line + "\n";
    }
  });

  return sections;
};
