import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import {
  AcademicStructure,
  ResearchSession,
  ResearchStep,
} from "@/types/research";

interface ResearchState {
  // Core Data
  sessionId: string | null;
  currentStep: ResearchStep;
  topic: string;
  refinedTitle: string;
  objectives: string[];
  structure: AcademicStructure;
  metadata?: Record<string, unknown>;
  isLoading: boolean;
  error: string | null;

  // UI & Data Actions
  setTopic: (topic: string) => void;
  setSessionId: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (message: string | null) => void;

  // Navigation dengan Auto-Sync
  nextStep: () => Promise<void>;
  prevStep: () => void;
  goToStep: (step: ResearchStep) => void;

  // Database Operations
  fetchSession: (id: string) => Promise<void>;
  updateResearchData: (data: Partial<ResearchState>) => void;
  saveToDb: () => Promise<void>;
  resetStore: () => void;
}

export const useResearchStore = create<ResearchState>((set, get) => ({
  sessionId: null,
  currentStep: 1, // 1: Idea, 2: Title/Obj, 3: Structure, 4: Review, 5: Export [cite: 19, 20, 21, 22, 33]
  topic: "",
  refinedTitle: "",
  objectives: [],
  structure: {},
  metadata: {},
  isLoading: false,
  error: null,

  setTopic: (topic) => set({ topic }),
  setSessionId: (id) => set({ sessionId: id }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (message) => set({ error: message }),

  updateResearchData: (data) => set((state) => ({ ...state, ...data })),

  // Ambil data sesi yang sudah ada dari Supabase
  fetchSession: async (id: string) => {
    set({ isLoading: true, error: null });
    const { data, error } = await supabase
      .from("research_sessions")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      set({ error: error.message, isLoading: false });
      return;
    }

    const session = data as ResearchSession;
    set({
      sessionId: session.id,
      topic: session.initial_topic,
      refinedTitle: session.refined_title || "",
      objectives: session.research_objectives || [],
      structure: session.academic_structure || {},
      metadata: session.metadata || {},
      currentStep: session.current_step as ResearchStep,
      isLoading: false,
    });
  },

  nextStep: async () => {
    const { currentStep, saveToDb } = get();
    if (currentStep < 5) {
      set({ currentStep: (currentStep + 1) as ResearchStep });
      await saveToDb(); // Persistence: Simpan progres setiap pindah tahap
    }
  },

  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 1) {
      set({ currentStep: (currentStep - 1) as ResearchStep });
    }
  },

  goToStep: (step: ResearchStep) => set({ currentStep: step }),

  // Simpan seluruh state ke Postgres (Supabase)
  saveToDb: async () => {
    const {
      sessionId,
      currentStep,
      topic,
      refinedTitle,
      objectives,
      structure,
      metadata,
    } = get();

    if (!sessionId) return;

    const { error } = await supabase
      .from("research_sessions")
      .update({
        initial_topic: topic,
        refined_title: refinedTitle,
        research_objectives: objectives,
        academic_structure: structure,
        metadata: metadata,
        current_step: currentStep,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    if (error) {
      console.error("Expert Log: Sync to DB failed", error.message);
      set({ error: "Gagal menyimpan progres ke database." });
    }
  },

  resetStore: () =>
    set({
      sessionId: null,
      currentStep: 1,
      topic: "",
      refinedTitle: "",
      objectives: [],
      structure: {},
      metadata: {},
      isLoading: false,
      error: null,
    }),
}));
