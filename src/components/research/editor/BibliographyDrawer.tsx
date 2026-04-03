"use client";

import { useState } from "react";
import { X, BookOpen, ExternalLink, Copy, Check } from "lucide-react";
import { useResearchStore } from "@/store/useResearchStore";
import { BibliographyEntry } from "@/types/research";

interface BibliographyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BibliographyDrawer({ isOpen, onClose }: BibliographyDrawerProps) {
  const { bibliography } = useResearchStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyCitation = (entry: BibliographyEntry, index: number) => {
    const citation = `${entry.authors} (${entry.year || "n.d."}). ${entry.title}.`;
    navigator.clipboard.writeText(citation);
    setCopiedId(index.toString());
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/20 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="relative w-full max-w-md h-full bg-slate-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-out border-l border-slate-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex justify-between items-center bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen size={18} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-950 tracking-tight">Daftar Pustaka</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{bibliography.length} Referensi Terintegrasi</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-all group"
          >
            <X size={20} className="text-slate-400 group-hover:text-slate-950" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {bibliography.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                <BookOpen size={32} />
              </div>
              <div>
                <p className="text-slate-950 font-bold">Belum Ada Referensi</p>
                <p className="text-sm text-slate-400">Gunakan AI untuk mencari literatur yang relevan.</p>
              </div>
            </div>
          ) : (
            bibliography.map((entry, index) => (
              <div 
                key={index} 
                className="group bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-200 hover:shadow-md transition-all duration-300"
              >
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-950 leading-snug group-hover:text-blue-700 transition-colors">
                    {entry.title}
                  </h4>
                  
                  <div className="space-y-1">
                    <p className="text-xs text-slate-600 font-medium">
                      {entry.authors}
                    </p>
                    {entry.year && (
                      <span className="inline-block px-2 py-0.5 bg-slate-100 text-[10px] font-bold text-slate-500 rounded-md">
                        {entry.year}
                      </span>
                    )}
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <a 
                      href={entry.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-xl text-xs font-bold transition-all border border-transparent hover:border-blue-100"
                    >
                      <ExternalLink size={14} />
                      <span>Buka Sumber</span>
                    </a>
                    
                    <button
                      onClick={() => handleCopyCitation(entry, index)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-950 rounded-xl text-xs font-bold transition-all border border-slate-200 hover:border-slate-300"
                    >
                      {copiedId === index.toString() ? (
                        <>
                          <Check size={14} className="text-emerald-500" />
                          <span className="text-emerald-600">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>Sitasi</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-slate-200">
          <p className="text-[11px] text-slate-400 leading-relaxed text-center font-medium">
            Referensi diambil dari Semantic Scholar menggunakan data primer yang terbaru.
          </p>
        </div>
      </div>
    </div>
  );
}
