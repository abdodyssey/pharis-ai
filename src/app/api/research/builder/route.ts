import { createClient as createServerClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { NextResponse, NextRequest } from "next/server";
import OpenAI from "openai";

function cleanJSON(text: string) {
  if (!text) return { content: "" };
  
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}') + 1;
    
    // If no brackets found, treat the whole thing as content
    if (start === -1 || end <= start) {
      return { content: text.trim() };
    }
    
    const jsonStr = text.substring(start, end);
    return JSON.parse(jsonStr);
  } catch (err) {
    console.warn("JSON Parse Error, falling back to raw content pattern:", err);
    // Ultimate fallback: return the raw text wrapped in the expected key
    return { cont1ent: text.trim() };
  }
}

async function getManuscriptContext(id: string, adminSupabase: any) {
  const { data: session } = await adminSupabase
    .from("research_sessions")
    .select("refined_title, initial_topic, research_objectives, metadata, bibliography")
    .eq("id", id)
    .single();

  const { data: sections } = await adminSupabase
    .from("research_sections")
    .select("title, content")
    .eq("session_id", id)
    .order("order_index", { ascending: true });

  const meta = session?.metadata || {};
  const variables = meta.variables || [];
  
  interface Section {
    title: string;
    content: string;
  }
  
  const fullContent = (sections as Section[] || [])
    .filter((s: Section) => s.content && s.content.length > 50)
    .map((s: Section) => `## ${s.title}\n${s.content.replace(/<[^>]*>/g, '')}`)
    .join("\n\n");

  // Safety Truncate: Preserve only the last ~2500 words to stay within token limits
  const safeContent = fullContent.length > 12000 
    ? `[...perluasan naskah sebelumnya...] \n\n ${fullContent.slice(-12000)}` 
    : fullContent;

  return {
    title: session?.refined_title,
    topic: session?.initial_topic,
    objectives: session?.research_objectives,
    variables,
    metadata: meta,
    bibliography: session?.bibliography || [],
    manuscriptSoFar: safeContent,
    sectionTitles: (sections as Section[] | null)?.map((s: Section) => s.title) || []
  };
}

async function updateSessionCitations(sessionId: string, newCitations: any[], adminSupabase: any) {
  if (!newCitations || !newCitations.length) return;

  const { data: session } = await adminSupabase
    .from("research_sessions")
    .select("metadata")
    .eq("id", sessionId)
    .single();

  const metadata = session?.metadata || {};
  const existingCitations = metadata.used_citations || [];
  
  // Merge and deduplicate by stringifying objects if they are complex, 
  // but let's assume we store the titles or DOI to match easily.
  // Actually, let's store the full bibliography objects that were cited to avoid lookups later.
  
  const updatedCitations = [...existingCitations];
  
  newCitations.forEach(newCit => {
    const exists = updatedCitations.some(ext => 
      (ext.doi && ext.doi === newCit.doi) || 
      (ext.title === newCit.title)
    );
    if (!exists) updatedCitations.push(newCit);
  });
  
  await adminSupabase.from("research_sessions").update({
    metadata: {
      ...metadata,
      used_citations: updatedCitations
    }
  }).eq("id", sessionId);
}

async function getOpenRouterCompletion(messages: any[], model: string) {
  const openrouter = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY || "",
    baseURL: "https://openrouter.ai/api/v1",
    timeout: 60000, 
    maxRetries: 2,
    defaultHeaders: {
      "HTTP-Referer": "https://pharis-ai.app",
      "X-Title": "PharisAI Research Engine",
    }
  });

  return openrouter.chat.completions.create({
    model: model,
    messages: messages,
    max_tokens: 4000, // Reduced to fit within free tier / credit limits
  });
}

async function getGroqCompletion(messages: any[], model: string, useJson: boolean = true) {
  const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY || "",
    baseURL: "https://api.groq.com/openai/v1",
    timeout: 30000,
  });
  return groq.chat.completions.create({
    model: model,
    messages: messages,
    response_format: useJson ? { type: "json_object" } : undefined,
  });
}

