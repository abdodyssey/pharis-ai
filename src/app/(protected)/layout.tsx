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
  const isResearchPage = pathname?.startsWith("/research/");

  return (
    <div className="flex bg-white min-h-screen overflow-hidden">
      {/* Sidebar - Hidden on Research Pages and Mobile */}
      {!isResearchPage && <Sidebar />}
      
      {/* Main Content */}
      <main className={cn(
        "flex-1 bg-white min-h-screen",
        isResearchPage ? "p-0 overflow-hidden" : "py-8 px-6 lg:px-12 max-w-6xl mx-auto"
      )}>
        {children}
      </main>
    </div>
  );
}
