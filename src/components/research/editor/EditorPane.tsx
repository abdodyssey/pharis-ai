import { useResearchStore } from "@/store/useResearchStore";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { 
  Info, 
  ShieldCheck, 
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered,
  Type
} from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

const MenuButton = ({ 
  onClick, 
  isActive, 
  children, 
  tooltip 
}: { 
  onClick: () => void, 
  isActiveContent?: boolean,
  isActive?: boolean, 
  children: React.ReactNode,
  tooltip: string 
}) => (
  <button
    onClick={(e) => {
      e.preventDefault();
      onClick();
    }}
    className={cn(
      "p-2 rounded-lg transition-all flex items-center justify-center gap-1.5",
      isActive 
        ? "bg-slate-900 text-white shadow-sm" 
        : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-900"
    )}
    title={tooltip}
  >
    {children}
  </button>
);

export default function EditorPane() {
  const { sections, activeSectionId, updateSectionInStore, saveSectionToDb } = useResearchStore();
  const activeSection = sections.find((s) => s.id === activeSectionId);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: "Tulis draf riset Anda di sini. Gunakan chat di bawah untuk bantuan AI berbasis data...",
      }),
    ],
    content: activeSection?.content || "",
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (activeSectionId) {
        updateSectionInStore(activeSectionId, html);
      }
    },
    editorProps: {
      attributes: {
        class: "focus:outline-none",
      },
    },
  });

  // Debounced Auto-save Effect
  useEffect(() => {
    if (!activeSectionId || !activeSection?.content) return;

    const timeout = setTimeout(() => {
      saveSectionToDb(activeSectionId, activeSection.content);
    }, 1500); // Debounce save to database

    return () => clearTimeout(timeout);
  }, [activeSection?.content, activeSectionId, saveSectionToDb]);

  // Update editor content when active section changes or AI generates content
  useEffect(() => {
    if (editor && activeSection?.content !== undefined) {
      const currentHTML = editor.getHTML();
      if (activeSection.content !== currentHTML) {
        // preserve selection if possible, otherwise set content
        editor.commands.setContent(activeSection.content, { emitUpdate: false });
      }
    }
  }, [activeSectionId, activeSection?.content, editor]);

  if (!activeSection) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-300 font-medium">
        Pilih bab untuk mulai mengedit.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
      {/* Top Header Section - Minimalist & Premium */}
      <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-end bg-white/80 backdrop-blur-sm z-10 shrink-0">
        <div className="space-y-1">
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400">
            BAB {sections.findIndex(s => s.id === activeSectionId) + 1}
          </span>
          <h3 className="text-3xl font-bold tracking-tight text-slate-900 leading-tight">
            {activeSection.title}
          </h3>
        </div>
        
        {/* Grounding Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-full group cursor-help transition-all hover:bg-slate-200">
          <ShieldCheck size={14} className="text-slate-900" />
          <span className="text-[10px] font-bold text-slate-900 tracking-wider">GROUNDING: ENABLED</span>
          <Info size={10} className="text-slate-400 group-hover:text-slate-900" />
        </div>
      </div>

      {/* Editor Toolbar - Tailwind v4 styling */}
      <div className="px-10 py-3 border-b border-slate-50 flex items-center gap-1 bg-white shrink-0 overflow-x-auto scrollbar-hide">
        <MenuButton 
          onClick={() => editor?.chain().focus().toggleBold().run()} 
          isActive={editor?.isActive('bold')}
          tooltip="Tebal (Bold)"
        >
          <Bold size={18} />
        </MenuButton>
        <MenuButton 
          onClick={() => editor?.chain().focus().toggleItalic().run()} 
          isActive={editor?.isActive('italic')}
          tooltip="Miring (Italic)"
        >
          <Italic size={18} />
        </MenuButton>

        <div className="w-px h-6 bg-slate-200 mx-2" />

        <MenuButton 
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} 
          isActive={editor?.isActive('heading', { level: 1 })}
          tooltip="Heading 1"
        >
          <Heading1 size={18} />
        </MenuButton>
        <MenuButton 
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} 
          isActive={editor?.isActive('heading', { level: 2 })}
          tooltip="Heading 2"
        >
          <Heading2 size={18} />
        </MenuButton>
        <MenuButton 
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} 
          isActive={editor?.isActive('heading', { level: 3 })}
          tooltip="Heading 3"
        >
          <Heading3 size={18} />
        </MenuButton>

        <div className="w-px h-6 bg-slate-200 mx-2" />

        <MenuButton 
          onClick={() => editor?.chain().focus().toggleBulletList().run()} 
          isActive={editor?.isActive('bulletList')}
          tooltip="List Peluru"
        >
          <List size={18} />
        </MenuButton>
        <MenuButton 
          onClick={() => editor?.chain().focus().toggleOrderedList().run()} 
          isActive={editor?.isActive('orderedList')}
          tooltip="List Berurutan"
        >
          <ListOrdered size={18} />
        </MenuButton>

        <div className="w-px h-6 bg-slate-200 mx-2" />

        <MenuButton 
          onClick={() => editor?.chain().focus().setParagraph().run()} 
          isActive={editor?.isActive('paragraph')}
          tooltip="Teks Normal"
        >
          <Type size={18} />
        </MenuButton>
      </div>

      {/* Editor Canvas - Maximizing clean space for typography */}
      <div className="flex-1 overflow-y-auto p-12 bg-white relative scroll-smooth scrollbar-hide">
        <div className="max-w-4xl mx-auto">
          <EditorContent editor={editor} />
        </div>

        {/* Sub-badge bottom markers */}
        <div className="max-w-4xl mx-auto mt-20 pt-8 border-t border-slate-50 flex justify-between items-center opacity-30">
          <div className="flex items-center gap-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            <span>Semantic Editor</span>
            <span>•</span>
            <span>AI Powered</span>
            <span>•</span>
            <span>HTML Ready</span>
          </div>
          <p className="text-[10px] text-slate-300 font-medium italic">Standardized Journal Framework</p>
        </div>
      </div>
    </div>
  );
}

