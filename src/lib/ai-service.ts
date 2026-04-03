// src/lib/ai-service.ts
import { supabase } from "./supabase";

export const callResearchAI = async (
  topic: string,
  sessionId: string | null = null,
) => {
  const session = (await supabase.auth.getSession()).data.session;
  
  if (!session) {
    throw new Error("Sesi tidak ditemukan. Silakan login kembali.");
  }

  const endpoint = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/research-builder`;
  
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    },
    body: JSON.stringify({ 
      topic, 
      sessionId: sessionId || null 
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("AI Service Error Response:", data);
    throw new Error(data.error || `Error ${response.status}: Gagal memproses ide riset.`);
  }

  return data;
};
