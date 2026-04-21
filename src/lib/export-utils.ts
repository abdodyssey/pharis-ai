import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  BorderStyle,
  WidthType,
  TabStopType
} from "docx";
import { saveAs } from "file-saver";
import { ResearchSession, ResearchSection } from "@/types/research";

export async function exportToDocx(
  session: Partial<ResearchSession>,
  sections: ResearchSection[],
) {
  const { refined_title, initial_topic, keywords, bibliography } = session;
  const sanitizedTitle = refined_title?.substring(0, 30).replace(/[^a-z0-9]/gi, "_") || "Manuscript";

  const sortedBib = [...(bibliography || [])].sort((a, b) => 
    (a.authors || "").localeCompare(b.authors || "")
  );

  const bibParagraphs = sortedBib.map((item, idx) => {
    const title = item.title ? ` ${item.title}.` : "";
    const source = item.doi ? ` https://doi.org/${item.doi}` : (item.url ? ` ${item.url}` : "");
    
    return new Paragraph({
      children: [
        new TextRun({ text: `[${idx + 1}] `, size: 18 }), 
        new TextRun({ text: `${item.authors || "Unknown Authors"}. `, size: 18 }),
        new TextRun({ text: item.year ? `(${item.year}). ` : "", size: 18 }),
        new TextRun({ text: title, italics: true, size: 18 }),
        new TextRun({ text: source, size: 18 }),
      ],
      alignment: AlignmentType.JUSTIFIED,
      indent: { left: 400, hanging: 400 },
      spacing: { line: 240, after: 60 },
    });
  });

  const sectionElements = sections
    .filter((s) => !s.title.toLowerCase().includes("daftar pustaka") && !s.title.toLowerCase().includes("abstrak"))
    .flatMap((section, index) => {
      const cleanContent = (section.content || "")
        .replace(/<\/p>|<\/div>|<\/li>/g, "\n")
        .replace(/<[^>]*>/g, "")
        .trim();

      if (!cleanContent) return [];

      const contentParas = cleanContent.split("\n").filter(Boolean).map((text) => 
        new Paragraph({
          children: [new TextRun({ text, size: 20 })], // 10pt font
          alignment: AlignmentType.JUSTIFIED,
          indent: { firstLine: 400 },
          spacing: { line: 240, after: 120 },
        })
      );

      return [
        new Paragraph({
          children: [
            new TextRun({ 
              text: `${index + 1}. ${section.title}`, 
              bold: true, 
              size: 20 
            })
          ],
          alignment: AlignmentType.LEFT,
          spacing: { before: 240, after: 60 },
        }),
        ...contentParas
      ];
    });

  const abstractSection = sections.find(s => s.title.toLowerCase().includes("abstrak"));
  const abstractText = abstractSection?.content?.replace(/<[^>]*>/g, "").trim() || "";
  const citationKeywords = (keywords || ["AI", "Research"]).join("; ");

  const noBorder = {
    top: { style: BorderStyle.NONE, size: 0, color: "auto" },
    bottom: { style: BorderStyle.NONE, size: 0, color: "auto" },
    left: { style: BorderStyle.NONE, size: 0, color: "auto" },
    right: { style: BorderStyle.NONE, size: 0, color: "auto" },
  };

  const abstractTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorder,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            borders: noBorder,
            margins: { right: 400 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: "ARTICLE INFO", bold: true, size: 18 })],
                spacing: { after: 100 }
              }),
              new Paragraph({ children: [new TextRun({ text: "Article history:", bold: true, size: 16 })] }),
              new Paragraph({ children: [new TextRun({ text: "Received December 7th, 202X", size: 16 })] }),
              new Paragraph({ children: [new TextRun({ text: "Revised February 17th, 202X", size: 16 })] }),
              new Paragraph({ children: [new TextRun({ text: "Accepted June 27th, 202X", size: 16 })] }),
              new Paragraph({ children: [new TextRun({ text: "Available online June 30th, 202X", size: 16 })], spacing: { after: 100 } }),
              
              new Paragraph({ children: [new TextRun({ text: "Keywords:", bold: true, size: 16 })] }),
              // Keywords splitted with semantic new lines as requested by typical template styling
              ...citationKeywords.split(";").map(k => new Paragraph({ children: [new TextRun({ text: k.trim() + ";", size: 16 })] })),
              
              new Paragraph({ children: [new TextRun({ text: "Please cite this article in IEEE style as:", bold: true, size: 16 })], spacing: { before: 100 } }),
              new Paragraph({ children: [new TextRun({ text: `Author, "${refined_title}", Register: Jurnal Ilmiah Teknologi Sistem Informasi, vol. X, no. Y, 202X.`, size: 16 })] }),
            ]
          }),
          new TableCell({
            width: { size: 70, type: WidthType.PERCENTAGE },
            borders: noBorder,
            children: [
              new Paragraph({
                children: [new TextRun({ text: "ABSTRACT", bold: true, size: 18 })],
                alignment: AlignmentType.JUSTIFIED,
                spacing: { after: 50 }
              }),
              new Paragraph({
                children: [new TextRun({ text: abstractText, size: 18 })],
                alignment: AlignmentType.JUSTIFIED,
                spacing: { line: 240 }
              })
            ]
          })
        ]
      })
    ]
  });

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: "Times New Roman" },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        children: [
          // Header info
          new Paragraph({
            children: [
              new TextRun({ text: "11 (1) 2025 54-65", size: 18 }),
              new TextRun({ text: "\tISSN 2502-3357 (online) | ISSN 2503-0477 (print)", size: 18 }),
            ],
            tabStops: [{ type: TabStopType.RIGHT, position: 9000 }],
            spacing: { after: 100 }
          }),
          new Paragraph({
            children: [new TextRun({ text: "Register: Jurnal Ilmiah Teknologi Sistem Informasi", size: 24, bold: true })],
            spacing: { after: 100 },
            alignment: AlignmentType.CENTER
          }),
          new Paragraph({
            children: [new TextRun({ text: "Contents lists available at www.journal.unipdu.ac.id", size: 18 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 }
          }),
          new Paragraph({
            children: [new TextRun({ text: "Journal Page is available to https://journal.unipdu.ac.id/index.php/register/", size: 18 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
          }),
          new Paragraph({
            children: [new TextRun({ text: "Research article", bold: true, size: 18 })],
            alignment: AlignmentType.LEFT,
            spacing: { after: 200 }
          }),
          
          // Title
          new Paragraph({
            children: [
              new TextRun({ 
                text: refined_title || initial_topic || "Untitled Research", 
                bold: true, 
                size: 32 // 16pt
              })
            ],
            alignment: AlignmentType.LEFT,
            spacing: { after: 200 },
          }),
          
          // Authors
          new Paragraph({
            children: [
              new TextRun({ text: "Author Name a, *", size: 20 }),
            ],
            alignment: AlignmentType.LEFT,
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "a Department of Technology, Institution, City, Indonesia.", size: 18 }),
            ],
            alignment: AlignmentType.LEFT,
            spacing: { after: 50 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "email: a,*author@pharis.ai", size: 18 }),
            ],
            alignment: AlignmentType.LEFT,
            spacing: { after: 50 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "* Correspondence", size: 18 }),
            ],
            alignment: AlignmentType.LEFT,
            spacing: { after: 400 },
          }),
          
          // Abstract Table
          abstractTable,

          new Paragraph({ text: "", spacing: { before: 200, after: 200 } }),

          // Body Sections
          ...sectionElements,

          // References
          new Paragraph({
            children: [
              new TextRun({ text: "References", bold: true, size: 20 })
            ],
            alignment: AlignmentType.LEFT,
            spacing: { before: 400, after: 200 },
          }),
          ...bibParagraphs
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const date = new Date().toISOString().split("T")[0];
  const filename = `Register_${sanitizedTitle}_${date}.docx`;
  saveAs(blob, filename);

  return filename;
}
