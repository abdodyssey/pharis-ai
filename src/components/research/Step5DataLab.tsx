"use client";

import { useState } from "react";
import { useResearchStore } from "@/store/useResearchStore";
import { useToastStore } from "@/store/useToastStore";
import { VariableDefinition, HypothesisDefinition } from "@/types/research";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  PlusSignIcon, 
  Delete02Icon, 
  ArrowRight01Icon, 
  Sorting05Icon, 
  Idea01Icon, 
  File01Icon,
  AlertCircleIcon,
  CheckmarkCircle02Icon,
  MouseIcon
} from "@hugeicons/core-free-icons";
import { motion, AnimatePresence } from "framer-motion";

export default function Step5DataLab() {
  const {
    variables,
    hypotheses,
    rawDataNotes,
    setVariables,
    setHypotheses,
    setRawDataNotes,
    saveDataLabToDb,
    completeStep,
    updateResearchData,
  } = useResearchStore();

  const { addToast } = useToastStore();
  const [isSaving, setIsSaving] = useState(false);

  const canProceed = variables.length > 0 && hypotheses.length > 0;

  // ─── Variable Management ───────────────────────────────────────
  const addVariable = () => {
    const newVar: VariableDefinition = {
      id: `var-${Date.now()}`,
      name: "",
      type: "independent",
      description: "",
      indicator: "",
    };
    setVariables([...variables, newVar]);
  };

  const updateVariable = (
    id: string,
    field: keyof VariableDefinition,
    value: string
  ) => {
    setVariables(
      variables.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    );
  };

  const removeVariable = (id: string) => {
    setVariables(variables.filter((v) => v.id !== id));
  };

  // ─── Hypothesis Management ─────────────────────────────────────
  const addHypothesis = () => {
    const newHyp: HypothesisDefinition = {
      id: `hyp-${Date.now()}`,
      statement: "",
      type: "H1",
    };
    setHypotheses([...hypotheses, newHyp]);
  };

  const updateHypothesis = (
    id: string,
    field: keyof HypothesisDefinition,
    value: string
  ) => {
    setHypotheses(
      hypotheses.map((h) => (h.id === id ? { ...h, [field]: value } : h))
    );
  };

  const removeHypothesis = (id: string) => {
    setHypotheses(hypotheses.filter((h) => h.id !== id));
  };

  // ─── Save & Proceed ───────────────────────────────────────────
  const handleProceed = async () => {
    if (!canProceed) return;
    setIsSaving(true);
    try {
      await saveDataLabToDb();
      await completeStep(5);
      updateResearchData({ currentStep: 6 });
      addToast({
        type: "success",
        message: "Data Lab Saved",
        description: "Variables and hypotheses locked. Proceeding to IMRAD Drafting.",
      });
    } catch (err) {
      console.error(err);
      addToast({
        type: "error",
        message: "Save Failed",
        description: "Failed to save Data Lab. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-16 space-y-12">
      {/* Header Section */}
      <div className="space-y-4 max-w-2xl">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <div className="px-2 py-0.5 bg-accent-lime/10 text-accent-lime text-[10px] font-black uppercase tracking-widest rounded-md border border-accent-lime/20">
            Phase 05
          </div>
          <div className="h-px w-10 bg-slate-200 dark:bg-white/10" />
        </motion.div>
        
        <motion.h2 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight"
        >
          Research <span className="text-accent-lime">Logic Lab</span>
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed"
        >
          Petakan variabel penelitian dan rumuskan hipotesis untuk menjadi fondasi penulisan IMRAD Anda.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 gap-12">
        {/* ─── Variables Section ─────────────────────────────────── */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-obsidian-1 border border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-400 dark:text-slate-500 shadow-sm shadow-slate-200/50 dark:shadow-black/50">
                <HugeiconsIcon icon={Sorting05Icon} size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white leading-none">
                  Variabel Penelitian
                </h3>
                <p className="text-[11px] text-slate-400 font-bold mt-1">
                  Independent, Dependent, & Control Variables
                </p>
              </div>
            </div>
            
            <button
              onClick={addVariable}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-accent-lime text-white dark:text-obsidian-0 rounded-xl text-[11px] font-black hover:scale-105 active:scale-95 transition-all shadow-lg shadow-slate-900/20 dark:shadow-accent-lime/20"
            >
              <HugeiconsIcon icon={PlusSignIcon} size={14} />
              Add Variable
            </button>
          </div>

          <div className="space-y-4">
            <AnimatePresence mode="popLayout" initial={false}>
              {variables.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-12 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-2xl text-center"
                >
                  <HugeiconsIcon icon={MouseIcon} className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                  <p className="text-sm font-bold text-slate-400">
                    Belum ada variabel. Tambahkan satu untuk memulai.
                  </p>
                </motion.div>
              ) : (
                variables.map((v, idx) => (
                  <motion.div
                    key={v.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="relative group p-6 bg-white dark:bg-obsidian-1 border border-slate-200 dark:border-white/5 rounded-xl shadow-sm hover:shadow-xl dark:hover:shadow-lime-500/5 hover:border-accent-lime/30 transition-all"
                  >
                    <div className="flex flex-col lg:flex-row gap-6 items-start">
                      <div className="w-full lg:w-48 shrink-0 space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type</label>
                        <select
                          value={v.type}
                          onChange={(e) => updateVariable(v.id, "type", e.target.value)}
                          className={cn(
                            "w-full bg-slate-50 dark:bg-obsidian-2 border px-4 py-3 rounded-xl text-xs font-black outline-none transition-all cursor-pointer",
                            v.type === "independent" ? "border-indigo-500/20 text-indigo-600 dark:text-indigo-400" :
                            v.type === "dependent" ? "border-emerald-500/20 text-emerald-600 dark:text-emerald-400" :
                            "border-slate-400/20 text-slate-500"
                          )}
                        >
                          <option value="independent">Independent (X)</option>
                          <option value="dependent">Dependent (Y)</option>
                          <option value="control">Control (Z)</option>
                        </select>
                      </div>

                      <div className="flex-1 w-full space-y-4">
                        <div className="flex items-center gap-3">
                          <input
                            value={v.name}
                            onChange={(e) => updateVariable(v.id, "name", e.target.value)}
                            placeholder="Nama Variabel (e.g. Kualitas Layanan)"
                            className="flex-1 bg-transparent border-none text-lg font-black text-slate-900 dark:text-white placeholder-slate-300 dark:placeholder-slate-800 outline-none"
                          />
                          <button
                            onClick={() => removeVariable(v.id)}
                            className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                          >
                            <HugeiconsIcon icon={Delete02Icon} size={18} />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                            <input
                              value={v.description}
                              onChange={(e) => updateVariable(v.id, "description", e.target.value)}
                              placeholder="Definisi Operasional..."
                              className="w-full bg-slate-50 dark:bg-obsidian-2 border border-slate-100 dark:border-white/5 px-4 py-3 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 outline-none focus:border-accent-lime/40"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Indicators</label>
                            <input
                              value={v.indicator || ""}
                              onChange={(e) => updateVariable(v.id, "indicator", e.target.value)}
                              placeholder="Indikator / Instrumen..."
                              className="w-full bg-slate-50 dark:bg-obsidian-2 border border-slate-100 dark:border-white/5 px-4 py-3 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 outline-none focus:border-accent-lime/40"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Index Badge */}
                    <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-10 bg-slate-100 dark:bg-obsidian-2 flex items-center justify-center rounded-lg border border-slate-200 dark:border-white/5 text-[10px] font-black text-slate-400 group-hover:bg-accent-lime group-hover:text-obsidian-0 group-hover:border-accent-lime transition-all">
                      {idx + 1}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* ─── Hypotheses Section ────────────────────────────────── */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-white dark:bg-obsidian-1 border border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-400 dark:text-slate-500 shadow-sm shadow-slate-200/50 dark:shadow-black/50">
                <HugeiconsIcon icon={Idea01Icon} size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white leading-none">
                  Hipotesis Riset
                </h3>
                <p className="text-[11px] text-slate-400 font-bold mt-1">
                  Predictive Scientific Statements
                </p>
              </div>
            </div>
            
            <button
              onClick={addHypothesis}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl text-[11px] font-black transition-all border border-slate-200 dark:border-white/5"
            >
              <HugeiconsIcon icon={PlusSignIcon} size={14} />
              Add Hypothesis
            </button>
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout" initial={false}>
              {hypotheses.map((h, idx) => (
                <motion.div
                  key={h.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-start gap-4"
                >
                  <div className="flex-1 p-4 bg-slate-50/50 dark:bg-obsidian-1/50 border border-slate-100 dark:border-white/5 rounded-2xl flex items-center gap-4 group">
                    <select
                      value={h.type}
                      onChange={(e) => updateHypothesis(h.id, "type", e.target.value)}
                      className="bg-white dark:bg-obsidian-2 border border-slate-100 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-black text-accent-lime outline-none cursor-pointer"
                    >
                      <option value="H0">H₀</option>
                      <option value="H1">H₁</option>
                    </select>
                    <textarea
                      value={h.statement}
                      onChange={(e) => updateHypothesis(h.id, "statement", e.target.value)}
                      placeholder="e.g., Terdapat pengaruh signifikan antara X terhadap Y..."
                      rows={1}
                      className="flex-1 bg-transparent border-none text-sm font-bold text-slate-700 dark:text-slate-200 placeholder-slate-300 dark:placeholder-slate-800 outline-none resize-none"
                    />
                    <button
                      onClick={() => removeHypothesis(h.id)}
                      className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={16} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>

        {/* ─── Raw Data Notes ────────────────────────────────────── */}
        <section className="bg-slate-900 dark:bg-obsidian-1 border border-slate-800 dark:border-white/5 rounded-2xl p-10 space-y-6 overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 text-white/5 pointer-events-none group-hover:text-accent-lime/10 transition-colors">
            <HugeiconsIcon icon={File01Icon} size={120} />
          </div>
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500">
              <HugeiconsIcon icon={File01Icon} size={20} />
            </div>
            <div>
              <span className="text-lg font-black text-white block">
                Raw Data Scratchpad
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                Optional &middot; Preliminary findings or observations
              </span>
            </div>
          </div>
          
          <textarea
            value={rawDataNotes}
            onChange={(e) => setRawDataNotes(e.target.value)}
            placeholder="Tuliskan temuan data mentah, catatan observasi, atau hasil awal kuesioner Anda di sini..."
            rows={6}
            className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-6 text-sm text-slate-300 placeholder-slate-600 outline-none focus:border-accent-lime/20 focus:bg-white/[0.07] transition-all resize-none leading-relaxed relative z-10"
          />
        </section>
      </div>

      {/* Action Footer */}
      <footer className="pt-10 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-5 h-5 rounded-full flex items-center justify-center transition-all",
            canProceed ? "bg-accent-lime text-obsidian-0" : "bg-slate-100 dark:bg-white/5 text-slate-400"
          )}>
            <HugeiconsIcon icon={canProceed ? CheckmarkCircle02Icon : AlertCircleIcon} size={12} />
          </div>
          <p className="text-[11px] font-bold text-slate-500">
            {canProceed 
              ? "All logic points validated. Ready for drafting." 
              : "Masukkan minimal 1 variabel dan 1 hipotesis untuk lanjut."}
          </p>
        </div>

        <button
          onClick={handleProceed}
          disabled={!canProceed || isSaving}
          className="group w-full sm:w-auto bg-accent-lime text-obsidian-0 px-10 py-5 rounded-xl font-black text-sm hover:bg-slate-900 hover:text-white disabled:opacity-20 disabled:grayscale transition-all shadow-xl shadow-slate-900/10 dark:shadow-accent-lime/20 flex items-center justify-center gap-4 active:scale-95"
        >
          {isSaving ? (
            <>
              <div className="w-5 h-5 border-2 border-obsidian-0/30 border-t-obsidian-0 rounded-full animate-spin" />
              <span>Saving Progress...</span>
            </>
          ) : (
            <>
              <span>Lock Logic & Start Drafting</span>
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={20}
                className="group-hover:translate-x-1 transition-transform"
              />
            </>
          )}
        </button>
      </footer>
    </div>
  );
}
