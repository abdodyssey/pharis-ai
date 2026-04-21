"use client";

import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import TiptapLink from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Mention from "@tiptap/extension-mention";
import React, { useEffect, useState, useRef } from "react";
import { useResearchStore } from "@/store/useResearchStore";

// Constants for A4 Physical dimensions (at 96 DPI, 1cm ≈ 37.8px)
const CM_TO_PX = 37.795;
const PAGE_HEIGHT_PX = 29.7 * CM_TO_PX;
const CONTENT_HEIGHT_PX = 22.7 * CM_TO_PX; // 29.7 - 4 (top) - 3 (bottom)

interface MultiPageEditorProps {
  initialContent: string;
  onUpdate: (html: string) => void;
}

/**
 * MultiPageEditor: Transforms Tiptap into a paged layout.
 * Implementation: Uses a single editor instance but wraps the ProseMirror view
 * inside a paged layout engine that simulates physical A4 sheets.
 */
export default function MultiPageEditor({ initialContent, onUpdate }: MultiPageEditorProps) {
  const { bibliography } = useResearchStore();
  const [pageCount, setPageCount] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      TiptapLink.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Mulai menulis..." }),
      Mention.configure({
        HTMLAttributes: { class: "mention" },
        renderLabel({ node }) { return node.attrs.label || node.attrs.id || ""; },
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onUpdate(html);
      calculatePages(editor);
    },
    immediatelyRender: false,
  });

  const calculatePages = (editor: Editor) => {
    if (!editor || !containerRef.current) return;
    const editorEl = containerRef.current.querySelector(".ProseMirror");
    if (!editorEl) return;
    
    const height = editorEl.scrollHeight;
    const newPageCount = Math.max(1, Math.ceil(height / CONTENT_HEIGHT_PX));
    if (newPageCount !== pageCount) {
      setPageCount(newPageCount);
    }
  };

  useEffect(() => {
    if (editor) calculatePages(editor);
  }, [editor]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-200 editor-scroll p-8 pb-32" ref={containerRef}>
      <div className="relative mx-auto w-[21cm] flex flex-col gap-8 no-print">
        {/* Visual Page Layers */}
        {Array.from({ length: pageCount }).map((_, i) => (
          <div 
            key={i} 
            className="a4-page bg-white shadow-2xl relative transition-all duration-500 ease-out"
            style={{ 
              width: "21cm", 
              height: "29.7cm", 
              paddingTop: "4cm",
              paddingLeft: "4cm",
              paddingBottom: "3cm",
              paddingRight: "3cm"
            }}
          >
            {/* Page Number Indicator */}
            <div className="absolute top-6 right-8 text-[9px] font-black text-slate-300 pointer-events-none">
              Halaman {i + 1}
            </div>
          </div>
        ))}

        {/* The Master Editor (Positioned over the pages) */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{ paddingTop: "4cm", paddingLeft: "4cm", paddingRight: "3cm" }}
        >
          <div className="pointer-events-auto">
            <EditorContent editor={editor} className="tiptap-paged-editor" />
          </div>
        </div>
      </div>

      {/* CSS for Seamless Paging over Visual Sheets */}
      <style jsx global>{`
        .tiptap-paged-editor .ProseMirror {
          min-height: 22.7cm;
          outline: none;
          font-family: 'Times New Roman', serif;
          font-size: 12pt;
          line-height: 1.5;
          text-align: justify;
          color: black;
          
          /* The Magic: We use background clips to simulate the A4 gaps in the text flow */
          /* Note: We use a tall editor, and the visual sheets behind it provide the frames. */
        }

        /* Adjustment for the gaps: We actually need the Editor to have a gap too 
           so the text doesn't land on the 'slate' part between pages. */
        .tiptap-paged-editor .ProseMirror > *:nth-child(n) {
           /* Complex logic would go here to detect text landing in gaps */
        }

        @media print {
          .a4-page {
            box-shadow: none !important;
            margin: 0 !important;
            page-break-after: always;
          }
          .no-print { display: none; }
        }
      `}</style>
    </div>
  );
}
