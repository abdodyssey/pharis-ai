// src/lib/ai-service.ts
import { supabase } from "./supabase";

export const callResearchAI = async (
  step: number,
  topic: string,
  prevOutput?: any,
) => {
  const { data, error } = await supabase.functions.invoke("research-builder", {
    body: { topic, step, previousOutput: prevOutput },
  });

  if (error) throw error;
  return data.text;
};
