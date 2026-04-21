"use client";
import Sidebar from "@/components/shared/Sidebar";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isResearchPage = pathname?.startsWith("/research");

  return (
    <div className="flex bg-slate-50 dark:bg-obsidian-0 h-screen overflow-hidden transition-colors duration-300">
      {!isResearchPage && <Sidebar />}
      <main className={cn(
        "flex-1 overflow-y-auto overflow-x-hidden relative h-full bg-slate-50 dark:bg-obsidian-0",
        !isResearchPage && "p-10 lg:p-12"
      )}>
        {children}
      </main>
    </div>
  );
}

