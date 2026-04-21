import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import {
  AcademicStructure,
  BibliographyEntry,
  ResearchSection,
  ResearchSession,
  ResearchStep,
  ResearchProgress,
  TitleOption,
  VariableDefinition,
  HypothesisDefinition,
  OutlineNode,
  MIN_REFERENCES_REQUIRED,
  MIN_WORDS_PER_SECTION,
  RESEARCH_STEPS,
} from "@/types/research";
import { formatBibliographyToAPA } from "@/lib/bibliography-utils";

// Helper: count words in HTML
export function getWordCountFromHTML(html: string): number {
  if (!html) return 0;
  const text = html
    .replace(/<[^>]*>/g, " ") // Remove tags
    .replace(/&nbsp;/g, " ") // Remove non-breaking spaces
    .replace(/\s+/g, " ") // Collapse whitespace
    .trim();
  return text ? text.split(/\s+/).length : 0;
}

// Helper: check for citations (Author, Year) or [DOI]
export function hasCitations(html: string): boolean {
  if (!html) return false;
  const text = html.replace(/<[^>]*>/g, " ");
  // Support: (Author, 2023), Author (2023), [1], doi.org
  const pattern = /[\w\s.&]+\(\d{4}\)|\([\w\s.\-]+,\s?\d{4}\)|\[\d+\]|doi\.org/i;
  return pattern.test(text);
}

interface ResearchState {
  // Core Data
  sessionId: string | null;
  currentStep: ResearchStep;
  topic: string;
  refinedTitle: string;
  keywords: string[];
  objectives: string[];
  structure: AcademicStructure;
  bibliography: BibliographyEntry[];
  sections: ResearchSection[];
  activeSectionId: string | null;
  titleOptions: TitleOption[];
  metadata?: Record<string, unknown>;
  selectedReferenceIndices: number[];
  isLoading: boolean;
  saveStatus: "idle" | "saving" | "saved";
  error: string | null;

  // 7-Step Progress
  progress: ResearchProgress[];

  // Step 3: Blueprint
  outlineNodes: OutlineNode[];

  // Step 5: Data Lab
  variables: VariableDefinition[];
  hypotheses: HypothesisDefinition[];
  rawDataNotes: string;

  // UI & Data Actions
  setTopic: (topic: string) => void;
  setSessionId: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (message: string | null) => void;

  // Navigation dengan Gating
  nextStep: () => Promise<void>;
  prevStep: () => void;
  goToStep: (step: ResearchStep) => void;
  canAccessStep: (step: ResearchStep) => boolean;

  // Progress Tracking
  fetchProgress: (sessionId: string) => Promise<void>;
  initializeProgress: (sessionId: string) => Promise<void>;
  completeStep: (stepNumber: ResearchStep) => Promise<void>;

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
  addReference: (entry: BibliographyEntry) => Promise<void>;
  addBatchReferences: (entries: BibliographyEntry[]) => Promise<void>;
  removeAllReferences: () => Promise<void>;
  deleteReference: (index: number) => Promise<void>;
  toggleReferenceSelection: (index: number) => void;
  clearSelectedReferences: () => void;
  saveToDb: () => Promise<void>;

  // Step 3: Outline
  setOutlineNodes: (nodes: OutlineNode[]) => void;

  // Step 5: Data Lab
  setVariables: (vars: VariableDefinition[]) => void;
  setHypotheses: (hyps: HypothesisDefinition[]) => void;
  setRawDataNotes: (notes: string) => void;
  saveDataLabToDb: () => Promise<void>;

  deleteSession: () => Promise<void>;
  resetStore: () => void;
}

const FIXED_IMRAD = [
  'Abstrak',
  'Pendahuluan',
  'Metode Penelitian',
  'Hasil dan Pembahasan',
  'Kesimpulan dan Saran',
  'Daftar Pustaka'
];

// Module-scoped lock to prevent concurrent ensureIMRADStructure calls
let _ensureStructureLock = false;

