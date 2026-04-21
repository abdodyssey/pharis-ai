import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { sessionId, sectionTitle, manuscriptContent } = await req.json();

    const { data: session, error: sessError } = await supabase
      .from("research_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (sessError || !session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    const bibliography = session.bibliography || [];
    const groundingContext = bibliography.map((ref: any, i: number) => (
      `Source [${i+1}]: ${ref.title} (${ref.year}). Context: ${ref.abstract || ref.summary_relevance || "N/A"}`
    )).join("\n\n");

    const groq = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });

    // Dynamic Prompting based on Section Title
    const sectionType = sectionTitle.toLowerCase();
    let promptInstruction = "";

    if (sectionType.includes("abstrak")) {
      promptInstruction = `Generate a concise academic abstract (150-250 words) based on the provided manuscript content. 
      The abstract must include: 1) Research background/context, 2) Research objectives, 3) Methodology used, 4) Summary of key findings, and 5) Conclusion/Implication.
      Use formal Indonesian (Baku). Do not cite sources in the abstract unless it's common practice for this title: "${session.refined_title}".
      
      MANUSCRIPT CONTENT TO SUMMARIZE:
      ${manuscriptContent || "No content provided yet. Please summarize based on objectives and bibliography."}`;
    } else if (sectionType.includes("metode")) {
      promptInstruction = `Write a professional "Metode Penelitian" section. 
      Focus on justifying the research design, participants, instruments, and data analysis procedures.
      Use professional Indonesian (Baku). Do not include actual data results yet. 
      Base the approach on the requirements of the title: "${session.refined_title}".`;
    } else if (sectionType.includes("pendahuluan")) {
      promptInstruction = `Write a formal research introduction (Pendahuluan) using the CARS Model. 
      Mandatory: Cite at least 3-4 sources from the grounding list in (Author, Year) format.`;
    } else if (sectionType.includes("hasil") || sectionType.includes("pembahasan")) {
      promptInstruction = `Write a sample "Hasil dan Pembahasan" section. 
      If actual data is missing, focus on the expected narrative and theoretical discussion grounded in the provided sources. 
      Analyze how the results relate to or differ from previous research in the grounding list.`;
    } else if (sectionType.includes("kesimpulan")) {
      promptInstruction = `Write a "Kesimpulan dan Saran" section. 
      Summarize the findings and provide actionable recommendations based on the study's objectives: ${session.research_objectives?.join(", ")}.`;
    } else {
      promptInstruction = `Write the "${sectionTitle}" section of an academic paper titled "${session.refined_title}".`;
    }

    const fullPrompt = `
      RESEARCH CONTEXT:
      Title: "${session.refined_title}"
      Objectives: ${session.research_objectives?.join(", ")}
      
      SECTION TO WRITE: "${sectionTitle}"
      
      INSTRUCTIONS:
      ${promptInstruction}
      - Language: Formal Indonesian.
      - Formatting: Markdown (paragraphs only, no bolding titles).
      - Grounding: Only use or cite from the sources below. No hallucinations.
      
      GROUNDING SOURCES:
      ${groundingContext}
      
      Draft the ${sectionTitle}:
    `;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are a grounded academic writer. You follow the user instructions and provide verified content." },
        { role: "user", content: fullPrompt }
      ],
      temperature: 0.3,
    });

    return NextResponse.json({ content: completion.choices[0].message?.content || "" });

  } catch (err: any) {
    console.error("Writer API Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
