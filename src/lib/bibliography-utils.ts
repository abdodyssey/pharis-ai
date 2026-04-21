import { BibliographyEntry } from "@/types/research";

/**
 * APA 7th Formatter: Transforming raw reference objects into professional citations.
 * Template: Nama Belakang, Inisial. (Tahun). Judul Artikel. URL/DOI
 */
export function formatToAPA(entry: BibliographyEntry): string {
  // Defensive logic: Ensure authors is a valid string for splitting
  const rawAuthors = entry.authors || "";
  const authorsString = Array.isArray(rawAuthors) 
    ? rawAuthors.join(", ") 
    : String(rawAuthors);

  const authorList = authorsString.split(/,\s*|;\s*/).filter(Boolean);
  let authorText = "";

  if (authorList.length === 0) {
    authorText = "Anonim";
  } else if (authorList.length === 1) {
    authorText = formatSingleAuthor(authorList[0]);
  } else if (authorList.length === 2) {
    authorText = `${formatSingleAuthor(authorList[0])} & ${formatSingleAuthor(authorList[1])}`;
  } else {
    // Indonesian Thesis Standard: > 2 authors use "et al."
    authorText = `${formatSingleAuthor(authorList[0])}, et al.`;
  }

  const year = entry.year ? `(${entry.year})` : "(n.d.)";
  const title = (entry.title || "Untitled").trim();
  const displayTitle = title.endsWith('.') ? title : `${title}.`;
  const link = entry.doi ? `https://doi.org/${entry.doi}` : (entry.url || "");

  return `<p class="bib-item">${authorText} ${year}. <i>${displayTitle}</i> ${link}</p>`;
}

/**
 * Formats a full name to "Last Name, I."
 */
function formatSingleAuthor(fullName: string): string {
  if (!fullName) return "";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return parts[0] || "";
  const lastName = parts[parts.length - 1];
  const firstInitial = parts[0].charAt(0).toUpperCase();
  return `${lastName}, ${firstInitial}.`;
}

/**
 * Main Synchronization Utility: Sorts A-Z and aggregates all formatted citations.
 */
export function formatBibliographyToAPA(bibliography: BibliographyEntry[]): string {
  if (!bibliography || bibliography.length === 0) {
    return `<p class="text-slate-400 italic">Belum ada referensi yang ditambahkan ke pustaka.</p>`;
  }

  // Alpha Sorting: Compare the last name of the first author
  const sorted = [...bibliography].sort((a, b) => {
    const getSortKey = (authorsElem: string | string[]) => {
      const authorsStr = Array.isArray(authorsElem) 
        ? authorsElem.join(", ") 
        : String(authorsElem || "");
        
      const firstAuthor = authorsStr.split(/,\s*|;\s*/)[0]?.trim() || "";
      const parts = firstAuthor.split(/\s+/);
      return (parts[parts.length - 1] || "").toLowerCase();
    };
    return getSortKey(a.authors).localeCompare(getSortKey(b.authors));
  });

  return sorted.map(entry => formatToAPA(entry)).join("\n");
}

