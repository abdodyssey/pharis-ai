import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7"; // Versi spesifik

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { topic, sessionId } = await req.json();
    
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!geminiApiKey) {
      console.error("Error: Missing GEMINI_API_KEY");
      throw new Error("Edge Function configuration error: Missing Gemini API Key");
    }
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Error: Missing Supabase System Variables", { supabaseUrl: !!supabaseUrl, supabaseServiceKey: !!supabaseServiceKey });
      throw new Error("Edge Function configuration error: Missing Supabase System variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Auth Check
    const authHeader = req.headers.get("Authorization");
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader?.replace("Bearer ", ""));
    if (authError || !user) throw new Error("Unauthorized");

    // 1. Fetch Semantic Scholar (Simplified)
    const ssUrl = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(topic)}&limit=5&fields=title,authors,year,url,abstract`;
    
    let papers = [];
    try {
      const ssRes = await fetch(ssUrl);
      const ssData = await ssRes.json();
      papers = (ssData.data || []).filter((p: any) => p.abstract);
    } catch (e) {
      console.log("SS Fetch failed, using AI only.");
    }

    // 2. Gemini Generation
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Topic: ${topic}\nReferences: ${JSON.stringify(papers)}\n
    Generate JSON with "refined_title" and "research_objectives" (3-5 items).`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI output was not JSON");
    
    const { refined_title, research_objectives } = JSON.parse(jsonMatch[0]);

    // 3. Bibliography Formatting
    const bibliography = papers.map((p: any) => ({
      title: p.title,
      authors: p.authors?.map((a: any) => a.name).join(", ") || "Unknown",
      year: p.year || 2026,
      url: p.url
    }));

    // 4. SMART UPSERT (Fix Error non-2xx)
    // Cek apakah sessionId valid (UUID format biasanya 36 karakter)
    const isValidSession = sessionId && sessionId.length > 30;

    let res;
    if (isValidSession) {
      console.log("Updating session:", sessionId);
      res = await supabase
        .from("research_sessions")
        .update({
          refined_title,
          research_objectives,
          bibliography,
          current_step: 2
        })
        .eq("id", sessionId)
        .select()
        .single();
    } else {
      console.log("Inserting new session");
      res = await supabase
        .from("research_sessions")
        .insert({
          user_id: user.id,
          initial_topic: topic,
          refined_title,
          research_objectives,
          bibliography,
          current_step: 2
        })
        .select()
        .single();
    }

    if (res.error) throw res.error;

    return new Response(JSON.stringify({ session: res.data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});