import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { topic, sessionId, mode = "brainstorm", selectedTitle } = await req
      .json();

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!geminiApiKey || !supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Auth Check
    const authHeader = req.headers.get("Authorization");
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader?.replace("Bearer ", ""),
    );
    if (authError || !user) throw new Error("Unauthorized");

    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    if (mode === "brainstorm") {
      // 1. Fetch Semantic Scholar (Initial Search - Limit 15)
      const fetchPapers = async (query: string, limit = 15) => {
        const ssUrl = `https://api.semanticscholar.org/graph/v1/paper/search?query=${
          encodeURIComponent(query)
        }&limit=${limit}&fields=title,authors,year,url,abstract,externalIds`;
        const ssRes = await fetch(ssUrl);
        const ssData = await ssRes.json();
        return (ssData.data || []).filter((p: any) => p.abstract);
      };

      let papers = await fetchPapers(topic, 15);

      // Recursive Search if < 15
      if (papers.length < 15) {
        console.log(`Only found ${papers.length} papers. Triggering recursive search...`);
        const synonymPrompt = `Generate 3 specific academic synonyms or related keywords for the research topic: "${topic}". Output only a JSON array of strings: ["keyword1", "keyword2", "keyword3"]`;
        const synonymResult = await model.generateContent(synonymPrompt);
        const synonyms = JSON.parse(synonymResult.response.text().replace(/```json/g, "").replace(/```/g, "").trim());
        
        for (const keyword of synonyms) {
          if (papers.length >= 15) break;
          const extraPapers = await fetchPapers(keyword, 10);
          // Merge avoiding duplicates
          for (const p of extraPapers) {
            if (!papers.some((existing: any) => existing.title === p.title) && papers.length < 15) {
              papers.push(p);
            }
          }
        }
      }

      const prompt = `Role: Senior AI Engineer (Specialist in Academic RAG).
Topic: ${topic}
References: ${JSON.stringify(papers)}

Task:
Berdasarkan referensi jurnal, temukan research gap dan berikan 3 opsi judul yang berbeda karakter:
1. Satu fokus ke efektivitas/implementasi.
2. Satu fokus ke tantangan/kritik.
3. Satu fokus ke masa depan/inovasi.

Output MUST be valid JSON:
{
  "options": [
    { "title": "string", "gap": "string", "rationale": "string" }
  ]
}`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text().replace(/```json/g, "")
        .replace(/```/g, "").trim();
      const { options } = JSON.parse(responseText);

      // Process bibliography safely (no undefined)
      const bibliography = papers.map((p: any) => ({
        title: p.title || "Untitled",
        authors: p.authors?.map((a: any) => a.name).join(", ") || "Unknown",
        year: p.year || new Date().getFullYear(),
        url: p.url || "",
        abstract: p.abstract || "",
        doi: p.externalIds?.DOI || null,
      }));

      return new Response(JSON.stringify({ options, bibliography }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (mode === "generate") {
      // Fetch session to get bibliography and initial topic
      const { data: sessionInfo, error: fetchError } = await supabase
        .from("research_sessions")
        .select("bibliography, initial_topic")
        .eq("id", sessionId)
        .single();
      
      if (fetchError) throw fetchError;

      // Phase 2: Generate objectives and drafts for SELECTED title
      const prompt = `Role: Senior AI Engineer (Specialist in Academic RAG).
Selected Title: ${selectedTitle}
Initial Topic: ${sessionInfo.initial_topic}
References: ${JSON.stringify(sessionInfo.bibliography || [])}

Task:
1. Generate 3-5 SMART research_objectives.
2. Write initial HTML drafts for:
   - "introduction": Background & Gap (CARS Model).
   - "literature_review": 
     * INSTRUCTIONS: Sintesiskan minimal 10-15 jurnal terbaru yang ada di referensi dalam 3-4 sub-bab tematik.
     * PRE-PROCESSING: Petakan jurnal ke kategori tematik (misal: metode, hasil, perdebatan).
     * NARRATIVE: Pastikan setiap paragraf memiliki minimal 2-3 sitasi berbeda (Sintesis Kritis).
     * CONTRADICTION: Wajib menyebutkan minimal 1 perdebatan atau hasil yang kontradiktif di antara jurnal tersebut.
   - "methods": Proposed approach & Justification.

Output MUST be valid JSON:
{
  "research_objectives": ["string"],
  "drafts": {
    "introduction": "html",
    "literature_review": "html",
    "methods": "html"
  }
}`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text().replace(/```json/g, "")
        .replace(/```/g, "").trim();
      const { research_objectives, drafts } = JSON.parse(responseText);

      // Ensure objectives is a real array
      const objectives = Array.isArray(research_objectives) ? research_objectives : [];

      console.log("Saving Research Session result to DB...");
      const { data: sessionData, error: sessionError } = await supabase
        .from("research_sessions")
        .update({
          refined_title: selectedTitle,
          research_objectives: objectives,
          current_step: 3,
        })
        .eq("id", sessionId)
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Insert sections (Include Daftar Pustaka)
      const bibItems = (sessionData.bibliography || []).map((p: any) => {
        const link = p.doi ? `https://doi.org/${p.doi}` : p.url;
        return `<li><strong>${p.authors}</strong> (${p.year}). <em>${p.title}</em>. <a href="${link}" target="_blank">${link}</a></li>`;
      });
      const bibHtml = `<ul class="space-y-4">${bibItems.join("")}</ul>`;

      const sections = [
        {
          session_id: sessionId,
          title: "Pendahuluan",
          content: drafts.introduction || "",
          order_index: 0,
        },
        {
          session_id: sessionId,
          title: "Tinjauan Pustaka",
          content: drafts.literature_review || "",
          order_index: 1,
        },
        {
          session_id: sessionId,
          title: "Metode Penelitian",
          content: drafts.methods || "",
          order_index: 2,
        },
        {
          session_id: sessionId,
          title: "Daftar Pustaka",
          content: bibItems.length > 0 ? bibHtml : "",
          order_index: 6,
        },
      ];

      console.log("Resetting and inserting new sections...");
      await supabase.from("research_sections").delete().eq(
        "session_id",
        sessionId,
      );
      const { error: sectionsError } = await supabase.from("research_sections")
        .insert(sections);
      if (sectionsError) throw sectionsError;

      return new Response(JSON.stringify({ session: sessionData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid mode" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    let status = 400;
    let message = error.message;

    console.error("Research Builder Error:", message);

    // Detect Gemini API Rate Limit or Quota issues
    if (message.includes("429") || message.toLowerCase().includes("quota") || message.toLowerCase().includes("limit")) {
      status = 429;
      message = "Kapasitas AI sedang penuh atau mencapai limit harian. Mohon tunggu beberapa menit atau coba lagi nanti.";
    }

    return new Response(JSON.stringify({ error: message }), {
      status: status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
