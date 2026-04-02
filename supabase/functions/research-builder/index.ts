import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// Gunakan versi spesifik untuk Google Generative AI
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // WAJIB: Handle CORS preflight untuk browser
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { topic, step } = await req.json();
    const apiKey = Deno.env.get("GEMINI_API_KEY");

    if (!apiKey) throw new Error("API Key Gemini tidak ditemukan di Secrets!");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // ... sisa kode prompt kemarin ...
    const prompt = `Bedah topik ini untuk riset: ${topic}`;
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 400, // Supaya frontend dapet pesan error yang jelas
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
