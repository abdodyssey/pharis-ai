// src/types/research.ts

export type ResearchStep = 1 | 2 | 3 | 4 | 5;

export interface AcademicStructure {
  introduction?: string;
  literatureReview?: string;
  methodology?: string;
  results?: string;
  discussion?: string;
  conclusion?: string;
  references?: string[];
}

export interface ResearchSession {
  id: string; // UUID dari database [cite: 17, 33]
  user_id: string;
  initial_topic: string; // Ide awal dari user
  refined_title: string | null; // Judul hasil olahan AI [cite: 25, 26]
  research_objectives: string[]; // Array tujuan SMART
  academic_structure: AcademicStructure; // Blueprint IMRaD/Struktur
  current_step: ResearchStep; // Tracking progres 1-5 [cite: 19, 20, 21, 22, 33]
  is_completed: boolean;
  metadata?: Record<string, unknown>; // Data tambahan non-sensitif [cite: 57]
  created_at: string;
  updated_at: string;
}

export interface AIResponse {
  text: string; // Output mentah dari Gemini [cite: 5]
  error?: string;
}
