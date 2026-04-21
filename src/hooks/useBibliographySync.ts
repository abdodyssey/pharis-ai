import { useEffect, useRef } from "react";
import { Editor } from "@tiptap/react";
import { useResearchStore } from "@/store/useResearchStore";
import { formatBibliographyToAPA } from "@/lib/bibliography-utils";

/**
 * useBibliographySync: Senior-level automated bridge for the Bibliography section.
 * Monitors changes in the bibliography state and forces a sync to Chapter 7 (Daftar Pustaka).
 */
export function useBibliographySync(editor: Editor | null) {
  const { 
    bibliography, 
    sections, 
    activeSectionId, 
    updateSectionInStore, 
    saveSectionToDb 
  } = useResearchStore();
  
  const bibHash = JSON.stringify(bibliography);
  const lastSyncHash = useRef<string>("");

  useEffect(() => {
    if (!editor || !bibliography) return;

    const bibSection = sections.find(s => s.title.toLowerCase() === "daftar pustaka");
    if (!bibSection) return;

    // Check if the bibliography array actually changed to avoid redundant loops
    if (bibHash !== lastSyncHash.current) {
      lastSyncHash.current = bibHash;

      const formattedPustaka = formatBibliographyToAPA(bibliography);

      // If Chapter 7 is currently open in the canvas, update it via TipTap API
      if (activeSectionId === bibSection.id) {
        // Prevent cursor jump if content is identical
        if (editor.getHTML() !== formattedPustaka) {
            editor.commands.setContent(formattedPustaka);
        }
      }

      // Sync to global store and persist to Supabase in the background
      updateSectionInStore(bibSection.id, formattedPustaka);
      saveSectionToDb(bibSection.id, formattedPustaka);
    }
  }, [bibHash, editor, activeSectionId, sections, updateSectionInStore, saveSectionToDb, bibliography]);
}
