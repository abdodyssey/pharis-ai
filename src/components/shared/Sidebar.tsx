"use client";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { FlashIcon, ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import SidebarNav from "@/components/shared/SidebarNav";
import { useUIStore } from "@/store/useUIStore";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <motion.aside 
      animate={{ width: sidebarCollapsed ? 80 : 260 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="hidden md:flex flex-col bg-white dark:bg-obsidian-1 h-screen sticky top-0 shrink-0 border-r border-slate-100 dark:border-white/5 shadow-[1px_0_0_0_rgba(0,0,0,0.02)] relative z-50 transition-colors"
    >
      {/* Refined Branding */}
      <div className={cn(
        "p-6 pb-4 flex items-center justify-between",
        sidebarCollapsed && "px-4 justify-center"
      )}>
        <Link href="/" className="flex items-center gap-3 group" aria-label="PharisAI Dashboard">
          <div className="w-9 h-9 bg-slate-900 dark:bg-accent-lime rounded-xl flex items-center justify-center text-slate-950 shadow-lg shadow-accent-lime/10 transition-all duration-500 group-hover:rotate-6 shrink-0">
            <HugeiconsIcon icon={FlashIcon} className="w-5 h-5 fill-white dark:fill-slate-950" />
          </div>
          {!sidebarCollapsed && (
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-none whitespace-nowrap"
            >
              PharisAI
            </motion.span>
          )}
        </Link>
        
        {/* Toggle Button */}
        {!sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg transition-all"
            title="Collapse Sidebar"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
          </button>
        )}
      </div>
      
      {sidebarCollapsed && (
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-obsidian-1 border border-slate-100 dark:border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-accent-lime shadow-sm z-50"
          title="Expand Sidebar"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={14} className="rotate-180" />
        </button>
      )}

      {/* Navigation Layer */}
      <SidebarNav />
    </motion.aside>
  );
}
