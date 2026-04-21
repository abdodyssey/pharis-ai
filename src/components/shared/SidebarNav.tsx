"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useResearchStore } from "@/store/useResearchStore";
import { useState, useEffect } from "react";
import { useTheme } from "@/components/shared/ThemeProvider";
import { HugeiconsIcon } from "@hugeicons/react";
import { 
  DashboardSquare01Icon, 
  File01Icon, 
  CreditCardIcon, 
  Settings01Icon, 
  Logout01Icon, 
  Sun01Icon, 
  Moon01Icon, 
  UserIcon, 
  CrownIcon 
} from "@hugeicons/core-free-icons";
import { useUIStore } from "@/store/useUIStore";
import { cn } from "@/lib/utils";
import ActionConfirmDialog from "@/components/shared/ActionConfirmDialog";

export default function SidebarNav() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const resetStore = useResearchStore((state) => state.resetStore);
   const { sidebarCollapsed } = useUIStore();
  const [user, setUser] = useState<any>(null);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    setMounted(true);
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const menuItems = [
    { name: "Overview", href: "/overview", icon: DashboardSquare01Icon },
    { name: "My Research", href: "/my-research", icon: File01Icon },
    { name: "Billing & Plan", href: "/billing", icon: CreditCardIcon },
    { name: "Account", href: "/account", icon: Settings01Icon },
  ];

   const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      resetStore();
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout failed:", err);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <nav className={`flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar ${sidebarCollapsed ? "px-2" : ""}`}>
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-semibold transition-all duration-200 group relative ${
                isActive 
                  ? "bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-accent-lime" 
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/[0.02]"
              } ${sidebarCollapsed ? "justify-center px-0" : ""}`}
              title={sidebarCollapsed ? item.name : ""}
            >
              <HugeiconsIcon icon={item.icon} className="w-4.5 h-4.5 shrink-0" strokeWidth={isActive ? 2 : 1.5} />
              {!sidebarCollapsed && (
                <span className="text-[13.5px] tracking-tight whitespace-nowrap">{item.name}</span>
              )}
              {isActive && (
                <div className="absolute left-0 w-1 h-4 bg-accent-lime rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Interface Utility Section */}
      <div className={`px-5 mb-4 ${sidebarCollapsed ? "px-2" : ""}`}>
        <div className={`flex items-center justify-between py-4 border-t border-slate-50 dark:border-white/5 ${sidebarCollapsed ? "justify-center" : ""}`}>
          {!sidebarCollapsed && (
            <span className="text-[9px] font-black tracking-tight text-slate-400 uppercase">Interface</span>
          )}
          <button 
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-9 h-9 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-accent-lime transition-all"
          >
             {mounted && theme === "dark" ? (
               <HugeiconsIcon icon={Sun01Icon} size={16} strokeWidth={2} />
             ) : (
               <HugeiconsIcon icon={Moon01Icon} size={16} strokeWidth={2} />
             )}
          </button>
        </div>
      </div>

      {/* User Session Footer */}
      <div className={`px-4 py-6 border-t border-slate-50 dark:border-white/5 bg-slate-50/30 dark:bg-obsidian-0/20 ${sidebarCollapsed ? "px-2" : ""}`}>
        <div className={`flex items-center justify-between ${sidebarCollapsed ? "flex-col gap-4" : ""}`}>
          <div className="flex items-center gap-2.5">
             <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-obsidian-2 border border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-500 overflow-hidden shrink-0">
                 <HugeiconsIcon icon={UserIcon} size={16} strokeWidth={1.5} />
             </div>
              {!sidebarCollapsed && (
               <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-950 dark:text-white tracking-tight leading-none">
                      {user?.user_metadata?.full_name || "Guest Researcher"}
                    </span>
                    {user?.user_metadata?.plan_type === "pro" && (
                       <HugeiconsIcon icon={CrownIcon} size={10} className="text-accent-lime fill-accent-lime" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-medium text-slate-400 truncate max-w-[80px]">
                      {user?.email || "loading..."}
                    </span>
                    {user?.user_metadata?.plan_type === "pro" && (
                      <span className="text-[8px] font-black bg-accent-lime/10 text-accent-lime px-1 rounded-sm tracking-tighter">
                        EDU
                      </span>
                    )}
                  </div>
               </div>
             )}
          </div>
          
           <button 
            onClick={() => setIsLogoutModalOpen(true)}
            disabled={isLoggingOut}
            className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all disabled:opacity-50"
            aria-label="Logout"
          >
             <HugeiconsIcon icon={Logout01Icon} size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <ActionConfirmDialog
        isOpen={isLogoutModalOpen}
        onOpenChange={setIsLogoutModalOpen}
        onConfirm={handleLogout}
        title="Akhiri Sesi Akses"
        description="Anda akan keluar dari ruang riset PharisAI. Menarik diri dari portal akan menangguhkan seluruh aktivitas penyimpanan sementara."
        confirmText="Ya, Keluar"
        cancelText="Batal"
        variant="danger"
        isLoading={isLoggingOut}
      />
    </div>
  );
}

