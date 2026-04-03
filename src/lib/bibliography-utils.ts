import { BibliographyEntry } from "@/types/research";

export function formatBibliographyToAPA(bibliography: BibliographyEntry[]): string {
  if (!bibliography || bibliography.length === 0) return "";

  const sorted = [...bibliography].sort((a, b) => 
    a.authors.localeCompare(b.authors)
  );

  const listItems = sorted.map((entry) => {
    const authors = entry.authors || "Unknown Authors";
    const year = entry.year ? `(${entry.year})` : "(n.d.)";
    const title = entry.title || "Untitled Paper";
    const link = entry.doi ? `https://doi.org/${entry.doi}` : entry.url;

    return `<li class="mb-4 text-slate-700 leading-relaxed">
      <span class="font-bold">${authors}</span> ${year}. 
      <span class="italic">${title}</span>. 
      <a href="${link}" target="_blank" class="text-blue-600 hover:underline break-all">${link}</a>
    </li>`;
  });

  return `<ul class="list-none pl-0 space-y-4">
    ${listItems.join("")}
  </ul>`;
}
