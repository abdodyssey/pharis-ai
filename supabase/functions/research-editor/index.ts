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
    const body = await req.json();
    const { sectionId, userQuery, bibliography } = body;
    
    console.log("Request received for sectionId:", sectionId);

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!geminiApiKey) throw new Error("GEMINI_API_KEY is missing");
    if (!supabaseUrl || !supabaseServiceKey) throw new Error("Supabase config is missing");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // No Auth check as per user request (ga perlu jwt)

    // Fetch section details to confirm existence and get context
    const { data: section, error: sectionError } = await supabase
      .from("research_sections")
      .select("*, research_sessions(*)")
      .eq("id", sectionId)
      .single();

    if (sectionError || !section) {
      console.error("Section Error:", sectionError);
      throw new Error("Section not found");
    }

    const session = section.research_sessions;
    const refinedTitle = session?.refined_title || "Penelitian Tanpa Judul";
    const researchObjectivesList = (session?.research_objectives || []) as Array<{ text?: string } | string>;

    // 1. Prepare Grounding Context
    const paperContext = (bibliography || []).map((p: any, i: number) => 
      `Paper ${i+1}: ${p.title || 'Untitled'}\nPenulis: ${p.authors || 'Unknown'}\nTahun: ${p.year || 'N/A'}\nURL: ${p.url || ''}\nAbstrak: ${p.abstract || 'No abstract available.'}`
    ).join("\n---\n");

    const objectivesText = Array.isArray(researchObjectivesList) 
      ? researchObjectivesList.map((obj, i) => {
          const text = typeof obj === 'string' ? obj : obj.text || '';
          return `${i+1}. ${text}`;
        }).join("\n")
      : String(researchObjectivesList);

    // Section-specific logic (Academic Structures)
    let sectionSpecificPrompt = "";
    const sectionTitle = (section.title || "").toLowerCase();

    if (sectionTitle.includes("pendahuluan")) {
      sectionSpecificPrompt = `
### KHUSUS BAGIAN "PENDAHULUAN" (WAJIB MODEL CARS)
WAJIB: 
1. Move 1: Konteks luas & urgensi (~150 kata).
2. Move 2: Sitasi min 3 paper dari bibliografi.
3. Move 3: Identifikasi Research Gap.
4. Move 4: Research Objectives: "${objectivesText}" dan roadmap.
      `;
    } else if (sectionTitle.includes("pustaka") || sectionTitle.includes("literatur") || sectionTitle.includes("landasan teori")) {
      sectionSpecificPrompt = `
### KHUSUS BAB 2: TINJAUAN PUSTAKA (SYNTHESIS EXPERT)
WAJIB: 
1. Sintesiskan minimal 10-15 jurnal terbaru dalam 3-4 sub-bab tematik.
2. PRE-PROCESSING: Petakan jurnal ke kategori tematik (metode, hasil, atau perdebatan).
3. Pastikan setiap paragraf memiliki minimal 2-3 sitasi yang berbeda (Sintesis Kritis).
4. WAJIB menyebutkan minimal 1 perdebatan atau hasil yang kontradiktif di antara jurnal-jurnal tersebut.
5. Identifikasi Pola 5-10 tahun terakhir dan kaitkan dengan Research Gap riset ini.
      `;
    } else if (sectionTitle.includes("metode") || sectionTitle.includes("metodologi")) {
      sectionSpecificPrompt = `
### KHUSUS BAB 3: METODE PENELITIAN (MOVE TO JUSTIFICATION)
WAJIB: 
1. Komponen: Desain, Sampling, Instrumen, Prosedur, Analisis.
2. "Rule of Why": Justifikasi ilmiah pemilihan metode.
3. Replikabilitas detail.
4. Standar Etis & Past Tense ringkas.
      `;
    }

    const commonRules = `
**ATURAN UMUM:**
- Formal akademik, objektif, tajam.
- Anti-Fluff (400-600 kata).
- Gunakan tag HTML: <h2> untuk sub-header, <p> untuk paragraf.
- JANGAN gunakan markdown.
- Grounding: Gunakan data di Bibliografi, jangan berhalusinasi.
    `;

    // 2. AI Generation
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
Tugas: Perbarui/Tulis bagian "${section.title}" untuk riset berjudul "${refinedTitle}".

Konteks Bibliografi:
${paperContext || "Tidak tersedia."}

Instruksi User:
"${userQuery}"

${sectionSpecificPrompt}
${commonRules}
    `;

    console.log("Calling Gemini API with model: gemini-2.5-flash");
    const result = await model.generateContent(prompt);
    console.log("Gemini API call successful");
    
    const newContent = result.response.text();

    // 3. Update Database
    const { error: updateError } = await supabase
      .from("research_sections")
      .update({ content: newContent })
      .eq("id", sectionId);

    if (updateError) {
      console.error("Database Update Error:", updateError);
      throw updateError;
    }

    return new Response(JSON.stringify({ content: newContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Global Error in Edge Function:", errorMsg);
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 400, // Returning 400 with the error message in the body
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
