"use client";

import { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Tick01Icon, 
  CreditCardIcon, 
  FlashIcon, 
  Clock01Icon, 
  ArrowRight01Icon,
  SecurityCheckIcon,
  StarIcon
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useToastStore } from "@/store/useToastStore";
import ActionConfirmDialog from "@/components/shared/ActionConfirmDialog";

const PLANS = [
  {
    id: "free",
    name: "Standard",
    price: "0",
    desc: "Eksplorasi awal untuk mahasiswa dan peneliti mandiri.",
    features: [
      "Kapasitas 2 Artikel Jurnal/Riset",
      "Tanpa Fitur Ekspor (View Only)"
    ],
  },
  {
    id: "pro",
    name: "Education",
    price: "149.000",
    desc: "Dukungan untuk publikasi jurnal internasional individu.",
    features: [
      "Kapasitas 10 Artikel Jurnal/Riset",
      "Ekspor PDF & DOCX (Tanpa Batas)"
    ],
    premium: true
  },
  {
    id: "inst",
    name: "Institutional",
    price: "599.000",
    desc: "Solusi komprehensif untuk dosen dan lab universitas.",
    features: [
      "Unlimited Research Articles",
      "Collaborative Research Vault",
      "Departmental Analytics"
    ],
  }
];

export default function BillingPage() {
  const [currentPlan, setCurrentPlan] = useState("free");
  const [isLoading, setIsLoading] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const { addToast } = useToastStore();

  useEffect(() => {
    async function loadPlan() {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // First try to check metadata for the simulation
        const metaPlan = user.user_metadata?.plan_type;
        if (metaPlan) {
          setCurrentPlan(metaPlan);
        } else {
          // Fallback to table if it exists, otherwise just stay 'free'
          const { data, error } = await supabase
            .from("user_subscriptions")
            .select("plan_type")
            .eq("user_id", user.id)
            .maybeSingle();
          
          if (!error && data?.plan_type) {
            setCurrentPlan(data.plan_type);
          }
        }
      }
      setIsLoading(false);
    }
    loadPlan();
  }, []);

  const handleUpgrade = async (planId: string) => {
    if (planId === currentPlan) return;
    setIsLoading(true);
    
    // Simulate payment processing delay
    await new Promise(r => setTimeout(r, 2000));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Simulation: Update metadata so it works even without the table
        await supabase.auth.updateUser({
          data: { plan_type: planId }
        });

        // Also try to update the table for future-proofing, but ignore errors
        await supabase.from("user_subscriptions").upsert({ 
          user_id: user.id, 
          plan_type: planId,
          updated_at: new Date().toISOString()
        });

        setCurrentPlan(planId);
        addToast({
          type: "success",
          message: planId === "pro" ? "Upgrade Berhasil!" : "Downgrade Selesai",
          description: planId === "pro" 
            ? "Paket Education aktif. Anda kini memiliki kuota 10 artikel & fitur ekspor penuh."
            : "Kembali ke paket Standard. Fitur terbatas telah diterapkan.",
        });

        // Sync with app state after a short delay to let them see the success toast
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      addToast({
        type: "error",
        message: "Proses Gagal",
        description: "Terjadi kesalahan saat memperbarui paket. Silakan coba lagi.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main 
      className="max-w-4xl mx-auto p-6 md:p-8 space-y-12 animate-in fade-in duration-500"
      suppressHydrationWarning
    >
      {/* Header */}
      <div className="space-y-1.5 pt-4 text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Billing & Plans</h1>
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Pilih paket yang sesuai dengan intensitas riset Anda. Buka batas hingga 10 riset agar alur akademik Anda tidak terputus.
        </p>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          
          return (
            <div 
              key={plan.name}
              className={cn(
                 "relative p-6 md:p-8 rounded-xl border transition-all duration-300 flex flex-col h-full shadow-sm hover:shadow-md hover:-translate-y-1",
                 plan.premium 
                  ? "bg-slate-950 dark:bg-obsidian-0 text-white border-slate-800 dark:border-accent-lime/30 shadow-2xl dark:shadow-none" 
                  : "bg-slate-50/50 dark:bg-obsidian-1 border-slate-200 dark:border-white/5 text-slate-900 dark:text-white"
              )}
            >
              {plan.premium && (
                 <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-accent-lime text-slate-950 text-[9px] font-bold rounded-md shadow-lg">
                    Most Recommended
                 </div>
              )}

              <div className="space-y-6 flex-1">
                 <div className="space-y-1">
                    <h3 className="text-base font-bold tracking-tight">{plan.name}</h3>
                    <p className={cn("text-[11px] font-medium leading-relaxed", plan.premium ? "text-slate-400" : "text-slate-500 dark:text-slate-400")}>
                      {plan.desc}
                    </p>
                 </div>

                 <div className="flex items-baseline gap-1.5 py-2">
                    <span className="text-[11px] font-bold opacity-60">IDR</span>
                    <span className="text-3xl font-bold tracking-tight">{plan.price}</span>
                    <span className={cn("text-[10px] font-medium opacity-60")}>/mo</span>
                 </div>

                 <div className={cn("w-full h-px", plan.premium ? "bg-white/5" : "bg-slate-200/60 dark:bg-white/5")} />

                 <ul className="space-y-3.5 pt-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                         <div className={cn("mt-1 w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 border", plan.premium ? "bg-accent-lime/10 border-accent-lime/20" : "bg-white dark:bg-white/5 border-slate-300/50 dark:border-white/10")}>
                            <HugeiconsIcon icon={Tick01Icon} size={10} className={cn(plan.premium ? "text-accent-lime" : "text-slate-500 dark:text-slate-400")} />
                         </div>
                         <span className="text-xs font-semibold leading-tight text-slate-600 dark:text-slate-300">{feature}</span>
                      </li>
                    ))}
                 </ul>
              </div>

              <Button 
                onClick={() => {
                  if (isCurrent && plan.id === "pro") {
                    setIsCancelDialogOpen(true);
                  } else {
                    handleUpgrade(plan.id);
                  }
                }}
                disabled={(isCurrent && plan.id === "free") || isLoading || (!isCurrent && currentPlan === "pro" && plan.id === "free")}
                isLoading={isLoading && (isCurrent ? plan.id === "pro" : true)}
                rightIcon={!isCurrent && !(currentPlan === "pro" && plan.id === "free") ? <HugeiconsIcon icon={ArrowRight01Icon} size={12} /> : undefined}
                className={cn(
                  "mt-8 h-11 rounded-xl font-bold text-[11px] transition-all",
                  (isCurrent && plan.id === "free") || (!isCurrent && currentPlan === "pro" && plan.id === "free")
                    ? "bg-slate-200/50 dark:bg-obsidian-2 text-slate-400 dark:text-slate-600 cursor-not-allowed border border-slate-200/50 dark:border-white/5 shadow-none" 
                    : isCurrent && plan.id === "pro"
                      ? "bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 shadow-none"
                      : plan.premium
                        ? "bg-accent-lime text-slate-950 hover:bg-white dark:hover:bg-white shadow-none" 
                        : "bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-200 shadow-lg shadow-slate-200 dark:shadow-white/5"
                )}
              >
                 {isCurrent && plan.id === "pro" 
                   ? "Cancel Plan" 
                   : (isCurrent && plan.id === "free")
                     ? "Active Plan"
                     : (!isCurrent && currentPlan === "pro" && plan.id === "free")
                       ? "Standard Tier"
                       : plan.premium 
                         ? "Upgrade to Pro" 
                         : "Select Standard"}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Trust & Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 max-w-3xl mx-auto">
         <div className="p-6 bg-slate-50 dark:bg-obsidian-2/50 border border-slate-200 dark:border-white/5 rounded-xl flex gap-5 group hover:border-indigo-100 dark:hover:border-indigo-500/20 transition-colors">
            <div className="w-10 h-10 bg-white dark:bg-obsidian-1 rounded-lg flex items-center justify-center text-indigo-500 shadow-sm border border-slate-100 dark:border-white/5 transition-transform group-hover:scale-105">
               <HugeiconsIcon icon={SecurityCheckIcon} size={20} />
            </div>
            <div className="space-y-0.5">
               <h4 className="text-xs font-bold text-slate-900 dark:text-white">Simulasi Upgrade (Mock)</h4>
               <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Tombol upgrade di atas tidak akan menagih metode pembayaran nyata dan digunakan untuk testing pembatasan kuota 10 slot artikel.</p>
            </div>
         </div>
         <div className="p-6 bg-slate-50 dark:bg-obsidian-2/50 border border-slate-200 dark:border-white/5 rounded-xl flex gap-5 group hover:border-slate-300 dark:hover:border-white/10 transition-colors">
            <div className="w-10 h-10 bg-white dark:bg-obsidian-1 rounded-lg flex items-center justify-center text-slate-900 dark:text-white shadow-sm border border-slate-100 dark:border-white/5 transition-transform group-hover:scale-105">
               <HugeiconsIcon icon={Clock01Icon} size={20} />
            </div>
            <div className="space-y-0.5">
               <h4 className="text-xs font-bold text-slate-900 dark:text-white">Seamless Sync</h4>
               <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Paket Anda diperbarui secara real-time pada seluruh platform tanpa perlu memuat ulang data atau antarmuka.</p>
            </div>
         </div>
      </div>

      <ActionConfirmDialog
        isOpen={isCancelDialogOpen}
        onOpenChange={setIsCancelDialogOpen}
        onConfirm={() => {
          setIsCancelDialogOpen(false);
          handleUpgrade("free");
        }}
        title="Batalkan Langganan Education?"
        description="Anda akan kembali ke paket Standard. Slot riset akan dibatasi menjadi 2 artikel dan fitur ekspor dokumen (PDF/DOCX) akan dinonaktifkan."
        confirmText="Ya, Batalkan"
        cancelText="Tetap di Education"
        variant="danger"
        isLoading={isLoading}
      />
    </main>
  );
}
