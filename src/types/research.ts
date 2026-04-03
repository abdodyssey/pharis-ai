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

export interface BibliographyEntry {
  title: string;
  authors: string;
  year?: number;
  url: string;
  doi?: string;
  full_paper_url?: string;
  abstract?: string;
}

export interface TitleOption {
  title: string;
  gap: string;
  rationale: string;
}

export interface ResearchSession {
  id: string; // UUID dari database
  user_id: string;
  initial_topic: string; // Ide awal dari user
  refined_title: string | null; // Judul hasil olahan AI
  research_objectives: string[]; // Array tujuan SMART
  academic_structure: AcademicStructure; // Blueprint IMRaD/Struktur
  bibliography: BibliographyEntry[]; // Grounded research papers
  current_step: ResearchStep; // Tracking progres 1-5
  is_completed: boolean;
  title_options: TitleOption[]; // 3 options for Step 2
  metadata?: Record<string, unknown>; // Data tambahan non-sensitif
  created_at: string;
  updated_at: string;
}

export interface ResearchSection {
  id: string;
  session_id: string;
  title: string;
  content: string;
  order_index: number;
}

export interface AIResponse {
  session?: ResearchSession;
  references?: BibliographyEntry[];
  error?: string;
}
