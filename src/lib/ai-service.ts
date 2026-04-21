// src/lib/ai-service.ts
import { supabase } from "./supabase";

/**
 * Enhanced fetch wrapper for local API routes
 */
async function callLocalApi(endpoint: string, body: Record<string, unknown>) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

export const callResearchAI = async (
  topic: string,
  sessionId: string | null = null,
  mode: "brainstorm" | "generate" | "init" | "generate_intro" | "generate_methods" | "generate_literature" | "expand_content" | "generate_results" | "generate_discussion" | "generate_conclusion" | "generate_abstract" | "generate_bibliography" | "generate_synthesis" = "brainstorm",
  selectedTitle?: string
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout guard

  try {
    const data = await callLocalApi("/api/research/builder", { 
      topic, 
      sessionId: sessionId || null,
      mode,
      selectedTitle
    } as any); // Type cast for internal API flex

    return { data, error: null, status: 200 };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Gagal memproses ide riset.";
    if (errorMessage.includes('AbortError') || errorMessage.includes('abort')) {
      return { data: null, error: "Waktu tunggu habis (Timeout). Server AI sedang padat.", status: 408 };
    }
    return { data: null, error: errorMessage, status: 500 };
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Calls the research-editor route handler for section-specific AI operations.
 */
export const callResearchEditor = async (params: {
  currentContent?: string;
  instruction: string;
  sectionTitle: string;
  refinedTitle: string;
  context?: Record<string, unknown>;
}) => {
  try {
    const data = await callLocalApi("/api/research/editor", params as any);
    return { data, error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : "AI generation failed." };
  }
};

/**
 * Calls the research-fetch-references route handler.
 */
export const fetchReferences = async (query: string) => {
  try {
    const data = await callLocalApi("/api/research/search-papers", { query });
    return { data, error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : "Reference search failed." };
  }
};

/**
 * Generates a specific section using the Grounded Writer API.
 */
export const generateSection = async (
  sessionId: string, 
  sectionTitle: string, 
  manuscriptContent?: string
) => {
  try {
    const data = await callLocalApi("/api/research/writer/section", { 
      sessionId, 
      sectionTitle,
      manuscriptContent
    });
    return { data, error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : "Generation failed." };
  }
};

/**
 * Generate an abstract by reading all completed sections.
 */
export const generateAbstract = async (
  refinedTitle: string,
  sections: { title: string; content: string }[],
  bibliography: { authors: string; year?: number; title: string }[]
) => {
  const sectionDigest = sections
    .filter(s => s.content && s.title.toLowerCase() !== 'abstrak' && s.title.toLowerCase() !== 'daftar pustaka')
    .map(s => `## ${s.title}\n${s.content.replace(/<[^>]*>/g, '').substring(0, 800)}`)
    .join("\n\n");

  return callResearchEditor({
    instruction: `Generate a concise academic abstract (150-300 words) for this research manuscript. The abstract must include: Background, Objective, Methods, Key Findings, and Conclusion. Use formal Indonesian academic language. Output ONLY the abstract text in HTML format (use <p> tags).`,
    sectionTitle: "Abstrak",
    refinedTitle,
    context: {
      manuscriptDigest: sectionDigest,
      citations: bibliography.slice(0, 10),
    },
  });
};

/**
 * Generate a conclusion by reading all completed sections.
 */
export const generateConclusion = async (
  refinedTitle: string,
  sections: { title: string; content: string }[],
  objectives: string[]
) => {
  const sectionDigest = sections
    .filter(s => s.content && s.title.toLowerCase() !== 'abstrak' && s.title.toLowerCase() !== 'daftar pustaka' && s.title.toLowerCase() !== 'kesimpulan dan saran')
    .map(s => `## ${s.title}\n${s.content.replace(/<[^>]*>/g, '').substring(0, 800)}`)
    .join("\n\n");

  return callResearchEditor({
    instruction: `Generate the "Kesimpulan dan Saran" (Conclusion and Recommendations) section. 
    1. KESIMPULAN: Summarize key findings that directly address each research objective. 
    2. SARAN: Provide practical recommendations and future research directions.
    Research Objectives: ${objectives.join("; ")}
    Use formal Indonesian academic language. Output in HTML format with <h2> and <p> tags.`,
    sectionTitle: "Kesimpulan dan Saran",
    refinedTitle,
    context: {
      manuscriptDigest: sectionDigest,
    },
  });
};

/**
 * Expand existing section content.
 */
export const expandSection = async (sessionId: string, sectionTitle: string, currentContent: string) => {
  try {
    const data = await callLocalApi("/api/research/builder", { 
      sessionId,
      mode: "expand_content",
      sectionTitle,
      currentContent
    } as any);
    return { data, error: null };
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : "Expansion failed." };
  }
};
