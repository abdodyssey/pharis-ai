"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Cancel01Icon, 
  BookOpen01Icon, 
  Link01Icon, 
  CopyIcon, 
  Tick01Icon, 
  Delete02Icon, 
  PlusSignIcon, 
  Loading01Icon, 
  SparklesIcon, 
  MagicWand01Icon, 
  FileSearchIcon 
} from "@hugeicons/core-free-icons";
import { supabase } from "@/lib/supabase";
import { fetchReferences } from "@/lib/ai-service";
import { useResearchStore } from "@/store/useResearchStore";
import { useToastStore } from "@/store/useToastStore";
import { BibliographyEntry } from "@/types/research";
import { cn } from "@/lib/utils";

interface BibliographyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BibliographyDrawer({ isOpen, onClose }: BibliographyDrawerProps) {
  const { bibliography, addReference, deleteReference, refinedTitle } = useResearchStore();
  const { addToast } = useToastStore();
  const [activeTab, setActiveTab] = useState<"manager" | "discovery">("manager");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isBulkAdding, setIsBulkAdding] = useState(false);
  const [aiResults, setAiResults] = useState<BibliographyEntry[]>([]);

  // Form State
  const [newRef, setNewRef] = useState<Partial<BibliographyEntry>>({
    title: "",
    authors: "",
    year: new Date().getFullYear(),
    url: "",
    doi: "",
    abstract: ""
  });

  const handleCopyCitation = (entry: BibliographyEntry, index: number) => {
    const citation = `${entry.authors} (${entry.year || "n.d."}). ${entry.title}.`;
    navigator.clipboard.writeText(citation);
    setCopiedId(index.toString());
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAISearch = async () => {
    if (!refinedTitle) return;
    setIsSearching(true);
    setAiResults([]);
    
    try {
      const { data, error } = await fetchReferences(refinedTitle);
      
      console.log("AI Raw Response:", data);

      if (error || (data && data.error)) {
        console.error("Supabase function error:", error || data.error);
        addToast({ message: "Gagal mencari referensi.", type: "error" });
        return;
      }

      let parsedData = data;
      
      // Response Cleaning
      if (typeof data === 'string') {
        try {
          const cleanJson = data.replace(/```json|```/g, "").trim();
          parsedData = JSON.parse(cleanJson);
        } catch (e) {
          console.error("Failed to parse cleaned JSON string:", e);
        }
      }

      if (parsedData?.results && Array.isArray(parsedData.results)) {
        setAiResults(parsedData.results);
      } else if (Array.isArray(parsedData)) {
        setAiResults(parsedData);
      }
    } catch (err) {
      console.error("Search error in fetch-references:", err);
      addToast({ message: "Sistem sibuk. Coba lagi nanti.", type: "error" });
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddReference = async (e: React.FormEvent | BibliographyEntry) => {
    if (e && "nativeEvent" in e) {
      (e as React.FormEvent).preventDefault();
      if (!newRef.title || !newRef.authors) return;
      setIsSubmitting(true);
      try {
        await addReference(newRef as BibliographyEntry);
        setNewRef({ title: "", authors: "", year: new Date().getFullYear(), url: "", doi: "", abstract: "" });
        setShowAddForm(false);
        addToast({ message: "Berhasil menambahkan jurnal.", type: "success" });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Direct add from AI result
      const entry = e as BibliographyEntry;
      
      // Duplicate Guard
      const isDuplicate = bibliography.some(r => r.title.toLowerCase() === entry.title.toLowerCase());
      if (isDuplicate) {
        addToast({ message: "Jurnal sudah ada di koleksi.", type: "info" });
        return;
      }

      setIsSubmitting(true);
      try {
        await addReference(entry);
        setAiResults(prev => prev.filter(r => r.title !== entry.title));
        addToast({ message: "Jurnal ditambahkan ke Dashboard.", type: "success" });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleBulkAdd = async () => {
    if (aiResults.length === 0 || isBulkAdding) return;
    setIsBulkAdding(true);
    let addedCount = 0;

    try {
      const existingTitles = new Set(bibliography.map(r => r.title.toLowerCase()));
      const toAdd = aiResults.filter(r => !existingTitles.has(r.title.toLowerCase()));

      if (toAdd.length === 0) {
        addToast({ message: "Seluruh hasil sudah ada di koleksi.", type: "info" });
        setAiResults([]);
        return;
      }

      for (const entry of toAdd) {
        await addReference(entry as BibliographyEntry);
        addedCount++;
      }

      setAiResults([]);
      addToast({ 
        message: "Sinkronisasi Berhasil", 
        description: `Berhasil menambahkan ${addedCount} referensi ke koleksi Anda.`,
        type: "success" 
      });
    } catch (err) {
      console.error("Bulk add failed:", err);
      addToast({ message: "Gagal menambahkan semua jurnal.", type: "error" });
    } finally {
      setIsBulkAdding(false);
    }
  };

  const handleDelete = async (index: number) => {
    if (window.confirm("Hapus referensi ini dari daftar?")) {
      await deleteReference(index);
      addToast({ message: "Referensi dihapus.", type: "info" });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/20 dark:bg-obsidian-0/80 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="relative w-full max-w-xl h-full bg-white dark:bg-obsidian-1 shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-out border-l border-slate-100 dark:border-obsidian-2">
        
        {/* Header */}
        <div className="px-10 py-8 border-b border-slate-50 dark:border-obsidian-2 bg-white dark:bg-obsidian-1 sticky top-0 z-20">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-950 dark:bg-accent-lime text-white dark:text-obsidian-0 rounded-2xl flex items-center justify-center shadow-xl dark:shadow-accent-lime/10 transition-colors">
                <HugeiconsIcon icon={BookOpen01Icon} size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-950 dark:text-slate-100 tracking-tight leading-none">Reference Hub</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black mt-2 opacity-60 font-mono">{bibliography.length} Grounded Sources</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-3 hover:bg-slate-50 dark:hover:bg-obsidian-2 rounded-2xl transition-all group"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={24} className="text-slate-400 dark:text-slate-500 group-hover:text-slate-950 dark:group-hover:text-slate-100" />
            </button>
          </div>

          {/* Tab System */}
          <div className="flex p-2 bg-slate-50 dark:bg-obsidian-2 rounded-3xl border border-slate-100 dark:border-obsidian-2">
            <button 
              onClick={() => setActiveTab("manager")}
              className={cn(
                "flex-1 py-4 text-[10px] font-black rounded-2xl transition-all",
                activeTab === "manager" ? "bg-white dark:bg-obsidian-1 text-slate-950 dark:text-white shadow-xl dark:shadow-black/20 ring-1 ring-slate-100 dark:ring-obsidian-2" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              )}
            >
              My Collection
            </button>
            <button 
              onClick={() => setActiveTab("discovery")}
              className={cn(
                "flex-1 py-4 text-[10px] font-black rounded-2xl transition-all",
                activeTab === "discovery" ? "bg-white dark:bg-obsidian-1 text-slate-950 dark:text-white shadow-xl dark:shadow-black/20 ring-1 ring-slate-100 dark:ring-obsidian-2" : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
              )}
            >
              AI Discovery
            </button>
          </div>
        </div>
        
        {/* Content Container */}
        <div className="flex-1 overflow-y-auto bg-slate-50/20 dark:bg-obsidian-1 custom-scrollbar">
          
          {activeTab === "manager" ? (
            <div className="pb-10">
              {/* Action Bar */}
              <div className="p-8 border-b border-slate-50 dark:border-obsidian-2 bg-white dark:bg-obsidian-1 shadow-sm">
                <button 
                  onClick={() => setShowAddForm(!showAddForm)}
                  className={cn(
                    "w-full flex items-center justify-center gap-3 py-5 rounded-[2.5rem] text-[11px] font-black transition-all shadow-2xl",
                    showAddForm 
                      ? "bg-slate-50 dark:bg-obsidian-2 text-slate-400 dark:text-slate-500 hover:text-slate-950 dark:hover:text-slate-100 shadow-slate-900/5 dark:shadow-none" 
                      : "bg-slate-950 dark:bg-accent-lime text-white dark:text-obsidian-0 hover:bg-black dark:hover:bg-white shadow-slate-900/20 dark:shadow-accent-lime/10"
                  )}
                >
                  {showAddForm ? <HugeiconsIcon icon={Cancel01Icon} size={20} /> : <HugeiconsIcon icon={PlusSignIcon} size={20} />}
                  {showAddForm ? "Batal Tambah" : "Manual Import"}
                </button>
              </div>

              {/* Add Form */}
              {showAddForm && (
                <div className="p-10 bg-white dark:bg-obsidian-1 border-b border-slate-50 dark:border-obsidian-2 animate-in slide-in-from-top-4 duration-500">
                  <form onSubmit={handleAddReference} className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 ml-1">Judul Jurnal</label>
                      <input 
                        required
                        className="w-full px-6 py-5 bg-slate-50 dark:bg-obsidian-2 border border-slate-100 dark:border-obsidian-2 rounded-3xl text-sm font-bold focus:ring-4 focus:ring-slate-900/5 dark:focus:ring-accent-lime/10 focus:bg-white dark:focus:bg-obsidian-2 outline-none transition-all dark:text-slate-100 dark:placeholder-slate-600"
                        placeholder="E.g. AI in Academic Writing"
                        value={newRef.title}
                        onChange={e => setNewRef({...newRef, title: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="col-span-2 space-y-3">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 ml-1">Penulis</label>
                        <input 
                          required
                          className="w-full px-6 py-5 bg-slate-50 dark:bg-obsidian-2 border border-slate-100 dark:border-obsidian-2 rounded-3xl text-sm font-bold focus:ring-4 focus:ring-slate-900/5 dark:focus:ring-accent-lime/10 focus:bg-white dark:focus:bg-obsidian-2 outline-none transition-all dark:text-slate-100 dark:placeholder-slate-600"
                          placeholder="Doe, J., et al"
                          value={newRef.authors}
                          onChange={e => setNewRef({...newRef, authors: e.target.value})}
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 ml-1">Tahun</label>
                        <input 
                          type="number"
                          required
                          className="w-full px-6 py-5 bg-slate-50 dark:bg-obsidian-2 border border-slate-100 dark:border-obsidian-2 rounded-3xl text-sm font-bold focus:ring-4 focus:ring-slate-900/5 dark:focus:ring-accent-lime/10 focus:bg-white dark:focus:bg-obsidian-2 outline-none transition-all dark:text-slate-100"
                          placeholder="2024"
                          value={newRef.year}
                          onChange={e => setNewRef({...newRef, year: parseInt(e.target.value) || undefined})}
                        />
                      </div>
                    </div>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-6 bg-slate-950 dark:bg-accent-lime text-white dark:text-obsidian-0 rounded-[2.5rem] text-[11px] font-black hover:bg-black dark:hover:bg-white transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-2xl dark:shadow-accent-lime/10"
                    >
                      {isSubmitting ? <HugeiconsIcon icon={Loading01Icon} size={20} className="animate-spin" /> : <HugeiconsIcon icon={Tick01Icon} size={20} />}
                      Verify & Sync
                    </button>
                  </form>
                </div>
              )}

              {/* Bibliography List */}
              <div className="p-10 space-y-8">
                {bibliography.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center space-y-8 opacity-40 select-none">
                    <div className="w-24 h-24 bg-slate-100 dark:bg-obsidian-2 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-700 border border-slate-100 dark:border-obsidian-2">
                      <HugeiconsIcon icon={BookOpen01Icon} size={48} />
                    </div>
                    <div className="space-y-3">
                      <p className="text-slate-950 dark:text-slate-100 font-black text-[11px]">Empty Collection</p>
                      <p className="text-sm text-slate-400 dark:text-slate-500 max-w-[200px] mx-auto font-medium leading-relaxed">Pemuatan data referensi diperlukan untuk menghasilkan draft otomatis.</p>
                    </div>
                  </div>
                ) : (
                  bibliography.map((entry, index) => (
                    <div 
                      key={index} 
                      className="group bg-white dark:bg-obsidian-1 p-8 rounded-[2.5rem] border border-slate-100 dark:border-obsidian-2 hover:border-slate-950/10 dark:hover:border-accent-lime/20 hover:shadow-2xl dark:hover:shadow-black/40 transition-all duration-500 animate-in fade-in slide-in-from-bottom-2"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="space-y-6">
                        <div className="flex justify-between items-start gap-4">
                          <h4 className="text-lg font-bold text-slate-950 dark:text-slate-100 leading-tight tracking-tight">
                            {entry.title}
                          </h4>
                          <button 
                            onClick={() => handleDelete(index)}
                            className="p-2.5 text-slate-200 dark:text-slate-700 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all shrink-0"
                            title="Hapus"
                          >
                            <HugeiconsIcon icon={Delete02Icon} size={18} />
                          </button>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="px-3.5 py-1.5 bg-slate-50 dark:bg-obsidian-2 border border-slate-100 dark:border-obsidian-2 rounded-full">
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 font-mono">{entry.year || "n.d."}</span>
                          </div>
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-bold truncate max-w-[240px]">
                            {entry.authors}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                          <a 
                            href={entry.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-3 px-5 py-4 bg-slate-50 dark:bg-obsidian-2 hover:bg-slate-100 dark:hover:bg-obsidian-2 text-slate-950 dark:text-slate-100 rounded-[1.5rem] text-[10px] font-black transition-all border border-slate-100 dark:border-obsidian-2"
                          >
                            <HugeiconsIcon icon={Link01Icon} size={16} className="text-slate-400" />
                            Preview
                          </a>
                          
                          <button
                            onClick={() => handleCopyCitation(entry, index)}
                            className="flex items-center justify-center gap-3 px-8 py-4 bg-white dark:bg-obsidian-1 hover:bg-slate-50 dark:hover:bg-obsidian-2 text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white rounded-[1.5rem] text-[10px] font-black transition-all border border-slate-100 dark:border-obsidian-2"
                          >
                            {copiedId === index.toString() ? (
                              <HugeiconsIcon icon={Tick01Icon} size={16} className="text-emerald-500 dark:text-accent-lime" />
                            ) : (
                              <HugeiconsIcon icon={CopyIcon} size={16} />
                            )}
                            Cite
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="pb-10">
              {/* AI Search Header */}
              <div className="p-12 bg-white dark:bg-obsidian-1 border-b border-slate-50 dark:border-obsidian-2 text-center space-y-8">
                <div className="w-20 h-20 bg-slate-950 dark:bg-accent-lime text-white dark:text-obsidian-0 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl dark:shadow-accent-lime/10">
                  <HugeiconsIcon icon={SparklesIcon} size={40} />
                </div>
                <div className="space-y-3">
                  <h4 className="text-2xl font-black text-slate-950 dark:text-slate-100 tracking-tight">AI Discovery Engine</h4>
                  <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[280px] mx-auto font-medium leading-relaxed">Pencarian literatur mendalam untuk: <br/><span className="text-slate-950 dark:text-white font-black">&ldquo;{refinedTitle}&rdquo;</span></p>
                </div>
                <button 
                  onClick={handleAISearch}
                  disabled={isSearching || isBulkAdding}
                  className="w-full py-6 bg-slate-950 dark:bg-accent-lime text-white dark:text-obsidian-0 rounded-[2.5rem] text-[11px] font-black shadow-2xl dark:shadow-accent-lime/10 hover:bg-black dark:hover:bg-white transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isSearching ? <HugeiconsIcon icon={Loading01Icon} size={20} className="animate-spin" /> : <HugeiconsIcon icon={MagicWand01Icon} size={20} />}
                  Smart Discovery 2026
                </button>
              </div>

              {/* AI Results & Bulk Actions */}
              <div className="p-10 space-y-10">
                {aiResults.length > 0 && !isSearching && (
                   <button
                    onClick={handleBulkAdd}
                    disabled={isBulkAdding}
                    className="w-full py-6 bg-slate-950 dark:bg-accent-lime text-white dark:text-obsidian-0 rounded-[2.5rem] text-[11px] font-black shadow-xl dark:shadow-accent-lime/10 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-80 group overflow-hidden relative"
                   >
                     <div className="absolute inset-0 bg-white/10 translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                     {isBulkAdding ? (
                       <>
                         <HugeiconsIcon icon={Loading01Icon} size={20} className="animate-spin text-white/50 dark:text-obsidian-0/50" />
                         <span>Syncing {aiResults.length} Journals...</span>
                       </>
                     ) : (
                       <>
                         <span>✨ Sync All Results</span>
                       </>
                     )}
                   </button>
                )}

                {isSearching ? (
                  <div className="space-y-10">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="animate-pulse space-y-8 bg-white dark:bg-obsidian-2 p-10 rounded-[3rem] border border-slate-50 dark:border-obsidian-2">
                        <div className="h-6 bg-slate-50 dark:bg-obsidian-1 rounded-full w-3/4" />
                        <div className="h-5 bg-slate-50 dark:bg-obsidian-1 rounded-full w-1/2" />
                        <div className="space-y-4">
                          <div className="h-2 bg-slate-50 dark:bg-obsidian-1 rounded-full w-full" />
                          <div className="h-2 bg-slate-50 dark:bg-obsidian-1 rounded-full w-4/5" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : aiResults.length === 0 ? (
                  <div className="pt-24 text-center space-y-8 opacity-40 select-none">
                    <HugeiconsIcon icon={FileSearchIcon} size={80} className="mx-auto text-slate-200 dark:text-obsidian-2" />
                    <p className="text-[10px] font-black text-slate-400">
                      Discovery Engaged
                    </p>
                  </div>
                ) : (
                  aiResults.map((res, i) => (
                    <div 
                      key={i}
                      className="bg-white dark:bg-obsidian-1 p-10 rounded-[3rem] border border-slate-100 dark:border-obsidian-2 shadow-sm hover:shadow-2xl dark:hover:shadow-black/40 transition-all duration-700 animate-in fade-in slide-in-from-bottom-4"
                      style={{ animationDelay: `${i * 150}ms` }}
                    >
                      <div className="space-y-8">
                        <div className="space-y-3">
                          <div className="flex items-center gap-4 mb-3">
                             <span className="px-3 py-1 bg-slate-50 dark:bg-obsidian-2 text-[10px] font-black text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-obsidian-2 rounded-lg font-mono">{res.year || "RECENT"}</span>
                             <span className="w-2 h-2 bg-emerald-400 dark:bg-accent-lime rounded-full animate-pulse shadow-[0_0_10px_rgba(163,230,53,0.4)]" />
                             <span className="text-[10px] font-black text-slate-400 dark:text-slate-500">Scientific Source</span>
                          </div>
                          <h4 className="text-xl font-black text-slate-950 dark:text-slate-100 leading-tight tracking-tight">{res.title}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">{res.authors}</p>
                        </div>

                        <div className="p-6 bg-slate-50 dark:bg-obsidian-2 rounded-[2rem] border border-slate-100 dark:border-obsidian-2 flex gap-5">
                          <div className="w-1.5 h-auto bg-slate-200 dark:bg-obsidian-1 rounded-full" />
                          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                            &ldquo;{res.summary_relevance || "No summary available."}&rdquo;
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <a 
                            href={res.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex-1 px-5 py-5 bg-slate-50 dark:bg-obsidian-2 hover:bg-slate-100 dark:hover:bg-obsidian-2 text-slate-950 dark:text-slate-100 rounded-[2rem] text-[10px] font-black border border-slate-100 dark:border-obsidian-2 flex items-center justify-center gap-3 transition-all"
                          >
                            <HugeiconsIcon icon={Link01Icon} size={18} className="text-slate-400" />
                            Source
                          </a>
                          <button 
                            onClick={() => handleAddReference(res as BibliographyEntry)}
                            className="flex-1 px-5 py-5 bg-slate-950 dark:bg-accent-lime text-white dark:text-obsidian-0 hover:bg-black dark:hover:bg-white rounded-[2rem] text-[10px] font-black shadow-2xl dark:shadow-accent-lime/10 transition-all flex items-center justify-center gap-3"
                          >
                            <HugeiconsIcon icon={PlusSignIcon} size={18} />
                            Collect
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-10 py-8 bg-white dark:bg-obsidian-1 border-t border-slate-50 dark:border-obsidian-2 no-print flex items-center justify-between">
           <div className="flex items-center gap-4">
            <div className="w-2.5 h-2.5 bg-emerald-500 dark:bg-accent-lime rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black">
              Grounding Engine Active
            </p>
           </div>
           <span className="text-[10px] font-black text-slate-200 dark:text-obsidian-2">v4.2</span>
        </div>
      </div>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #f1f5f9; border-radius: 10px; }
      `}</style>
    </div>
  );
}



