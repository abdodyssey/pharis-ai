import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import {
  AcademicStructure,
  BibliographyEntry,
  ResearchSection,
  ResearchSession,
  ResearchStep,
  TitleOption,
} from "@/types/research";
import { formatBibliographyToAPA } from "@/lib/bibliography-utils";

interface ResearchState {
  // Core Data
  sessionId: string | null;
  currentStep: ResearchStep;
  topic: string;
  refinedTitle: string;
  objectives: string[];
  structure: AcademicStructure;
  bibliography: BibliographyEntry[];
  sections: ResearchSection[];
  activeSectionId: string | null;
  titleOptions: TitleOption[];
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
  fetchSections: (sessionId: string) => Promise<void>;
  setActiveSectionId: (id: string | null) => void;
  updateSectionInStore: (sectionId: string, content: string) => void;
  saveSectionToDb: (sectionId: string, content: string) => Promise<void>;
  updateResearchData: (data: Partial<ResearchState>) => void;
  initializeIMRADSections: (sessionId: string) => Promise<void>;
  ensureIMRADStructure: () => Promise<void>;
  syncBibliographyToSection: () => Promise<void>;
  saveToDb: () => Promise<void>;
  resetStore: () => void;
}

const FIXED_IMRAD = [
  'Abstrak',
  'Pendahuluan',
  'Tinjauan Pustaka',
  'Metode Penelitian',
  'Hasil dan Pembahasan',
  'Kesimpulan dan Saran',
  'Daftar Pustaka'
];

export const useResearchStore = create<ResearchState>((set, get) => ({
  sessionId: null,
  currentStep: 1, 
  topic: "",
  refinedTitle: "",
  objectives: [],
  structure: {},
  bibliography: [],
  sections: [],
  activeSectionId: null,
  titleOptions: [],
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
      bibliography: session.bibliography || [],
      titleOptions: session.title_options || [],
      metadata: session.metadata || {},
      currentStep: session.current_step as ResearchStep,
      isLoading: false,
    });

    // Also fetch sections automatically
    get().fetchSections(session.id);
  },

  fetchSections: async (sessionId: string) => {
    const { data, error } = await supabase
      .from("research_sections")
      .select("*")
      .eq("session_id", sessionId)
      .order("order_index", { ascending: true });

    if (!error && data) {
      set({ 
        sections: data as ResearchSection[],
      });
      // Jika belum ada active section, set ke yang pertama
      if (!get().activeSectionId && data.length > 0) {
        set({ activeSectionId: data[0].id });
      }
    }
  },

  setActiveSectionId: (id) => set({ activeSectionId: id }),

  updateSectionInStore: (sectionId, content) => {
    set((state) => ({
      sections: state.sections.map((s) =>
        s.id === sectionId ? { ...s, content } : s
      ),
    }));
  },

  saveSectionToDb: async (sectionId: string, content: string) => {
    const { error } = await supabase
      .from("research_sections")
      .update({ content })
      .eq("id", sectionId);

    if (error) {
      console.error("Gagal auto-save section:", error.message);
    }
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
      bibliography,
      titleOptions,
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
        bibliography: bibliography,
        title_options: titleOptions,
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

  initializeIMRADSections: async (sessionId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const sectionsToInsert = FIXED_IMRAD.map((title, index) => ({
        session_id: sessionId,
        title,
        content: "",
        order_index: index,
      }));

      const { data, error } = await supabase
        .from("research_sections")
        .insert(sectionsToInsert)
        .select();

      if (error) throw error;

      set({ 
        sections: data as ResearchSection[],
        currentStep: 3,
        activeSectionId: data[0]?.id || null,
        isLoading: false 
      });
      
      await get().saveToDb();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      set({ error: errorMsg, isLoading: false });
    }
  },

  ensureIMRADStructure: async () => {
    const { sessionId, sections } = get();
    if (!sessionId) return;

    const missingTitles = FIXED_IMRAD.filter(
      (title) => !sections.some((s) => s.title.toLowerCase() === title.toLowerCase())
    );

    if (missingTitles.length === 0) {
      // Still sync bib if everything exists
      await get().syncBibliographyToSection();
      return;
    }

    const sectionsToInsert = missingTitles.map((title) => ({
      session_id: sessionId,
      title,
      content: "",
      order_index: FIXED_IMRAD.indexOf(title),
    }));

    const { error } = await supabase.from("research_sections").insert(sectionsToInsert);
    if (!error) {
      await get().fetchSections(sessionId);
      await get().syncBibliographyToSection();
    }
  },

  syncBibliographyToSection: async () => {
    const { sessionId, bibliography, sections, updateSectionInStore, saveSectionToDb } = get();
    if (!sessionId || bibliography.length === 0) return;

    const bibSection = sections.find(
      (s) => s.title.toLowerCase() === "daftar pustaka"
    );

    if (!bibSection) return;

    const apaContent = formatBibliographyToAPA(bibliography);
    
    // Only update if content is currently empty OR truly different (to avoid loop or overwrite)
    if (!bibSection.content || bibSection.content.length < 50) { 
      updateSectionInStore(bibSection.id, apaContent);
      await saveSectionToDb(bibSection.id, apaContent);
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
      bibliography: [],
      sections: [],
      activeSectionId: null,
      titleOptions: [],
      metadata: {},
      isLoading: false,
      error: null,
    }),
}));
