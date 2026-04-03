// src/lib/ai-service.ts
import { supabase } from "./supabase";

export const callResearchAI = async (
  topic: string,
  sessionId: string | null = null,
  mode: "brainstorm" | "generate" = "brainstorm",
  selectedTitle?: string
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 40000); // 40s timeout guard

  try {
    const { data, error } = await supabase.functions.invoke("research-builder", {
      body: { 
        topic, 
        sessionId: sessionId || null,
        mode,
        selectedTitle
      },
      headers: {
        "x-client-info": "pharis-ai-frontend",
      },
    });

    if (error) {
      // Return error as data instead of throwing to prevent Next.js dev overlay crash
      const technicalMessage = error.message;
      let status = (error as any).status || (error as any).status_code;
      
      try {
        if (error.context && typeof (error.context as any).json === 'function') {
          const body = await (error.context as any).json();
          if (body.error) return { data: null, error: body.error, status };
        }
      } catch (e) {}

      return { data: null, error: technicalMessage || "Gagal memproses ide riset.", status };
    }

    return { data, error: null, status: 200 };
  } catch (err: any) {
    if (err.name === 'AbortError' || err.message?.includes('abort')) {
      return { data: null, error: "Waktu tunggu habis (Timeout). Server AI sedang padat.", status: 408 };
    }
    return { data: null, error: err.message || "Unknown Error", status: err.status || 500 };
  } finally {
    clearTimeout(timeoutId);
  }
};
