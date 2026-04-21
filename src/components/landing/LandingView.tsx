"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/shared/ThemeProvider";
import { supabase } from "@/lib/supabase";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  Sun01Icon, 
  Moon01Icon, 
  FlashIcon, 
  ArrowRight01Icon, 
  Layers01Icon, 
  Database01Icon, 
  SecurityCheckIcon, 
  ArrowRightIcon, 
  SparklesIcon, 
  BookOpen01Icon, 
  QuotesIcon, 
  MicroscopeIcon, 
  FileSearchIcon, 
  GlobeIcon, 
  CheckmarkCircle02Icon, 
  LockIcon, 
  ArrowUpRight01Icon, 
  SearchCodeIcon, 
  Layout01Icon 
} from "@hugeicons/core-free-icons";

export default function LandingView() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 400], [1, 0.95]);

  useEffect(() => {
    setMounted(true);
    // Check session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-white transition-colors duration-500 selection:bg-accent-lime/30 selection:text-accent-lime font-sans overflow-x-hidden">
      {/* Background Ornaments */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-lime/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03] pointer-events-none" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] transition-all duration-500 border-b border-slate-200 dark:border-white/5 bg-white/70 dark:bg-slate-950/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-slate-950 dark:bg-slate-900 border border-white/10 rounded-lg flex items-center justify-center text-accent-lime shadow-2xl transition-all duration-500 group-hover:border-accent-lime/50 group-hover:shadow-accent-lime/10">
              <HugeiconsIcon icon={FlashIcon} className="w-5 h-5 fill-accent-lime" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tighter leading-none">PharisAI</span>
              <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 tracking-tight mt-0.5 uppercase">Intelligence Lab</span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-12">
            {[
              { name: "Methodology", id: "methodology" },
              { name: "Features", id: "features" },
              { name: "Pricing", id: "pricing" },
              { name: "Enterprise", id: "enterprise" }
            ].map((item) => (
              <button 
                key={item.id} 
                onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' })}
                className="text-[12px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-accent-lime transition-all tracking-tight relative group"
              >
                {item.name}
                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-slate-900 dark:bg-accent-lime transition-all group-hover:w-full" />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 lg:gap-6">
            <button 
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-accent-lime transition-all bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10"
            >
               {mounted && theme === "dark" ? <HugeiconsIcon icon={Sun01Icon} size={18} /> : <HugeiconsIcon icon={Moon01Icon} size={18} />}
            </button>
            
            {isLoggedIn ? (
              <Link href="/overview">
                <Button size="sm" className="rounded-lg px-8 bg-slate-950 dark:bg-white text-white dark:text-slate-950 hover:bg-accent-lime dark:hover:bg-accent-lime border-none h-11 text-[11px] font-black shadow-xl shadow-slate-200 dark:shadow-white/5">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login" className="hidden sm:block text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors tracking-tight leading-none">
                  Login
                </Link>
                <Link href="/register">
                  <Button size="sm" className="rounded-lg px-8 bg-slate-950 dark:bg-white text-white dark:text-slate-950 hover:bg-accent-lime dark:hover:bg-accent-lime border-none h-11 text-xs font-black shadow-xl shadow-slate-200 dark:shadow-white/5">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section 
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative pt-32 pb-4 md:pt-40 md:pb-8 z-10 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-col items-center text-center">
            {/* Value Indicator */}
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="group px-4 py-2 rounded-full bg-white/5 dark:bg-accent-lime/5 border border-slate-200 dark:border-accent-lime/20 text-slate-500 dark:text-accent-lime text-[11px] font-black tracking-tight flex items-center gap-2.5 backdrop-blur-xl mb-12 shadow-sm transition-all hover:border-accent-lime/40"
            >
               <span className="relative flex h-2 w-2">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-lime opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-lime"></span>
               </span>
               <span className="uppercase font-mono opacity-80">Grounded Research AI</span>
               <div className="h-3 w-px bg-slate-200 dark:bg-white/10" />
               <span>Sains bermula dari data, bukan halusinasi.</span>
            </motion.div>

            <motion.h1 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8, delay: 0.1 }}
               className="text-4xl md:text-6xl lg:text-7xl font-sans font-black tracking-tighter leading-[1.05] text-slate-900 dark:text-white max-w-4xl"
            >
               riset akademik, <br />
               tanpa <span className="text-accent-lime italic">kompromi ilmiah.</span>
            </motion.h1>

            <motion.p 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8, delay: 0.2 }}
               className="mt-8 text-base md:text-lg text-slate-500 dark:text-slate-400 font-medium max-w-xl leading-relaxed"
            >
               satu-satunya laboratorium intelegensi yang memvalidasi setiap klaim dengan data riil dari 200 juta sumber terverifikasi. selesaikan naskah imrad anda dengan integritas penuh.
            </motion.p>

            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ duration: 0.8, delay: 0.3 }}
               className="flex flex-col sm:flex-row items-center gap-4 pt-10"
            >
              <Link href={isLoggedIn ? "/overview" : "/register"}>
                <Button size="lg" className="rounded-xl px-12 h-14 text-[12px] font-black tracking-tight bg-slate-950 dark:bg-accent-lime text-white dark:text-slate-950 hover:bg-accent-lime dark:hover:bg-white transition-all shadow-xl shadow-accent-lime/10 group flex items-center justify-center gap-3">
                  {isLoggedIn ? "Masuk ke dashboard" : "Mulai riset sekarang"}
                  <HugeiconsIcon icon={ArrowRight01Icon} size={18} className="group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <button 
                onClick={() => document.getElementById('methodology')?.scrollIntoView({ behavior: 'smooth' })}
                className="h-14 px-8 rounded-xl text-[12px] font-bold text-slate-500 hover:text-slate-950 dark:hover:text-white flex items-center gap-3 transition-colors group"
              >
                Lihat metodologi
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-accent-lime group-hover:text-slate-950 transition-all shadow-sm">
                  <HugeiconsIcon icon={ArrowRightIcon} size={14} />
                </div>
              </button>
            </motion.div>

            {/* Visual Anchor: Perspective Mockup */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
              className="relative mt-20 w-full max-w-5xl group"
            >
              <div className="absolute inset-0 bg-accent-lime/20 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              <div className="relative rounded-2xl border border-white/5 bg-slate-900/50 backdrop-blur-3xl p-2 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden [perspective:1000px]">
                <img 
                  src="/assets/images/dashboard-mockup.png" 
                  alt="PharisAI Dashboard"
                  className="w-full h-auto rounded-xl shadow-2xl transition-all duration-1000 [transform:rotateX(5deg)] group-hover:[transform:rotateX(0deg)]"
                />
              </div>
            </motion.div>

            {/* Social Proof */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 1 }}
              className="mt-20 flex flex-col items-center gap-4"
            >
              <div className="flex -space-x-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-9 h-9 rounded-full border-2 border-slate-50 dark:border-slate-950 bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold">u{i}</div>
                ))}
                <div className="w-9 h-9 rounded-full border-2 border-slate-50 dark:border-slate-950 bg-accent-lime flex items-center justify-center text-slate-950 text-[10px] font-black shadow-lg shadow-accent-lime/20">
                  +1k
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-400 tracking-tight flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-lime" />
                dipercaya oleh 1,200+ akademisi di seluruh indonesia
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Metadata Stats Bar */}
      <section id="enterprise" className="py-16 border-y border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] backdrop-blur-md relative z-10 transition-colors">
        <div className="max-w-7xl mx-auto px-8">
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
              <StatItem label="verified sources" value="200m+" desc="semantic scholar index" />
              <StatItem label="average accuracy" value="99.4%" desc="grounded generation" />
              <StatItem label="time saved" value="85%" desc="literature discovery" />
              <StatItem label="academic citations" value="50k+" desc="daily processing" />
           </div>
        </div>
      </section>

      {/* Methodology Section */}
      <section id="methodology" className="py-32 relative z-10">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-20">
            <div className="md:col-span-3">
              <h2 className="text-4xl md:text-5xl font-sans font-semibold tracking-tight leading-tight text-slate-900 dark:text-slate-100">
                Metodologi penulisan <br />
                berbasis <span className="text-accent-lime">bukti nyata.</span>
              </h2>
            </div>
            <div className="md:col-span-2">
              <p className="text-slate-500 font-medium text-sm md:text-right max-w-sm tracking-tight leading-loose">
                Kami menggabungkan mesin pencari semantik dengan model bahasa besar yang terkunci pada data akademik. Hasilnya adalah penulisan yang traceable, auditable, dan scientific.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24">
            <FeatureCard 
              icon={<HugeiconsIcon icon={SecurityCheckIcon} className="text-accent-lime" />}
              title="Anti-halusinasi total"
              desc="Setiap paragraf yang dihasilkan wajib memiliki referensi dari basis data literatur riil. Sistem kami menolak membuat klaim tanpa bukti."
            />
            <FeatureCard 
              icon={<HugeiconsIcon icon={SearchCodeIcon} className="text-accent-lime" />}
              title="Pencarian semantik dalam"
              desc="Akses ke lebih dari 200 juta makalah ilmiah melalui integrasi Semantic Scholar. Temukan research gap dalam hitungan detik."
            />
            <FeatureCard 
              icon={<HugeiconsIcon icon={Layout01Icon} className="text-accent-lime" />}
              title="Alur kerja IMRAD murni"
              desc="Mengikuti struktur standar jurnal internasional: Introduction, Methods, Results, and Discussion. Terstruktur secara profesional."
            />
          </div>
        </div>
      </section>

      {/* Precision Pricing */}
      <section id="pricing" className="py-32 border-t border-slate-200 dark:border-white/5 relative z-10 transition-colors">
        <div id="features" className="max-w-7xl mx-auto px-8 pt-10">
           <div className="text-center space-y-3 mb-20">
              <h2 className="text-4xl md:text-5xl font-sans font-semibold text-slate-900 dark:text-white">Investasi akademis.</h2>
              <p className="text-slate-500 font-bold tracking-tight text-[10px]">Pilih skala laboratorium yang Anda butuhkan.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
              <PricingCard 
                title="Standard"
                price="0"
                desc="Eksplorasi awal untuk mahasiswa dan peneliti mandiri."
                features={[
                  "Kapasitas 2 Artikel Riset",
                  "Verified Search Results",
                  "Academic Editor Access",
                  "No Document Export"
                ]}
                cta="Mulai Gratis"
              />
              <PricingCard 
                premium
                title="Education"
                price="149k"
                desc="Dukungan untuk publikasi jurnal internasional individu."
                features={[
                  "Kapasitas 10 Artikel Riset",
                  "Full PDF & DOCX Export",
                  "Priority AI Processing",
                  "Unlimited Lit. Vault Storage"
                ]}
                cta="Upgrade Lab Access"
                badge="Terpopuler"
              />
              <PricingCard 
                title="Institutional"
                price="599k"
                desc="Solusi komprehensif untuk dosen dan laboratorium universitas."
                features={[
                  "Unlimited Research Articles",
                  "Collaborative Research Vault",
                  "Departmental Analytics",
                  "Dedicated Academic Support"
                ]}
                cta="Kontak Faculty Sales"
              />
           </div>
        </div>
      </section>

      {/* Refined Footer */}
      <footer className="py-24 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#020617] relative z-10 transition-colors">
        <div className="max-w-7xl mx-auto px-8">
           <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
              <div className="md:col-span-1 space-y-6">
                 <Link href="/" className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-slate-900 border border-white/10 rounded-lg flex items-center justify-center text-accent-lime">
                     <HugeiconsIcon icon={FlashIcon} size={16} />
                   </div>
                   <span className="text-lg font-black tracking-tighter whitespace-nowrap">PharisAI</span>
                 </Link>
                 <p className="text-xs font-medium text-slate-500 leading-relaxed">
                   Masa depan penulisan akademik yang berbasis bukti dan integritas ilmiah.
                 </p>
              </div>
              
              <FooterGroup title="Platform" links={["Methodology", "Pricing", "Features", "Security"]} />
              <FooterGroup title="Resources" links={["Documentation", "API Reference", "Academic Guides", "Citations"]} />
              <FooterGroup title="Company" links={["About Us", "Contact", "Privacy Policy", "Terms of Service"]} />
           </div>

           <div className="pt-10 border-t border-slate-200 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
              <span className="text-[10px] font-bold text-slate-600 tracking-tight">&copy; 2026 Pharis Intelligence Academy</span>
              <div className="flex items-center gap-8">
                 <button className="text-[10px] font-bold text-slate-600 hover:text-white transition-colors">Twitter</button>
                 <button className="text-[10px] font-bold text-slate-600 hover:text-white transition-colors">LinkedIn</button>
                 <button className="text-[10px] font-bold text-slate-600 hover:text-white tracking-tight transition-colors">Scholar</button>
              </div>
           </div>
        </div>
      </footer>
    </div>
  );
}

