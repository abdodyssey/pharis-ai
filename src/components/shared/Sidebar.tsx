import Link from "next/link";
import { 
  FlaskConical
} from "lucide-react";
import SidebarNav from "@/components/shared/SidebarNav";

export default function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-50 border-r border-slate-200 h-screen sticky top-0 shrink-0">
      {/* Branding */}
      <div className="p-6 border-b border-slate-200 bg-white">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white shadow-lg shadow-slate-200">
            <FlaskConical className="w-5 h-5" />
          </div>
          <span className="text-xl font-black text-slate-800 tracking-tight">PharisAI</span>
        </Link>
      </div>

      {/* Navigation - Client Component for active state and interactivity */}
      <SidebarNav />
    </aside>
  );
}
