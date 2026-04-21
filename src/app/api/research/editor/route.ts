import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import OpenAI from "openai";

interface BibItem {
  authors: string;
  year?: string | number;
  title: string;
  summary?: string;
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

async function getGroqCompletion(messages: any[], model: string) {
  const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY || "",
    baseURL: "https://api.groq.com/openai/v1",
    timeout: 20000,
  });
  return groq.chat.completions.create({
    model: model,
    messages: messages,
  });
}

async function getOpenRouterCompletion(messages: any[], model: string) {
  const openrouter = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY || "",
    baseURL: "https://openrouter.ai/api/v1",
    timeout: 60000,
    maxRetries: 2,
    defaultHeaders: {
      "HTTP-Referer": "https://pharis-ai.app",
      "X-Title": "PharisAI Research Editor",
    }
  });
  return openrouter.chat.completions.create({
    model: model,
    messages: messages,
    max_tokens: 4000,
  });
}

async function getGroqCompletionWithFallback(messages: any[]) {
  // USER OVERRIDE: Using Llama 3.3 70B Versatile (MANDATORY)
  try {
    console.log("[EDITOR MODE] Using Exclusive Llama 3.3 70B Versatile via Groq");
    return await getGroqCompletion(messages, "llama-3.3-70b-versatile");
  } catch (err: any) {
    console.error("[CRITICAL] Editor Llama Versatile Failed:", err.message);
    throw err;
  }
}

    const body = await req.json();
    console.log("Research Editor Request:", { userId: user?.id, body });

    const { 
      currentContent, 
      instruction, 
      sectionTitle, 
      context, 
      refinedTitle 
    } = body;

    const isChatMode = context?.isChatMode === true;
    const isResultsBab4 = context?.isResultsBab4 === true;
    const isMethodologyBab3 = context?.isMethodologyBab3 === true;
    const isThematicBab2 = context?.isThematicBab2 === true;
    const isCarsMode = context?.isCarsIntro === true;
    const selectedCitations: BibItem[] = context?.citations || [];
    const rawData = context?.rawData || "No raw data provided.";

    // 1. Prepare Grounding Context
    const citationData = selectedCitations.map((p, i) => {
      return `[REF ${i + 1}] SOURCE: ${p.authors} (${p.year}). TITLE: "${p.title}". CONTEXT: ${p.summary || "Journal info."}`;
    }).join("\n\n");

    // 2. Specialized System Prompts
    let systemPrompt = "";
    let userPromptWrapper = "";

    if (isChatMode) {
      systemPrompt = `Anda adalah "Senior Academic Peer-Reviewer & Editor". 
TUGAS: Membantu user merevisi naskah berdasarkan instruksi chat.
KONTEKS SAAT INI: 
- Judul Riset: "${refinedTitle}"
- Nama Bagian: "${sectionTitle}"
- Konten Saat Ini (Draft): "${currentContent || 'Empty'}"
- Referensi Relevan: ${citationData}

ATURAN:
1. Jika user meminta revisi, berikan hasil revisi yang siap dipasang (TIDAK ADA basa-basi di awal). Nilai kebenaran akademis adalah prioritas.
2. Gunakan Bahasa Indonesia Formal Akademik (EYD).
3. Jika instruksi tidak jelas, minta klarifikasi secara singkat.
4. JANGAN mengubah struktur dasar kecuali diminta.`;

      userPromptWrapper = `PESAN USER: "${instruction}"`;
    } else if (isResultsBab4) {
      systemPrompt = `Anda adalah "Asisten Pelaporan Data Ilmiah". 
TUGAS: Mengubah DATA MENTAH menjadi narasi Bab 4 (Hasil) secara sistematis.
ZERO INTERPRETATION: Hanya sajikan FAKTA (misal: "Data menunjukkan...", "Terdapat kenaikan...").
Visual Placeholders: Gunakan [MASUKKAN TABEL X DI SINI] untuk statistik kompleks.
Bahasa: Indonesia Formal Akademik. 600-800 kata.`;

      userPromptWrapper = `Judul: "${refinedTitle}". Data Mentah: "${rawData}"`;
    } else if (isMethodologyBab3) {
      systemPrompt = `Anda adalah Senior Research Methodology Consultant spesialis Bab 3.`;
      userPromptWrapper = `Judul: "${refinedTitle}". Refs: ${citationData}.`;
    } else if (isThematicBab2) {
      systemPrompt = `Anda adalah Elite Academic Synthesis Expert spesialis Bab 2.`;
      userPromptWrapper = `Judul: "${refinedTitle}". Refs: ${citationData}.`;
    } else if (isCarsMode) {
      systemPrompt = `Anda adalah Elite Academic Strategist spesialis Model CARS.`;
      userPromptWrapper = `Judul: "${refinedTitle}". Refs: ${citationData}.`;
    } else {
      systemPrompt = `Anda adalah Senior Academic Editor. Sintesiskan referensi dengan kritis.`;
      userPromptWrapper = `Judul: "${refinedTitle}". Refs: ${citationData}. Instruksi: "${instruction}"`;
    }

    // 3. AI Execution
    const chatCompletion = await getGroqCompletionWithFallback([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPromptWrapper },
    ]);

    const finalContent = chatCompletion.choices[0].message?.content?.trim() || "";
    if (!finalContent) throw new Error("AI failed to produce results.");

    return NextResponse.json({ content: finalContent });

  } catch (err: any) {
    console.error("Research Editor Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