export const useResearchStore = create<ResearchState>((set, get) => ({
  sessionId: null,
  currentStep: 1, 
  topic: "",
  refinedTitle: "",
  keywords: [],
  objectives: [],
  structure: {},
  bibliography: [],
  sections: [],
  activeSectionId: null,
  titleOptions: [],
  metadata: {},
  selectedReferenceIndices: [],
  isLoading: false,
  saveStatus: "idle",
  error: null,
  progress: [],
  outlineNodes: [],
  variables: [],
  hypotheses: [],
  rawDataNotes: "",

  setTopic: (topic) => set({ topic }),
  setSessionId: (id) => set({ sessionId: id }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (message) => set({ error: message }),

  updateResearchData: (data) => set((state) => ({ ...state, ...data })),

  canAccessStep: (step: ResearchStep): boolean => {
    const { progress, currentStep } = get();

    // Step 1 is always accessible
    if (step === 1) return true;

    // Direct access to previous steps is allowed
    if (step <= currentStep) return true;

    // Check if the target step's status is active or completed in virtual progress
    const stepProgress = progress.find(p => p.step_number === step);
    return stepProgress?.status === 'active' || stepProgress?.status === 'completed';
  },

  // ─── Progress Tracking (Virtual via Metadata) ──────────────────
  initializeProgress: async (sessionId: string) => {
    const virtualProgress: ResearchProgress[] = RESEARCH_STEPS.map((s, i) => ({
      id: `${sessionId}-${s.number}`,
      session_id: sessionId,
      step_number: s.number,
      step_name: s.name,
      status: i === 0 ? 'active' : 'locked',
      completed_at: null,
      metadata: {},
    }));

    set({ progress: virtualProgress });
    
    // Save to metadata in research_sessions
    const { metadata } = get();
    await get().updateResearchData({ 
      metadata: { ...metadata, virtualProgress } 
    });
    await get().saveToDb();
  },

  fetchProgress: async (sessionId: string) => {
    const { metadata } = get();
    if (metadata?.virtualProgress) {
      set({ progress: metadata.virtualProgress as ResearchProgress[] });
    } else {
      // Fallback: Initialize if missing
      await get().initializeProgress(sessionId);
    }
  },

  completeStep: async (stepNumber: ResearchStep) => {
    const { sessionId, progress, metadata } = get();
    if (!sessionId) return;

    // Update virtual progress
    const updatedProgress = progress.map(p => {
      if (p.step_number === stepNumber) {
        return { ...p, status: 'completed' as const, completed_at: new Date().toISOString() };
      }
      // Unlock next step
      if (p.step_number === (stepNumber + 1) as ResearchStep) {
        return { ...p, status: 'active' as const };
      }
      return p;
    });

    set({ progress: updatedProgress });
    
    // Persist to session metadata
    await get().updateResearchData({ 
      metadata: { ...metadata, virtualProgress: updatedProgress },
      currentStep: (stepNumber < RESEARCH_STEPS.length ? stepNumber + 1 : stepNumber) as ResearchStep
    });
    await get().saveToDb();
  },

  // ─── Session Fetching ──────────────────────────────────────────
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
    const meta = (session.metadata || {}) as Record<string, unknown>;
    
    set({
      sessionId: session.id,
      topic: session.initial_topic,
      refinedTitle: session.refined_title || "",
      keywords: session.keywords || [],
      objectives: session.research_objectives || [],
      structure: session.academic_structure || {},
      bibliography: session.bibliography || [],
      titleOptions: session.title_options || [],
      metadata: meta,
      currentStep: session.current_step as ResearchStep,
      // Restore Step 3/5 data from metadata
      outlineNodes: (meta.outlineNodes as OutlineNode[]) || [],
      variables: (meta.variables as VariableDefinition[]) || [],
      hypotheses: (meta.hypotheses as HypothesisDefinition[]) || [],
      rawDataNotes: (meta.rawDataNotes as string) || "",
      isLoading: false,
    });

    // Also fetch sections and progress automatically
    get().fetchSections(session.id);
    get().fetchProgress(session.id);
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
    set({ saveStatus: "saving" });
    const { error } = await supabase
      .from("research_sections")
      .update({ content })
      .eq("id", sectionId);

    if (error) {
      console.error("Gagal auto-save section:", error.message);
      set({ saveStatus: "idle" });
    } else {
      set({ saveStatus: "saved" });
      setTimeout(() => set({ saveStatus: "idle" }), 2000);
    }
  },

  nextStep: async () => {
    const { currentStep, saveToDb } = get();
    if (currentStep < RESEARCH_STEPS.length) {
      const next = (currentStep + 1) as ResearchStep;
      if (get().canAccessStep(next)) {
        set({ currentStep: next });
        await saveToDb();
      }
    }
  },

  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 1) {
      set({ currentStep: (currentStep - 1) as ResearchStep });
    }
  },

  goToStep: (step: ResearchStep) => {
    if (get().canAccessStep(step)) {
      set({ currentStep: step });
      get().saveToDb();
    }
  },

  // ─── Database Persistence ──────────────────────────────────────
  saveToDb: async () => {
    const {
      sessionId,
      currentStep,
      topic,
      refinedTitle,
      keywords,
      objectives,
      structure,
      bibliography,
      titleOptions,
      metadata,
      outlineNodes,
      variables,
      hypotheses,
      rawDataNotes,
    } = get();

    if (!sessionId) return;

    // Merge step-specific data into metadata
    const enrichedMetadata = {
      ...metadata,
      outlineNodes,
      variables,
      hypotheses,
      rawDataNotes,
    };

    const { error } = await supabase
      .from("research_sessions")
      .update({
        initial_topic: topic,
        refined_title: refinedTitle,
        keywords: keywords,
        research_objectives: objectives,
        academic_structure: structure,
        bibliography: bibliography,
        title_options: titleOptions,
        metadata: enrichedMetadata,
        current_step: currentStep,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    if (error) {
      console.error("Expert Log: Sync to DB failed", error.message);
      set({ error: "Gagal menyimpan progres ke database." });
    }
  },

  // ─── Blueprint / Outline ───────────────────────────────────────
  setOutlineNodes: (nodes) => set({ outlineNodes: nodes }),

  // ─── Data Lab ──────────────────────────────────────────────────
  setVariables: (vars) => set({ variables: vars }),
  setHypotheses: (hyps) => set({ hypotheses: hyps }),
  setRawDataNotes: (notes) => set({ rawDataNotes: notes }),

  saveDataLabToDb: async () => {
    const { sessionId, variables, hypotheses, rawDataNotes, metadata } = get();
    if (!sessionId) return;

    const enrichedMetadata = {
      ...metadata,
      variables,
      hypotheses,
      rawDataNotes,
    };

    const { error } = await supabase
      .from("research_sessions")
      .update({ metadata: enrichedMetadata, updated_at: new Date().toISOString() })
      .eq("id", sessionId);

    if (error) {
      console.error("Failed to save Data Lab:", error.message);
    }
  },

  // ─── IMRAD Sections ────────────────────────────────────────────
  initializeIMRADSections: async (sessionId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      // IDEMPOTENT: Always delete existing sections first to prevent duplicates
      await supabase
        .from("research_sections")
        .delete()
        .eq("session_id", sessionId);

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

    // GUARD: Prevent concurrent execution
    if (_ensureStructureLock) return;
    _ensureStructureLock = true;

    try {
      // Re-fetch from DB to get the true state (avoids stale local data)
      const { data: dbSections, error: fetchErr } = await supabase
        .from("research_sections")
        .select("*")
        .eq("session_id", sessionId)
        .order("order_index", { ascending: true });

      if (fetchErr) return;

      const existing = dbSections || [];
      const existingTitles = existing.map(s => s.title.toLowerCase());

      const missingTitles = FIXED_IMRAD.filter(
        (title) => !existingTitles.includes(title.toLowerCase())
      );

      // --- Cleanup: Remove sections that are NO LONGER in FIXED_IMRAD (orphaned) ---
      const orphanedSections = existing.filter(
        (s) => !FIXED_IMRAD.map(t => t.toLowerCase()).includes(s.title.toLowerCase())
      );

      if (orphanedSections.length > 0) {
        const idsToDelete = orphanedSections.map(s => s.id);
        await supabase.from("research_sections").delete().in("id", idsToDelete);
        // Refresh the list after deletion
        const { data: updatedDbSections } = await supabase
          .from("research_sections")
          .select("*")
          .eq("session_id", sessionId)
          .order("order_index", { ascending: true });
        
        if (updatedDbSections) {
          set({ sections: updatedDbSections as ResearchSection[] });
          // If the active section was one we just deleted, reset it
          if (get().activeSectionId && idsToDelete.includes(get().activeSectionId!)) {
            set({ activeSectionId: updatedDbSections[0]?.id || null });
          }
        }
        
        // Re-calculate after cleanup
        return get().ensureIMRADStructure(); 
      }

      // Detect duplicates: if more sections than expected, do a clean reset
      if (existing.length > FIXED_IMRAD.length) {
        console.warn("Duplicate sections detected. Performing clean reset.");

        // Preserve content from existing sections by title match
        const contentMap: Record<string, string> = {};
        for (const s of existing) {
          const key = s.title.toLowerCase();
          // Keep the first (or longest-content) version
          if (!contentMap[key] || (s.content || "").length > (contentMap[key] || "").length) {
            contentMap[key] = s.content || "";
          }
        }

        // Delete all and re-insert clean
        await supabase.from("research_sections").delete().eq("session_id", sessionId);

        const cleanSections = FIXED_IMRAD.map((title, index) => ({
          session_id: sessionId,
          title,
          content: contentMap[title.toLowerCase()] || "",
          order_index: index,
        }));

        const { data: freshData } = await supabase
          .from("research_sections")
          .insert(cleanSections)
          .select();

        if (freshData) {
          set({ sections: freshData as ResearchSection[] });
        }

        await get().syncBibliographyToSection();
        return;
      }

      if (missingTitles.length === 0) {
        // All good — just sync sections to store if needed
        if (existing.length !== sections.length) {
          set({ sections: existing as ResearchSection[] });
        }
        await get().syncBibliographyToSection();
        return;
      }

      // Insert only truly missing sections
      const sectionsToInsert = missingTitles.map((title) => ({
        session_id: sessionId,
        title,
        content: "",
        order_index: FIXED_IMRAD.indexOf(title),
      }));

      const { error: insertErr } = await supabase
        .from("research_sections")
        .insert(sectionsToInsert);

      if (!insertErr) {
        await get().fetchSections(sessionId);
        await get().syncBibliographyToSection();
      }
    } finally {
      _ensureStructureLock = false;
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

  addReference: async (entry: BibliographyEntry) => {
    const { sessionId, bibliography } = get();
    if (!sessionId) return;
    const newBibliography = [...bibliography, entry];
    set({ bibliography: newBibliography });
    const { error } = await supabase.from("research_sessions").update({ bibliography: newBibliography }).eq("id", sessionId);
    if (!error) await get().syncBibliographyToSection();
    else set({ bibliography });
  },

  addBatchReferences: async (entries: BibliographyEntry[]) => {
    const { sessionId, bibliography } = get();
    if (!sessionId || entries.length === 0) return;

    // Filter out duplicates based on title (case insensitive)
    const existingTitles = new Set(bibliography.map(b => b.title.toLowerCase()));
    const newItems = entries.filter(e => !existingTitles.has(e.title.toLowerCase()));
    
    if (newItems.length === 0) return;

    const newBibliography = [...bibliography, ...newItems];
    set({ bibliography: newBibliography });

    // Sync to Database
    const { error } = await supabase
      .from("research_sessions")
      .update({ bibliography: newBibliography })
      .eq("id", sessionId);

    if (!error) {
      await get().syncBibliographyToSection();
    } else {
      set({ error: "Failed to add batch. Rollback initiated." });
      set({ bibliography });
    }
  },

  removeAllReferences: async () => {
    const { sessionId } = get();
    if (!sessionId) return;

    set({ bibliography: [] });

    // Sync to Database
    const { error } = await supabase
      .from("research_sessions")
      .update({ bibliography: [] })
      .eq("id", sessionId);

    if (!error) {
      await get().syncBibliographyToSection();
    } else {
      set({ error: "Failed to clear vault." });
    }
  },

  deleteReference: async (index: number) => {
    const { sessionId, bibliography } = get();
    if (!sessionId) return;

    const newBibliography = bibliography.filter((_, i) => i !== index);
    set({ bibliography: newBibliography });

    // Sync to Database
    const { error } = await supabase
      .from("research_sessions")
      .update({ bibliography: newBibliography })
      .eq("id", sessionId);

    if (!error) {
      // Force re-sync bibliography section content even if not empty
      await get().syncBibliographyToSection();
    } else {
      set({ error: "Failed to delete reference. Please try again." });
      // Rollback on error
      set({ bibliography });
    }
  },

  toggleReferenceSelection: (index: number) => {
    const { selectedReferenceIndices } = get();
    if (selectedReferenceIndices.includes(index)) {
      set({
        selectedReferenceIndices: selectedReferenceIndices.filter((i) => i !== index),
      });
    } else {
      set({
        selectedReferenceIndices: [...selectedReferenceIndices, index],
      });
    }
  },

  clearSelectedReferences: () => set({ selectedReferenceIndices: [] }),

  resetStore: () =>
    set({
      sessionId: null,
      currentStep: 1,
      topic: "",
      refinedTitle: "",
      keywords: [],
      objectives: [],
      structure: {},
      bibliography: [],
      sections: [],
      activeSectionId: null,
      titleOptions: [],
      metadata: {},
      selectedReferenceIndices: [],
      isLoading: false,
      error: null,
      progress: [],
      outlineNodes: [],
      variables: [],
      hypotheses: [],
      rawDataNotes: "",
    }),

  deleteSession: async () => {
    const { sessionId, resetStore } = get();
    if (!sessionId) return;

    // Delete sections first due to FK constraints
    await supabase.from("research_sections").delete().eq("session_id", sessionId);
    // Delete session
    await supabase.from("research_sessions").delete().eq("id", sessionId);
    
    resetStore();
  },
}));