async function getGroqCompletionWithFallback(messages: any[], useJson: boolean = true) {
  // USER OVERRIDE: Using Llama 3.3 70B Versatile (MANDATORY)
  try {
    console.log("[AI MODE] Using Exclusive Llama 3.3 70B Versatile via Groq");
    return await getGroqCompletion(messages, "llama-3.3-70b-versatile", useJson);
  } catch (err: any) {
    console.error("[CRITICAL] Llama Versatile Failed:", err.message);
    throw err;
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { topic, sessionId, mode = "brainstorm", selectedTitle, userRevisedQuery } = body;

    if (mode === "brainstorm") {
      const res = await fetch(`https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(topic)}&limit=15&fields=title,authors,year,url,abstract,externalIds`);
      const journalData = await res.json();
      const papers = (journalData.data || []).filter((p: any) => p.abstract);

      const paperContext = papers.map((p: any, i: number) => `Paper ${i+1}: ${p.title}\nAbstract: ${p.abstract.substring(0, 300)}`).join("\n\n");
      
      const userPrompt = sessionId && userRevisedQuery 
        ? `Refine these options: ${userRevisedQuery}\n\nReferences:\n${paperContext}`
        : `Topic: ${topic}\n\nReferences:\n${paperContext}\n\nTask: Generate 3 research titles with gaps.`;

      const chatCompletion = await getGroqCompletionWithFallback([
        { role: "system", content: "You are an academic assistant. Return ONLY a valid JSON object. Indonesian language only. Schema: {\"options\":[{\"title\":\"...\",\"gap\":\"...\",\"rationale\":\"...\"}], \"keywords\": [\"kw1\", \"kw2\"]}" },
        { role: "user", content: userPrompt + "\n\nAs essential requirement: Your response must be in valid json format." }
      ]);

      const responseContent = cleanJSON(chatCompletion.choices[0].message.content || "{}");
      
      return NextResponse.json({ 
        options: responseContent.options || [], 
        keywords: responseContent.keywords || [],
        bibliography: papers.map((p: any) => ({
          title: p.title, 
          authors: p.authors?.map((a: any) => a.name).join(", "),
          year: p.year, 
          url: p.url, 
          doi: p.externalIds?.DOI
        }))
      });

    } else if (mode === "init") {
      const adminSupabase = createAdminClient();
      
      const { data: sessionInfo } = await adminSupabase
        .from("research_sessions")
        .select("bibliography, initial_topic")
        .eq("id", sessionId)
        .single();

      const initPrompt = `Title: ${selectedTitle}\nTopic: ${sessionInfo?.initial_topic}\nGenerate academic Keywords (minimum 5) and SMART Research Objectives (minimum 3) in Indonesian. Return JSON.`;

      const chatCompletion = await getGroqCompletionWithFallback([
        { role: "system", content: "Return ONLY JSON. Schema: {\"keywords\":[\"...\"], \"research_objectives\":[\"...\"]}" },
        { role: "user", content: initPrompt }
      ]);

      const parsed = cleanJSON(chatCompletion.choices[0].message.content || "{}");

      const { data: sessionData } = await adminSupabase.from("research_sessions").update({
        refined_title: selectedTitle,
        research_objectives: parsed.research_objectives || [],
        keywords: parsed.keywords || [],
        current_step: 3,
      }).eq("id", sessionId).select().single();

      const sections = [
        { session_id: sessionId, title: "Abstrak", content: "", order_index: 0 },
        { session_id: sessionId, title: "Pendahuluan", content: "", order_index: 1 },
        { session_id: sessionId, title: "Metode Penelitian", content: "", order_index: 2 },
        { session_id: sessionId, title: "Hasil dan Pembahasan", content: "", order_index: 3 },
        { session_id: sessionId, title: "Kesimpulan dan Saran", content: "", order_index: 4 },
        { session_id: sessionId, title: "Daftar Pustaka", content: "", order_index: 5 },
      ];

      await adminSupabase.from("research_sections").delete().eq("session_id", sessionId);
      await adminSupabase.from("research_sections").insert(sections);

      return NextResponse.json({ session: sessionData });

    } else if (mode === "generate_intro") {
      const adminSupabase = createAdminClient();
      const context = await getManuscriptContext(sessionId, adminSupabase);
      
      const prompt = `
        TITLE: ${context.title}
        TOPIC: ${context.topic}
        OBJECTIVES: ${JSON.stringify(context.objectives)}
        VARIABLES: ${JSON.stringify(context.variables)}
        LITERATURE SOURCES: ${JSON.stringify(context.bibliography.slice(0, 7))}

        TASK: Tuliskan NARASI AKADEMIK YANG MENDALAM DAN UTUH untuk Bab 1: PENDAHULUAN.
        PERSYARATAN:
        - Terdiri dari minimal 4-6 paragraf besar (~500-800 kata).
        - ZERO-OUTLINE RULE: Dilarang menggunakan poin-poin atau placeholder.
        - Fokus pada Hubungan Antar Variabel (${context.variables.map((v: any) => v.name).join(", ")}).
        - HASIL HARUS SIAP PUBLIKASI.

        STRUKTUR (CARS Model):
        1. Context/Hook: Fenomena global/nasional.
        2. Niche/Gap: Sintesis kritis penelitian terdahulu & identifikasi celah.
        3. Occupying Niche: Kontribusi penelitian & tujuan SMART.

        ATURAN: Gunakan Bahasa Indonesia Formal Jurnal SINTA 1. Format HTML (<p>).
      `;

      const chatCompletion = await getGroqCompletionWithFallback([
        { role: "system", content: "Anda adalah Senior Academic Publisher. Tulis narasi Pendahuluan yang utuh, tanpa poin-poin, minimal 500 kata. Identifikasi sumber yang Anda sitasi dari Literature Sources yang diberikan. Return ONLY JSON object with 'content' and 'citations' keys. Citations adalah array of objects dari Literature Sources yang benar-benar Anda gunakan." },
        { role: "user", content: prompt + "\n\nFormat the output as a JSON object with keys 'content' (HTML string) and 'citations' (array of used source objects). Ensure the response is valid json." }
      ]);

      const parsed = cleanJSON(chatCompletion.choices[0].message.content || "{}");
      await adminSupabase.from("research_sections").update({ content: parsed.content }).eq("session_id", sessionId).eq("title", "Pendahuluan");
      
      if (parsed.citations) {
        await updateSessionCitations(sessionId, parsed.citations, adminSupabase);
      }

      return NextResponse.json({ success: true, content: parsed.content });


    } else if (mode === "generate_methods") {
      const adminSupabase = createAdminClient();
      const context = await getManuscriptContext(sessionId, adminSupabase);
      
      const prompt = `
        TITLE: ${context.title}
        OBJECTIVES: ${JSON.stringify(context.objectives)}
        VARIABLES: ${JSON.stringify(context.variables)}
        MEMORY WALL (Previous Chapters):
        ${context.manuscriptSoFar}

        TASK: Tuliskan DETAIL NARASI Bab 3: METODE PENELITIAN.
        CAKUPAN:
        - Target minimal 500 kata.
        - Desain penelitian, instrumen (berdasarkan variabel), teknik pengumpulan data, dan prosedur analisis secara naratif.
        - DILARANG menggunakan poin-poin.
        - Gunakan Bahasa Indonesia Formal. Format HTML (<p>).
      `;

      const chatCompletion = await getGroqCompletionWithFallback([
        { role: "system", content: "Hasilkan Metodologi penelitian yang detail dan naratif (~500 kata). Tanpa poin-poin. Identifikasi sumber yang Anda sitasi. Return ONLY JSON object with 'content' and 'citations' keys." },
        { role: "user", content: prompt + "\n\nFormat the output as a JSON object with keys 'content' (HTML string) and 'citations' (array of used source objects). Ensure the response is valid json." }
      ]);

      const parsed = cleanJSON(chatCompletion.choices[0].message.content || "{}");
      await adminSupabase.from("research_sections").update({ content: parsed.content }).eq("session_id", sessionId).eq("title", "Metode Penelitian");

      if (parsed.citations) {
        await updateSessionCitations(sessionId, parsed.citations, adminSupabase);
      }

      return NextResponse.json({ success: true, content: parsed.content });

    } else if (mode === "expand_content") {
      const adminSupabase = createAdminClient();
      const { sectionTitle, currentContent = "" } = body;
      if (!sectionTitle) return NextResponse.json({ error: "Missing section title" }, { status: 400 });
      
      const context = await getManuscriptContext(sessionId, adminSupabase);
      
      const systemPrompt = "Anda adalah Senior Publisher. Lanjutkan penulisan naskah tanpa pengulangan, fokus pada pendalaman teori dan analisis. Return ONLY JSON object with 'content' key. Gunakan format json.";
      const userPrompt = `
        TITLE: ${context.title}
        CURRENT SECTION: ${sectionTitle}
        EXISTING TEXT REMINDER:
        ${currentContent}

        CONTEXT FROM PREVIOUS CHAPTERS:
        ${context.manuscriptSoFar}

        BIBLIOGRAPHY CONTEXT: ${JSON.stringify(context.bibliography)}

        TASK: LANJUTKAN analisis naskah di atas. Jangan mengulang paragraf yang sudah ada.
        HUBUNGKAN: Hubungkan analisis ini dengan variabel ${context.variables.map((v: any) => v.name).join(", ")} dan literatur yang tersedia.
        TARGET: Tulis tambahan minimal 3-4 paragraf naratif (~300-400 kata).
        GAYA: Akademis, formal, tanpa poin-poin. Format HTML (tag <p>).
      `;

      const chatCompletion = await getGroqCompletionWithFallback([
        { role: "system", content: "Anda adalah Senior Publisher. Lanjutkan penulisan naskah tanpa pengulangan, fokus pada pendalaman teori dan analisis. Identifikasi sumber yang Anda sitasi. Return ONLY JSON object with 'content' and 'citations' keys." },
        { role: "user", content: userPrompt + "\n\nFormat the output as a JSON object with keys 'content' (HTML string) and 'citations' (array of used source objects). Ensure the response is valid json." }
      ]);

      const parsed = cleanJSON(chatCompletion.choices[0].message.content || "{}");
      const combinedContent = `${currentContent}<br/><!-- EXTENSION --><br/>${parsed.content}`;
      
      await adminSupabase.from("research_sections").update({ 
        content: combinedContent 
      }).eq("session_id", sessionId).eq("title", sectionTitle);

      if (parsed.citations) {
        await updateSessionCitations(sessionId, parsed.citations, adminSupabase);
      }

      return NextResponse.json({ success: true, content: combinedContent });
    } else if (mode === "generate_results") {
      const adminSupabase = createAdminClient();
      const context = await getManuscriptContext(sessionId, adminSupabase);
      
      const prompt = `
        TITLE: ${context.title}
        VARIABLES: ${JSON.stringify(context.variables)}
        MEMORY WALL: ${context.manuscriptSoFar}

        TASK: Simulasikan analisis data penelitian ini secara DETAIL. 
        Hasilkan draf BAB 4: HASIL PENELITIAN.
        PERSYARATAN:
        - Fokus pada penyajian temuan objektif berdasarkan variabel.
        - NARASI UTUH, minimal 500-700 kata.
        - Gunakan HTML (p, strong, table jika perlu untuk visualisasi data sintetis).
        - ZERO-OUTLINE RULE: Gunakan paragraf penjelas yang kuat.
      `;

      const chatCompletion = await getGroqCompletionWithFallback([
        { role: "system", content: "Anda adalah Ilmuwan Data dan Penulis Akademik. Laporkan temuan secara objektif dan mendalam (~600 kata). Identifikasi sumber pendukung yang Anda sitasi. Return ONLY JSON object with 'content' and 'citations' keys." },
        { role: "user", content: prompt + "\n\nFormat the output as a JSON object with keys 'content' (HTML string) and 'citations' (array of used source objects). Ensure the response is valid json." }
      ]);

      const parsed = cleanJSON(chatCompletion.choices[0].message.content || "{}");
      await adminSupabase.from("research_sections").update({ content: parsed.content }).eq("session_id", sessionId).eq("title", "Hasil dan Pembahasan");

      if (parsed.citations) {
        await updateSessionCitations(sessionId, parsed.citations, adminSupabase);
      }

      return NextResponse.json({ success: true, content: parsed.content });

    } else if (mode === "generate_discussion") {
      const adminSupabase = createAdminClient();
      const context = await getManuscriptContext(sessionId, adminSupabase);
      
      const prompt = `
        TITLE: ${context.title}
        VARIABLES: ${JSON.stringify(context.variables)}
        MEMORY WALL (Including Results):
        ${context.manuscriptSoFar}

        TASK: Tuliskan NARASI UTUH BAB 5: PEMBAHASAN (Discussion).
        PERSYARATAN:
        - Berikan interpretasi atas hasil, hubungkan dengan landasan teori di bab sebelumnya.
        - Jelaskan implikasi temuan terhadap bidang ilmu terkait.
        - Target minimal 600-800 kata.
        - DILARANG menggunakan poin-poin.
        - Gunakan sitasi dari Literature Vault secara aktif untuk mendukung argumen.
      `;

      const chatCompletion = await getGroqCompletionWithFallback([
        { role: "system", content: "Anda adalah Senior Scholar. Berikan diskusi kritis yang mendalam dan naratif (~800 kata). Identifikasi sumber yang Anda sitasi dari Literature Vault. Return ONLY JSON object with 'content' and 'citations' keys." },
        { role: "user", content: prompt + "\n\nFormat the output as a JSON object with keys 'content' (HTML string) and 'citations' (array of used source objects). Ensure the response is valid json." }
      ]);

      const parsed = cleanJSON(chatCompletion.choices[0].message.content || "{}");
      
      const { data: section } = await adminSupabase.from("research_sections").select("content").eq("session_id", sessionId).eq("title", "Hasil dan Pembahasan").single();
      const updatedContent = `${section?.content}<br/><br/><h2>Diskusi</h2>${parsed.content}`;
      
      await adminSupabase.from("research_sections").update({ 
        content: updatedContent 
      }).eq("session_id", sessionId).eq("title", "Hasil dan Pembahasan");

      if (parsed.citations) {
        await updateSessionCitations(sessionId, parsed.citations, adminSupabase);
      }

      return NextResponse.json({ success: true, content: updatedContent });

    } else if (mode === "generate_conclusion") {
      const adminSupabase = createAdminClient();
      const context = await getManuscriptContext(sessionId, adminSupabase);

      const prompt = `
        TITLE: ${context.title}
        OBJECTIVES: ${JSON.stringify(context.objectives)}
        MEMORY WALL (Full Manuscript):
        ${context.manuscriptSoFar}

        TASK: Tuliskan BAB 5: KESIMPULAN DAN SARAN secara NARATIF dan MENDALAM.
        PERSYARATAN:
        - Berikan ringkasan temuan yang menjawab tujuan penelitian.
        - Berikan saran kebijakan atau penelitian selanjutnya dalam bentuk paragraf mengalir.
        - Target minimal 400-500 kata.
        - DILARANG menggunakan poin-poin.
      `;

      const chatCompletion = await getGroqCompletionWithFallback([
        { role: "system", content: "Anda adalah Senior Scholar. Tulis kesimpulan kritis dan naratif (~500 kata). Tanpa poin-poin. Identifikasi sumber jika ada. Return ONLY JSON object with 'content' and 'citations' keys." },
        { role: "user", content: prompt + "\n\nFormat the output as a JSON object with keys 'content' (HTML string) and 'citations' (array of used source objects). Ensure the response is valid json." }
      ]);

      const parsed = cleanJSON(chatCompletion.choices[0].message.content || "{}");
      await adminSupabase.from("research_sections").update({ content: parsed.content }).eq("session_id", sessionId).eq("title", "Kesimpulan dan Saran");

      if (parsed.citations) {
        await updateSessionCitations(sessionId, parsed.citations, adminSupabase);
      }

      return NextResponse.json({ success: true, content: parsed.content });

    } else if (mode === "generate_abstract") {
      const adminSupabase = createAdminClient();
      const context = await getManuscriptContext(sessionId, adminSupabase);

      const prompt = `
        TITLE: ${context.title}
        MEMORY WALL (Full Manuscript Digest):
        ${context.manuscriptSoFar.substring(0, 5000)}

        TASK: Tulis ABSTRAK penelitian secara FORMAL (1 paragraf utama, Bahasa Indonesia).
        PERSYARATAN:
        - Harus mencakup: Latar Belakang, Tujuan, Metode, Hasil Utama, dan Kesimpulan.
        - Panjang 250-300 kata.
        - NARASI UTUH (Single Paragraph).
      `;

      const chatCompletion = await getGroqCompletionWithFallback([
        { role: "system", content: "Hasilkan abstrak akademik formal dalam satu paragraf utuh (~300 kata). Return ONLY JSON object with 'content' key. Gunakan format json." },
        { role: "user", content: prompt + "\n\nFormat the output as a JSON object with the key 'content' containing the HTML string. Ensure the response is valid json." }
      ]);

      const parsed = cleanJSON(chatCompletion.choices[0].message.content || "{}");
      await adminSupabase.from("research_sections").update({ content: parsed.content }).eq("session_id", sessionId).eq("title", "Abstrak");

      return NextResponse.json({ success: true, content: parsed.content });
    } else if (mode === "generate_bibliography") {
      const adminSupabase = createAdminClient();
      
      // 1. Fetch Session Metadata (Title, Literature Vault, Aggregated Citations)
      const { data: session } = await adminSupabase
        .from("research_sessions")
        .select("refined_title, bibliography, initial_topic, metadata")
        .eq("id", sessionId)
        .single();
      
      // 2. Fetch Section Context (Full Manuscript for Scanning as Fallback)
      const context = await getManuscriptContext(sessionId, adminSupabase);
      const bibItemsInVault = session?.bibliography as any[] || [];
      const aggregatedCitations = session?.metadata?.used_citations as any[] || [];

      // 3. Construct "Grounded Librarian" Prompt
      const prompt = `
        RESEARCH TITLE: ${session?.refined_title}
        
        CONFIRMED CITED SOURCES (Aggregated from each step):
        ${JSON.stringify(aggregatedCitations)}

        MANUSCRIPT CONTENT (SCAN TARGET - FALLBACK):
        ${context.manuscriptSoFar.slice(-8000)}

        LITERATURE VAULT (RELIABLE METADATA):
        ${JSON.stringify(bibItemsInVault)}

        TASK: Susun DAFTAR PUSTAKA berbasis APA 7th Edition.
        ATURAN KETAT:
        1. PRIORITAS: Gunakan daftar "CONFIRMED CITED SOURCES" sebagai daftar utama.
        2. SCANNING: Periksa naskah (MANUSCRIPT CONTENT) untuk menemukan sitasi tambahan yang mungkin terlewat.
        3. MATCHING: Hanya masukkan referensi jika sumber tersebut TERSEDIA di LITERATURE VAULT.
        4. ANTI-HALLUCINATION: DILARANG mengarang referensi.
        5. FORMAT: Kembalikan dalam format HTML <ul> dan <li>. Urutkan secara alfabetis.

        Return ONLY a JSON object: {"content": "<ul><li>...</li></ul>"}
      `;

      console.log(`[BIBLIOGRAPHY] Using ${aggregatedCitations.length} aggregated sources and scanning fallback.`);

      const chatCompletion = await getGroqCompletionWithFallback([
        { role: "system", content: "Anda adalah Academic Librarian yang sangat teliti. Anda menyusun daftar pustaka berdasarkan sumber yang dikonfirmasi dan hasil scan naskah. Return ONLY JSON." },
        { role: "user", content: prompt }
      ]);

      const parsed = cleanJSON(chatCompletion.choices[0].message.content || "{}");

      // 4. Persistence
      await adminSupabase.from("research_sections").update({ 
        content: parsed.content 
      }).eq("session_id", sessionId).eq("title", "Daftar Pustaka");

      return NextResponse.json({ success: true, content: parsed.content });
    }

    return NextResponse.json({ error: "Unsupported mode" }, { status: 400 });

  } catch (err: any) {
    console.error("Research Builder Error Details:", {
      message: err.message,
      status: err.status,
      name: err.name
    });

    if (err.status === 429 || err.message?.includes("429")) {
      return NextResponse.json({ 
        error: "429: AI sedang mencapai batas kuota pemrosesan. Harap tunggu 1 menit." 
      }, { status: 429 });
    }

    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
