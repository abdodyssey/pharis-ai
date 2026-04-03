import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "supabase";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { sectionId, userQuery, currentContent, bibliography, refinedTitle } = await req.json();
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!geminiApiKey) throw new Error("GEMINI_API_KEY is missing");
    if (!supabaseUrl || !supabaseServiceKey) throw new Error("Supabase config is missing");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader?.replace("Bearer ", ""));
    if (authError || !user) throw new Error("Unauthorized");

    // Fetch section details to confirm ownership and get context
    const { data: section, error: sectionError } = await supabase
      .from("research_sections")
      .select("*, research_sessions(user_id)")
      .eq("id", sectionId)
      .single();

    if (sectionError || !section) throw new Error("Section not found");

    // 1. Prepare Grounding Context
    const paperContext = bibliography.map((p: { title: string; authors: string; year?: number; url: string }, i: number) => 
      `Paper ${i+1}: ${p.title}\nPenulis: ${p.authors}\nTahun: ${p.year}\nURL: ${p.url}`
    ).join("\n---\n");

    // 2. AI Generation
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
Anda adalah Research Assistant PharisAI. 
Anda sedang mengerjakan bagian: "${section.title}" 
Untuk riset berjudul: "${refinedTitle}"

Konteks Referensi (Bibliography):
${paperContext}

Konten Saat Ini:
${currentContent || "(Belum ada konten)"}

Instruksi User:
"${userQuery}"

Tugas:
1. Perbarui atau tulis ulang konten bagian "${section.title}" berdasarkan instruksi user.
2. WAJIB menggunakan data atau sitasi dari referensi yang disediakan (jika relevan).
3. Gunakan gaya bahasa akademik yang formal dan tajam.
4. Jangan membuat klaim yang tidak ada di referensi.
5. Kembalikan konten lengkap bagian tersebut setelah diperbarui (minimal 2-3 paragraf jika instruksi bersifat general).

Output HARUS hanya berupa teks konten baru (Markdown supported).
    `;

    const result = await model.generateContent(prompt);
    const newContent = result.response.text();

    // 3. Update Database
    const { error: updateError } = await supabase
      .from("research_sections")
      .update({ content: newContent })
      .eq("id", sectionId);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ content: newContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
