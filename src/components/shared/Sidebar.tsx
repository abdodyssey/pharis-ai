"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Files, 
  Settings, 
  LogOut, 
  FlaskConical
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useResearchStore } from "@/store/useResearchStore";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const resetStore = useResearchStore((state) => state.resetStore);

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Semua Riset", href: "/dashboard/all", icon: Files },
    { name: "Pengaturan", href: "#", icon: Settings },
  ];

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error.message);
    } else {
      resetStore();
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-50 border-r border-slate-200 h-screen sticky top-0">
      {/* Branding */}
      <div className="p-6 border-b border-slate-200 bg-white">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-linear-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-100">
            <FlaskConical className="w-5 h-5" />
          </div>
          <span className="text-xl font-black text-slate-800 tracking-tight">PharisAI</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2 mt-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all group ${
                isActive 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-100" 
                  : "text-slate-500 hover:bg-slate-200/50 hover:text-slate-800"
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-600"}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Section / Logout */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all group"
        >
          <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-500" />
          Keluar
        </button>
      </div>
    </aside>
  );
}
