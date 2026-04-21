"use client";

import { useResearchStore } from "@/store/useResearchStore";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { FontFamily } from "@tiptap/extension-font-family";
import { Color } from "@tiptap/extension-color";
import { Highlight } from "@tiptap/extension-highlight";
import { Underline } from "@tiptap/extension-underline";
import { TextAlign } from "@tiptap/extension-text-align";
import { FontSize } from "@/lib/tiptap-extensions/FontSize";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
    TextBoldIcon, 
    TextItalicIcon, 
    TextUnderlineIcon, 
    Heading01Icon, 
    Heading02Icon, 
    Heading03Icon, 
    ListViewIcon, 
    TextAlignLeftIcon, 
    TextAlignCenterIcon, 
    TextAlignRightIcon,
    TextAlignJustifyCenterIcon, 
    Loading01Icon,
    ArrowDown01Icon,
    PaintBoardIcon,
    HighlighterIcon,
    SparklesIcon,
    MagicWand01Icon,
} from "@hugeicons/core-free-icons";
import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { useBibliographySync } from "@/hooks/useBibliographySync";
import { generateSection } from "@/lib/ai-service";
import { useToastStore } from "@/store/useToastStore";

const FONT_FAMILIES = [
    { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
    { label: "Arial", value: "Arial, Helvetica, sans-serif" },
    { label: "Plus Jakarta Sans", value: "var(--font-jakarta), sans-serif" },
    { label: "Georgia", value: "Georgia, serif" },
];

const FONT_SIZES = ["10pt", "11pt", "12pt", "14pt", "16pt", "18pt", "24pt", "36pt"];

export default function EditorCanvas() {
    const { 
        sessionId,
        activeSectionId, 
        sections, 
        saveSectionToDb, 
        updateSectionInStore,
        bibliography,
    } = useResearchStore();

    const { addToast } = useToastStore();
    const activeSection = sections.find(s => s.id === activeSectionId);
    const [isLoadingSection, setIsLoadingSection] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const lastSavedContent = useRef<string>("");

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                // @ts-ignore
                underline: false,
            }),
            Underline,
            TextStyle,
            FontFamily,
            FontSize,
            Color,
            Highlight.configure({ multicolor: true }),
            TextAlign.configure({ types: ["heading", "paragraph"] }),
        ],
        immediatelyRender: false,
        content: activeSection?.content || "",
        editorProps: {
            attributes: {
                class: "prose prose-slate max-w-none focus:outline-none min-h-[1000px] tiptap",
                style: "width: 100%;", 
                lang: "id",
                spellcheck: "false"
            }
        },
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            if (activeSectionId) {
                updateSectionInStore(activeSectionId, html);
            }
        }
    });

    useBibliographySync(editor);

    useEffect(() => {
        if (!editor || !activeSectionId) return;
        const interval = setInterval(() => {
            const currentContent = editor.getHTML();
            if (currentContent !== lastSavedContent.current) {
                saveSectionToDb(activeSectionId, currentContent);
                lastSavedContent.current = currentContent;
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [editor, activeSectionId, saveSectionToDb]);

    useEffect(() => {
        if (!editor || !activeSection) return;
        if (editor.getHTML() !== activeSection.content) {
            const timer = setTimeout(() => {
                editor.commands.setContent(activeSection.content || "");
                lastSavedContent.current = activeSection.content || "";
            }, 10);
            return () => clearTimeout(timer);
        }
    }, [activeSectionId, editor, activeSection]);

    const handleAutoGenerate = async () => {
        if (!sessionId || !activeSection) return;
        setIsGenerating(true);

        const isAbstract = activeSection.title.toLowerCase().includes("abstrak");
        
        let digest = "";
        if (isAbstract) {
            // Collect all OTHER sections content for summarization
            digest = sections
                .filter(s => s.content && s.title.toLowerCase() !== "abstrak" && s.title.toLowerCase() !== "daftar pustaka")
                .map(s => `[CHAPTER: ${s.title}]\n${s.content.replace(/<[^>]*>/g, '').substring(0, 1000)}`)
                .join("\n\n");
            
            addToast({ 
                type: "info", 
                message: "Mensintesis Naskah", 
                description: "Membaca seluruh bab naskah untuk membuat abstrak yang akurat..." 
            });
        } else {
            addToast({ 
                type: "info", 
                message: "Menganalisis Referensi", 
                description: `Mengekstrak data dari ${bibliography.length} sumber di Literature Vault...` 
            });
        }

        const { data, error } = await generateSection(
            sessionId, 
            activeSection.title, 
            isAbstract ? digest : undefined
        );
        
        if (error || !data?.content) {
            addToast({ type: "error", message: "Gagal Membuat Draf", description: error || "Terjadi kesalahan sistem." });
            setIsGenerating(false);
            return;
        }

        editor?.commands.setContent(data.content);
        if (activeSectionId) {
            updateSectionInStore(activeSectionId, data.content);
            lastSavedContent.current = data.content;
        }
        setIsGenerating(false);
        addToast({ type: "success", message: "Draft Selesai", description: "Pendahuluan telah berhasil dibuat berdasarkan referensi." });
    };

    if (!editor || !activeSection) return null;

    const isEmpty = editor.getText().trim() === "";

    return (
        <div className="flex-1 flex flex-col overflow-hidden relative bg-white dark:bg-obsidian-0">
            {isLoadingSection && (
                <div className="absolute inset-0 z-30 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="flex items-center gap-3 text-slate-300">
                        <HugeiconsIcon icon={Loading01Icon} size={18} className="animate-spin" />
                        <span className="text-[9px] font-black font-mono">Syncing Narrative...</span>
                    </div>
                </div>
            )}

            <div className="sticky top-0 z-20 px-4 py-2 border-b border-slate-200 dark:border-obsidian-2 flex items-center justify-between gap-2 bg-white dark:bg-obsidian-1 no-print">
                <div className="flex items-center flex-wrap gap-1">
                    <select 
                        className="appearance-none bg-slate-50 dark:bg-obsidian-2 border-none rounded-lg px-3 py-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-300 pr-8 outline-none cursor-pointer"
                        onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
                    >
                        {FONT_FAMILIES.map(f => (
                            <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                    </select>
                    <Divider />
                    <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold"><HugeiconsIcon icon={TextBoldIcon} size={14} /></ToolbarBtn>
                    <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic"><HugeiconsIcon icon={TextItalicIcon} size={14} /></ToolbarBtn>
                    <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline"><HugeiconsIcon icon={TextUnderlineIcon} size={14} /></ToolbarBtn>
                    <Divider />
                    <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align Left"><HugeiconsIcon icon={TextAlignLeftIcon} size={14} /></ToolbarBtn>
                    <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Align Center"><HugeiconsIcon icon={TextAlignCenterIcon} size={14} /></ToolbarBtn>
                    <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign("justify").run()} active={editor.isActive({ textAlign: "justify" })} title="Justify"><HugeiconsIcon icon={TextAlignJustifyCenterIcon} size={14} /></ToolbarBtn>
                    <Divider />
                    <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet List"><HugeiconsIcon icon={ListViewIcon} size={14} /></ToolbarBtn>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto editor-scroll pt-12 pb-24 px-4 custom-scrollbar bg-slate-50/10">
                <div className="a4-paper mx-auto relative shadow-4xl shadow-slate-900/10 dark:shadow-black/50 bg-white dark:bg-obsidian-1 ring-1 ring-slate-200/50 dark:ring-white/5 min-h-[1100px]">
                    <EditorContent editor={editor} />

                    {isEmpty && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center space-y-6 animate-in fade-in zoom-in duration-500">
                            <div className="w-20 h-20 bg-accent-lime/10 rounded-3xl flex items-center justify-center text-accent-lime">
                                <HugeiconsIcon icon={SparklesIcon} size={40} className="animate-pulse" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Mulai {activeSection.title}</h3>
                                <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
                                    Gunakan AI untuk menyusun draf {activeSection.title} berdasarkan {bibliography.length} referensi di Literature Vault.
                                </p>
                            </div>
                            <button 
                                onClick={handleAutoGenerate}
                                disabled={isGenerating || bibliography.length === 0}
                                className="group relative flex items-center gap-3 px-10 py-4 bg-accent-lime text-obsidian-0 rounded-2xl font-black text-xs hover:bg-white transition-all shadow-xl shadow-accent-lime/20 disabled:opacity-50"
                            >
                                {isGenerating ? (
                                    <>
                                        <HugeiconsIcon icon={Loading01Icon} size={16} className="animate-spin" />
                                        <span>Menyusun {activeSection.title}...</span>
                                    </>
                                ) : (
                                    <>
                                        <HugeiconsIcon icon={MagicWand01Icon} size={16} className="group-hover:rotate-12 transition-transform" />
                                        <span>Auto-Generate {activeSection.title}</span>
                                    </>
                                )}
                            </button>
                            {bibliography.length === 0 && (
                                <p className="text-[10px] text-amber-500 font-bold">
                                    Tambahkan referensi di Literature Vault terlebih dahulu
                                </p>
                            )}
                        </div>
                    )}

                    <div className="mt-32 mb-16 py-12 border-t border-dashed border-slate-50 text-center opacity-30 select-none">
                        <span className="text-[10px] font-black text-slate-300 font-mono">
                            End of Narrative Focus
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ToolbarBtn({ onClick, active, children, title }: { 
    onClick: () => void; active: boolean; children: React.ReactNode; title: string 
}) {
    return (
        <button
            onClick={(e) => { e.preventDefault(); onClick(); }}
            className={cn(
                "p-2 rounded-lg transition-all duration-300 flex items-center justify-center",
                active ? "bg-slate-900 dark:bg-accent-lime text-white dark:text-obsidian-0 shadow-xl shadow-slate-900/20 dark:shadow-accent-lime/10" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-obsidian-2 hover:text-slate-950 dark:hover:text-white"
            )}
            title={title}
        >
            {children}
        </button>
    );
}

function Divider() {
    return <div className="w-px h-5 bg-slate-100 dark:bg-obsidian-2 mx-2" />;
}
