import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import OpenAI from "openai";

interface ScholarPaper {
  title: string;
  authors?: { name: string }[];
  year?: number;
  url?: string;
  abstract?: string;
  externalIds?: { DOI?: string };
  venue?: string;
  citationCount?: number;
}

interface AIResult {
  title: string;
  authors: string;
  year: number;
  doi: string;
  url: string;
  summary_relevance: string;
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      console.error("Critical Error: GROQ_API_KEY is missing in .env.local");
      return NextResponse.json({ error: "Penyedia AI (Groq) belum dikonfigurasi. Harap tambahkan GROQ_API_KEY di .env.local." }, { status: 500 });
    }

    const groq = new OpenAI({
      apiKey: groqApiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });

    const modelName = "llama-3.3-70b-versatile";

    const body = await req.json();
    console.log("Fetch References Request:", { userId: user?.id, body });
    
    const { query: searchQuery } = body;

    if (!searchQuery) {
      return NextResponse.json({ error: "query is required" }, { status: 400 });
    }

    // 1. Strategic Keyword Extraction (Multilingual/Recall-Focused)
    let searchVariations: string[] = [searchQuery];
    
    if (searchQuery.length > 30) {
      const queryCompletion = await groq.chat.completions.create({
        model: modelName,
        messages: [
          { 
            role: "system", 
            content: `You are an expert Research Librarian. From the given title, generate 3 distinct English search queries to maximize paper discovery.
            Variation 1: Core Research Pillars (broad).
            Variation 2: Methodology & Impact (medium).
            Variation 3: Specific Context (narrow).
            IGNORE local placeholders like "Universitas X", "Kota Y", "Perusahaan Z".
            Return ONLY a comma-separated list of queries.`
          },
          { role: "user", content: `Research Title: "${searchQuery}"` }
        ],
        temperature: 0.2,
      });
      const aiResponse = queryCompletion.choices[0].message?.content?.trim() || "";
      searchVariations = aiResponse.split(",").map(s => s.trim()).filter(s => s.length > 2);
      // Ensure we keep the original as a variation if it's short
      if (searchVariations.length === 0) searchVariations = [searchQuery];
    }

    // 2. Verified Discovery (Multi-Variation Collection)
    let papers: ScholarPaper[] = [];
    const seenTitles = new Set<string>();

    for (const variation of searchVariations.slice(0, 3)) {
       try {
        const scholarRes = await fetch(
          `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(variation)}&limit=30&fields=title,authors,year,url,externalIds,venue,abstract,citationCount`,
          { headers: { "User-Agent": "PharisAI/1.0" } }
        );
        if (scholarRes.ok) {
          const scholarData = await scholarRes.json();
          const results = scholarData.data || [];
          for (const p of results) {
            const titleLow = p.title.toLowerCase();
            if (!seenTitles.has(titleLow)) {
              seenTitles.add(titleLow);
              papers.push(p);
            }
          }
        }
      } catch (error) {
        console.warn(`Search failed for variation: ${variation}`, error);
      }
      // If we have enough papers, stop searching
      if (papers.length >= 40) break;
    }

    const validPapers = papers.filter(p => p.title && (p.externalIds?.DOI || p.url));

    if (validPapers.length === 0) {
      console.log(">>> [fetch-references] No valid papers found for variations:", searchVariations);
      return NextResponse.json({ 
        error: "Referensi Tidak Ditemukan",
        description: `PharisAI tidak menemukan jurnal yang cocok untuk pencarian: "${searchVariations[0]}". Coba gunakan kata kunci yang lebih luas.`,
        _version: "v3-multisearch",
        _timestamp: new Date().toISOString()
      }, { status: 202 });
    }

    const finalResults: AIResult[] = validPapers.slice(0, 20).map(p => ({
      title: p.title,
      authors: p.authors?.map(a => a.name).join(", ") || "Unknown Authors",
      year: p.year || new Date().getFullYear(),
      doi: p.externalIds?.DOI || "",
      url: p.url || (p.externalIds?.DOI ? `https://doi.org/${p.externalIds.DOI}` : ""),
      summary_relevance: `[Verified] ${p.venue || "Academic Journal"}. Citations: ${p.citationCount || 0}.`
    }));

    return NextResponse.json({ results: finalResults });

  } catch (err: any) {
    console.error("Fetch References Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
