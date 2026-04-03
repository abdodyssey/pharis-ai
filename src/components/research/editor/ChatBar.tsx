// src/components/research/editor/ChatBar.tsx
import { useState } from "react";
import { useResearchStore } from "@/store/useResearchStore";
import { useToastStore } from "@/store/useToastStore";
import ModelLimitDialog from "@/components/shared/ModelLimitDialog";
import { supabase } from "@/lib/supabase";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ChatBar() {
  const { 
    activeSectionId, 
    sections, 
    bibliography, 
    refinedTitle, 
    updateSectionInStore 
  } = useResearchStore();
  const { addToast } = useToastStore();
  const [query, setQuery] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRateLimitOpen, setIsRateLimitOpen] = useState(false);

  const activeSection = sections.find((s) => s.id === activeSectionId);

  const handleSend = async () => {
    if (!query || !activeSectionId || !activeSection) return;

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("research-editor", {
        body: {
          sectionId: activeSectionId,
          userQuery: query,
          currentContent: activeSection.content,
          bibliography,
          refinedTitle,
        },
      });

      if (error) throw error;

      if (data?.content) {
        updateSectionInStore(activeSectionId, data.content);
        setQuery("");
      }
    } catch (err: unknown) {
      console.error("Full Error Object:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      const status = (err as { status?: number })?.status;

      if (status === 429 || errorMessage?.includes("429")) {
        setIsRateLimitOpen(true);
      } else {
        addToast({
          type: "error",
          message: "AI Research Bot Error",
          description: errorMessage
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed bottom-10 left-[calc(50%+144px)] -translate-x-1/2 w-full max-w-2xl px-6 z-50">
      <div className={cn(
        "flex items-center gap-3 p-2 bg-white/70 backdrop-blur-xl border border-white/50 shadow-2xl rounded-2xl ring-1 ring-slate-900/5 transition-all duration-300",
        isGenerating && "ring-slate-900/10 shadow-slate-900/5 bg-white/80"
      )}>
        <div className="pl-3 py-1 flex items-center gap-2 group cursor-help shrink-0">
          <Wand2 className="text-slate-900 group-hover:scale-110 transition-transform" size={16} />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:inline-block">AI Research Bot</span>
        </div>
        
        <input
          type="text"
          placeholder={
            activeSection 
            ? `Tanya AI atau perintah bab "${activeSection.title}"...` 
            : "Silakan pilih bab di sebelah kiri"
          }
          className="flex-1 bg-transparent border-none placeholder:text-slate-300 text-slate-700 focus:outline-none focus:ring-0 text-sm py-2 ml-2"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={!activeSectionId || isGenerating}
        />
        
        <button
          onClick={handleSend}
          disabled={!activeSectionId || isGenerating || !query}
          className={cn(
            "p-2.5 rounded-xl transition-all duration-300 flex items-center gap-2 shadow-sm",
            isGenerating 
              ? "bg-slate-100 text-slate-400" 
              : "bg-slate-900 text-white hover:bg-black hover:shadow-black/20"
          )}
        >
          {isGenerating ? (
            <Loader2 className="animate-spin" size={16} />
          ) : (
            <>
              <span className="text-[10px] font-bold tracking-widest uppercase hidden md:inline ml-1">Generate</span>
              <Sparkles size={16} />
            </>
          )}
        </button>
      </div>
      <ModelLimitDialog 
        isOpen={isRateLimitOpen} 
        onOpenChange={setIsRateLimitOpen} 
      />
    </div>
  );
}
