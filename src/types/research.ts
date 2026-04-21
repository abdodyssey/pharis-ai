// src/types/research.ts

export type ResearchStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

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
  summary_relevance?: string;
  storage_path?: string;
  local_file_name?: string;
}

export interface TitleOption {
  title: string;
  gap: string;
  rationale: string;
  keywords?: string[];
}

export interface ResearchProgress {
  id: string;
  session_id: string;
  step_number: ResearchStep;
  step_name: string;
  status: 'locked' | 'active' | 'completed';
  completed_at: string | null;
  metadata: Record<string, unknown>;
}

export interface VariableDefinition {
  id: string;
  name: string;
  type: 'independent' | 'dependent' | 'control';
  description: string;
  indicator?: string;
}

export interface HypothesisDefinition {
  id: string;
  statement: string;
  type: 'H0' | 'H1';
}

export interface OutlineNode {
  id: string;
  title: string;
  children: OutlineNode[];
}

export interface ResearchSession {
  id: string; // UUID dari database
  user_id: string;
  initial_topic: string; // Ide awal dari user
  refined_title: string | null; // Judul hasil olahan AI
  keywords: string[]; // Academic keywords
  research_objectives: string[]; // Array tujuan SMART
  academic_structure: AcademicStructure; // Blueprint IMRaD/Struktur
  bibliography: BibliographyEntry[]; // Grounded research papers
  current_step: ResearchStep; // Tracking progres 1-7
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

// Step configuration constants
export const RESEARCH_STEPS = [
  { number: 1 as ResearchStep, name: 'Ideation', label: 'Research Idea', description: 'Eksplorasi celah dan urgensi penelitian' },
  { number: 2 as ResearchStep, name: 'Titling', label: 'Title & Objectives', description: 'Penajaman judul dan tujuan penelitian' },
  { number: 3 as ResearchStep, name: 'LiteratureVault', label: 'Literature Vault', description: 'Pencarian dan pengunduhan referensi akademik' },
] as const;

export const MIN_REFERENCES_REQUIRED = 5;
export const MIN_WORDS_PER_SECTION = 100;
