"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useResearchStore } from "@/store/useResearchStore";
import { useToastStore } from "@/store/useToastStore";
import { fetchReferences } from "@/lib/ai-service";
import { BibliographyEntry, MIN_REFERENCES_REQUIRED } from "@/types/research";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  BookOpen01Icon,
  PlusSignIcon,
  Delete02Icon,
  Link01Icon,
  ArrowRight01Icon,
  Tick01Icon,
  LibraryIcon,
  AlertCircleIcon,
  Shield01Icon,
  Upload01Icon,
  File01Icon,
  FileValidationIcon,
  AddCircleIcon,
  Cancel01Icon,
  FileUploadIcon,
  Loading01Icon,
} from "@hugeicons/core-free-icons";

export default function Step3LiteratureVault() {
  const {
    bibliography,
    addReference,
    addBatchReferences,
    deleteReference,
    removeAllReferences,
    completeStep,
    updateResearchData,
    refinedTitle,
    topic,
    sessionId,
  } = useResearchStore();


  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleAddAll = async () => {
    if (searchResults.length === 0) return;
    const toAdd = searchResults.filter(p => !bibliography.some(b => b.title.toLowerCase() === p.title.toLowerCase()));
    if (toAdd.length === 0) {
      addToast({ type: "info", message: "Sudah Ada", description: "Semua hasil pencarian sudah ada di koleksi Anda." });
      return;
    }
    await addBatchReferences(toAdd);
    addToast({ type: "success", message: "Berhasil", description: `${toAdd.length} referensi telah ditambahkan.` });
  };

  const handleRemoveAll = () => {
    if (bibliography.length === 0) return;
    setShowClearConfirm(true);
  };

  const confirmClearVault = async () => {
    await removeAllReferences();
    setShowClearConfirm(false);
    addToast({ type: "info", message: "Vault Dikosongkan", description: "Semua referensi telah dihapus." });
  };

  const { addToast } = useToastStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<BibliographyEntry[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [manualRef, setManualRef] = useState({ title: "", authors: "", year: "", doi: "", url: "" });

  const TARGET_MIN = 15;
  const canProceed = bibliography.length >= TARGET_MIN;

  // Initialize search query and auto-trigger search on mount
  useEffect(() => {
    // Priority: Store refinedTitle -> Store topic -> Local state fallback
    const activeQuery = refinedTitle || topic || "";
    
    if (activeQuery && !searchQuery) {
      const initialQuery = activeQuery.substring(0, 250);
      setSearchQuery(initialQuery);
      
      const autoRun = async () => {
        setIsSearching(true);
        try {
          // Explicitly use the resolved query to avoid race conditions with state
          const { data, error } = await fetchReferences(initialQuery);
          if (error || data?.error) {
             console.warn("Auto-search limited results:", error || data?.error);
             return;
          }
          const papers: BibliographyEntry[] = (data?.results || []).map((p: any) => ({
            title: p.title || "Untitled",
            authors: p.authors || "Unknown",
            year: p.year,
            url: p.url || "",
            doi: p.doi || "",
            abstract: p.summary_relevance || p.abstract || "",
          }));
          setSearchResults(papers);
        } catch (err) {
          console.error("Auto search failed:", err);
        } finally {
          setIsSearching(false);
        }
      };
      
      // Delay slightly to ensure store has finished any background saves
      const timer = setTimeout(autoRun, 500);
      return () => clearTimeout(timer);
    }
  }, [refinedTitle, topic, searchQuery]);

  const handleSearch = useCallback(async (queryOverride?: any) => {
    const query = typeof queryOverride === 'string' ? queryOverride : searchQuery;
    if (!query || typeof query !== 'string' || !query.trim()) return;

    setIsSearching(true);
    setSearchResults([]);

    try {
      const { data, error } = await fetchReferences(query);
      if (error || data?.error) {
        addToast({
          type: "error",
          message: "Pencarian Terbatas",
          description: error || data?.error || data?.description || "Tidak ditemukan hasil yang cocok.",
        });
        return;
      }

      const papers: BibliographyEntry[] = (data?.results || data?.references || []).map((p: any) => ({
        title: p.title || "Untitled",
        authors: p.authors || "Unknown",
        year: p.year,
        url: p.url || "",
        doi: p.doi || "",
        abstract: p.summary_relevance || p.abstract || "",
      }));
      setSearchResults(papers);
    } catch (err: any) {
      console.error("Search failed:", err);
      addToast({
        type: "error",
        message: "Koneksi Terputus",
        description: "Gagal menjangkau database akademik. Periksa koneksi internet Anda.",
      });
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, addToast]);

  const handleAddReference = async (ref: BibliographyEntry) => {
    const isDuplicate = bibliography.some(
      (b) => b.title.toLowerCase() === ref.title.toLowerCase()
    );
    if (isDuplicate) {
      addToast({ type: "error", message: "Duplikat", description: "Referensi ini sudah ada di koleksi Anda." });
      return;
    }
    await addReference(ref);
    addToast({ type: "success", message: "Referensi Ditambahkan", description: ref.title.substring(0, 60) + "..." });
  };

  const handleFileUpload = async (index: number, file: File) => {
    if (!sessionId) return;
    setIsUploading(bibliography[index].title);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${sessionId}/${Date.now()}.${fileExt}`;
      const filePath = `references/${fileName}`;

      const { data, error } = await supabase.storage
        .from('research-files')
        .upload(filePath, file);

      if (error) throw error;

      const updatedRef = { 
        ...bibliography[index], 
        storage_path: filePath,
        local_file_name: file.name
      };

      const newBib = [...bibliography];
      newBib[index] = updatedRef;
      
      await updateResearchData({ bibliography: newBib });
      await useResearchStore.getState().saveToDb();
      
      addToast({ type: "success", message: "PDF Berhasil Diunggah", description: file.name });
    } catch (err: any) {
      console.error(err);
      addToast({ type: "error", message: "Gagal Mengunggah", description: err.message });
    } finally {
      setIsUploading(null);
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualRef.title || !manualRef.authors) return;

    const entry: BibliographyEntry = {
      title: manualRef.title,
      authors: manualRef.authors,
      year: manualRef.year ? parseInt(manualRef.year) : undefined,
      doi: manualRef.doi,
      url: manualRef.url || (manualRef.doi ? `https://doi.org/${manualRef.doi}` : ""),
    };

    await addReference(entry);
    setManualRef({ title: "", authors: "", year: "", doi: "", url: "" });
    setShowManualForm(false);
    addToast({ type: "success", message: "Manual Add", description: "Referensi berhasil ditambahkan." });
  };

  const handleFinish = async () => {
    if (!canProceed) return;
    await completeStep(3);
    addToast({ type: "success", message: "Riset Selesai!", description: "Daftar referensi Anda telah siap diunduh." });
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-16 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-slate-100 dark:bg-obsidian-2 rounded-lg text-[9px] font-black text-accent-lime">
              Reference Discovery
            </div>
            <button 
              onClick={() => setShowManualForm(true)}
              className="flex items-center gap-2 px-3 py-1 bg-accent-lime/10 hover:bg-accent-lime/20 text-accent-lime rounded-lg text-[9px] font-black transition-all"
            >
              <HugeiconsIcon icon={AddCircleIcon} size={10} />
              Input Manual
            </button>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Literature Vault
          </h2>
        </div>
        <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-sm mx-auto">
          Temukan dan kurasi referensi kunci sebagai landasan teoretis riset Anda.
        </p>
      </div>

      {/* Simplified Progress */}
      <div className="max-w-xl mx-auto space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-black text-slate-400">Collection Status</span>
          <span className="text-[10px] font-black text-accent-lime">{bibliography.length} / {TARGET_MIN} Articles</span>
        </div>
        <div className="h-1 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(bibliography.length / TARGET_MIN) * 100}%` }}
            className="h-full bg-accent-lime"
          />
        </div>
      </div>

      {/* Search Section */}
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <HugeiconsIcon icon={Search01Icon} size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Cari jurnal, artikel, atau DOI..."
              className="w-full bg-white dark:bg-obsidian-1 border border-slate-200 dark:border-white/5 rounded-xl pl-12 pr-4 py-3.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-accent-lime/10 transition-all"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="px-8 bg-accent-lime text-obsidian-0 rounded-xl font-bold text-xs hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-obsidian-0 transition-all disabled:opacity-20 flex items-center gap-2"
          >
            {isSearching ? <HugeiconsIcon icon={Loading01Icon} size={14} className="animate-spin" /> : <HugeiconsIcon icon={Search01Icon} size={14} />}
            <span>Cari</span>
          </button>
        </div>

        {/* Compact Search Results Header */}
        {searchResults.length > 0 && (
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400">Search Results</span>
              <span className="text-[10px] py-0.5 px-2 bg-slate-100 dark:bg-white/5 rounded text-slate-500 font-bold">{searchResults.length}</span>
            </div>
            <button 
              onClick={handleAddAll}
              className="text-[10px] font-black text-accent-lime hover:underline flex items-center gap-1.5"
            >
              <HugeiconsIcon icon={PlusSignIcon} size={10} />
              Add All to Vault
            </button>
          </div>
        )}
        {searchResults.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            {searchResults.map((paper, i) => {
              const alreadyAdded = bibliography.some((b) => b.title.toLowerCase() === paper.title.toLowerCase());
              return (
                <div key={i} className="p-4 bg-white dark:bg-obsidian-1 border border-slate-100 dark:border-white/5 rounded-xl flex items-start gap-3 hover:border-slate-300 dark:hover:border-white/10 transition-all group">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight line-clamp-2">{paper.title}</h4>
                    <div className="flex items-center gap-2">
                       <p className="text-[10px] text-slate-400 font-medium truncate">{paper.authors} • {paper.year}</p>
                       {(paper.url || paper.doi) && (
                         <a 
                           href={paper.url || `https://doi.org/${paper.doi}`}
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="text-slate-300 hover:text-accent-lime transition-colors"
                         >
                           <HugeiconsIcon icon={Link01Icon} size={10} />
                         </a>
                       )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddReference(paper)}
                    disabled={alreadyAdded}
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all",
                      alreadyAdded ? "bg-accent-lime/10 text-accent-lime" : "bg-slate-50 dark:bg-obsidian-2 text-slate-400 hover:bg-accent-lime hover:text-obsidian-0"
                    )}
                  >
                    {alreadyAdded ? <HugeiconsIcon icon={Tick01Icon} size={14} /> : <HugeiconsIcon icon={PlusSignIcon} size={14} />}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* List of Collected */}
      <div className="space-y-4 max-w-2xl mx-auto pt-8 border-t border-slate-100 dark:border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400">
             <HugeiconsIcon icon={BookOpen01Icon} size={14} />
             <span className="text-[10px] font-black">Literature Collection</span>
          </div>
          {bibliography.length > 0 && (
            <button 
              onClick={handleRemoveAll}
              className="text-[10px] font-black text-red-400 hover:underline flex items-center gap-1.5 transition-all"
            >
              <HugeiconsIcon icon={Delete02Icon} size={10} />
              Clear Vault
            </button>
          )}
        </div>

        <div className="space-y-2">
          {bibliography.length === 0 ? (
            <div className="py-12 border border-dashed border-slate-100 dark:border-white/5 rounded-2xl text-center">
               <p className="text-[11px] text-slate-400 font-medium italic italic">Vault ini masih kosong. Silakan cari dan tambahkan referensi.</p>
            </div>
          ) : (
            bibliography.map((ref, i) => (
              <div key={i} className="group p-3 bg-white dark:bg-obsidian-1 border border-slate-50 dark:border-white/[0.03] rounded-xl flex items-center gap-3">
                <div className="w-6 h-6 rounded bg-slate-50 dark:bg-obsidian-2 flex items-center justify-center text-accent-lime text-[9px] font-black shrink-0">{i + 1}</div>
                <div className="flex-1 min-w-0 pr-4 flex items-center gap-3">
                  <div className="flex-1 truncate">
                    <h4 className="text-[11px] font-bold text-slate-900 dark:text-white truncate">{ref.title}</h4>
                    <div className="flex items-center gap-2">
                       <p className="text-[9px] text-slate-400 font-medium truncate">{ref.authors} {ref.year ? `• ${ref.year}` : ""}</p>
                       {ref.storage_path && (
                         <div className="flex items-center gap-1 text-accent-lime animate-in fade-in zoom-in duration-300">
                         <HugeiconsIcon icon={FileValidationIcon} size={10} />
                           <span className="text-[9px] font-bold">PDF OK</span>
                         </div>
                       )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <label className="cursor-pointer group/upload">
                      <input 
                        type="file" 
                        accept=".pdf" 
                        className="hidden" 
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(i, e.target.files[0])}
                      />
                      <div className={cn(
                        "p-1.5 rounded-lg border transition-all flex items-center gap-1.5",
                        ref.storage_path 
                          ? "bg-accent-lime/10 border-accent-lime/20 text-accent-lime" 
                          : "bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 text-slate-400 hover:text-accent-lime"
                      )}>
                        {isUploading === ref.title ? (
                          <HugeiconsIcon icon={Loading01Icon} size={10} className="animate-spin" />
                        ) : ref.storage_path ? (
                          <>
                            <HugeiconsIcon icon={File01Icon} size={10} />
                            <span className="text-[8px] font-black">Replace PDF</span>
                          </>
                        ) : (
                          <>
                            <HugeiconsIcon icon={FileUploadIcon} size={10} />
                            <span className="text-[8px] font-black tracking-tight">Upload PDF</span>
                          </>
                        )}
                      </div>
                    </label>
                    
                    {(ref.url || ref.doi) && (
                      <a 
                        href={ref.url || `https://doi.org/${ref.doi}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-slate-300 hover:text-accent-lime transition-all p-1.5 bg-slate-50 dark:bg-white/5 rounded-lg"
                      >
                        <HugeiconsIcon icon={Link01Icon} size={10} />
                      </a>
                    )}
                  </div>
                </div>
                <button onClick={() => deleteReference(i)} className="p-1 px-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                  <HugeiconsIcon icon={Delete02Icon} size={12} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Minimal Footer */}
      <div className="pt-10 flex flex-col items-center space-y-6">
        {!canProceed && (
          <p className="text-[10px] text-amber-500 font-bold flex items-center gap-2">
            Required: {TARGET_MIN - bibliography.length} more sources
          </p>
        )}
        <button
          onClick={handleFinish}
          disabled={!canProceed}
          className="group bg-accent-lime text-obsidian-0 px-14 py-4 rounded-xl font-bold text-xs hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-obsidian-0 disabled:opacity-20 transition-all shadow-xl shadow-accent-lime/10 flex items-center gap-2.5 active:scale-95"
        >
          <span>Selesaikan Discovery</span>
          <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
        </button>
      </div>
      {/* Custom Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowClearConfirm(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-sm bg-white dark:bg-obsidian-1 border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-2xl space-y-6"
          >
            <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500 mx-auto">
              <HugeiconsIcon icon={Delete02Icon} size={24} />
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Kosongkan Vault?</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Tindakan ini akan menghapus semua referensi yang telah dikoleksi secara permanen.
              </p>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-3.5 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 rounded-xl font-bold text-[10px] hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
              >
                Batal
              </button>
              <button 
                onClick={confirmClearVault}
                className="flex-1 py-3.5 bg-red-500 text-white rounded-xl font-bold text-[10px] hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
              >
                Hapus Semua
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Manual Input Modal */}
      {showManualForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowManualForm(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative w-full max-w-md bg-white dark:bg-obsidian-1 border border-slate-200 dark:border-white/10 rounded-2xl p-8 shadow-2xl space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Input Manual Referensi</h3>
              <button 
                onClick={() => setShowManualForm(false)}
                className="text-slate-400 hover:text-white"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={18} />
              </button>
            </div>

            <form onSubmit={handleManualAdd} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 ml-1">Judul Artikel</label>
                <input 
                  autoFocus
                  required
                  placeholder="Masukkan judul lengkap..."
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl px-4 py-3 text-xs text-white"
                  value={manualRef.title}
                  onChange={e => setManualRef({...manualRef, title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 ml-1">Penulis</label>
                  <input 
                    required
                    placeholder="Nama penulis..."
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl px-4 py-3 text-xs text-white"
                    value={manualRef.authors}
                    onChange={e => setManualRef({...manualRef, authors: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 ml-1">Tahun Terbit</label>
                  <input 
                    type="number"
                    placeholder="2024"
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl px-4 py-3 text-xs text-white"
                    value={manualRef.year}
                    onChange={e => setManualRef({...manualRef, year: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 ml-1">DOI / URL (Opsional)</label>
                <input 
                  placeholder="10.1016/j..."
                  className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl px-4 py-3 text-xs text-white"
                  value={manualRef.doi}
                  onChange={e => setManualRef({...manualRef, doi: e.target.value})}
                />
              </div>

              <button 
                type="submit"
                className="w-full py-4 bg-accent-lime text-obsidian-0 rounded-xl font-black text-xs hover:bg-white transition-all shadow-xl shadow-accent-lime/10"
              >
                Simpan ke Vault
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