function StatItem({ label, value, desc }: { label: string, value: string, desc: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 tracking-tight uppercase">{label}</p>
      <div className="flex items-baseline gap-2">
         <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{value}</h4>
      </div>
      <p className="text-[9px] font-bold text-slate-500 tracking-tight">{desc}</p>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="p-10 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-accent-lime/30 transition-all duration-500 group">
      <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
        {icon}
      </div>
      <div className="space-y-4">
        <h3 className="text-xl font-sans font-semibold text-slate-900 dark:text-white">{title}</h3>
        <p className="text-sm font-medium text-slate-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function PricingCard({ title, price, desc, features, cta, premium, badge }: { title: string, price: string, desc: string, features: string[], cta: string, premium?: boolean, badge?: string }) {
  return (
    <div className={cn(
      "relative p-10 rounded-2xl border transition-all duration-500 group",
      premium 
        ? "bg-white dark:bg-white text-slate-950 border-slate-200 dark:border-white shadow-2xl scale-105 z-10" 
        : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-900 dark:text-white hover:border-slate-300 dark:hover:bg-white/[0.08]"
    )}>
      {badge && (
        <div className="absolute top-8 right-8 px-4 py-1 bg-accent-lime text-slate-950 text-[9px] font-black tracking-tight rounded-md">
           {badge}
        </div>
      )}
      <div className="space-y-8">
        <div className="space-y-3">
           <h3 className={cn("text-xl font-sans font-semibold", premium ? "text-slate-950" : "text-slate-900 dark:text-white")}>{title}</h3>
           <div className="flex items-baseline gap-2">
              <span className="text-sm font-bold opacity-60">IDR</span>
              <span className="text-5xl font-black tracking-tighter">{price}</span>
              <span className="text-xs font-bold opacity-60">/mo</span>
           </div>
           <p className={cn("text-[13px] font-medium leading-relaxed", premium ? "text-slate-600" : "text-slate-600 dark:text-slate-500")}>{desc}</p>
        </div>

        <div className={cn("w-full h-px", premium ? "bg-slate-200" : "bg-slate-200 dark:bg-white/10")} />

        <ul className="space-y-4">
           {features.map((f, i) => (
             <li key={i} className="flex items-center gap-3">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className={premium ? "text-slate-900" : "text-accent-lime"} />
                <span className={cn("text-xs font-bold tracking-tight", premium ? "text-slate-800" : "text-slate-700 dark:text-slate-300")}>{f}</span>
             </li>
           ))}
        </ul>

        <Link href="/register" className="block pt-4">
           <Button className={cn(
             "w-full h-15 rounded-xl text-[11px] font-black tracking-tight transition-all",
             premium 
              ? "bg-slate-950 text-white hover:bg-accent-lime hover:text-slate-950 shadow-none dark:shadow-none" 
              : "bg-slate-100 dark:bg-white text-slate-950 hover:bg-accent-lime dark:hover:bg-accent-lime shadow-none dark:shadow-none border border-slate-200 dark:border-transparent"
           )}>
             {cta}
           </Button>
        </Link>
      </div>
    </div>
  );
}

function FooterGroup({ title, links }: { title: string, links: string[] }) {
  return (
    <div className="space-y-8">
      <h5 className="text-[10px] font-black text-slate-400 dark:text-slate-600 tracking-tight uppercase">{title}</h5>
      <ul className="space-y-4">
        {links.map(link => (
          <li key={link}>
            <button className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-accent-lime transition-colors tracking-tight text-left">{link}</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
