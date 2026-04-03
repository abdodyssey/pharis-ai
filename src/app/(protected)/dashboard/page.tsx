import { Suspense } from "react";
import CreateResearchBtn from "@/components/dashboard/CreateResearchBtn";
import DashboardStatsLoader from "@/components/dashboard/DashboardStatsLoader";
import RecentResearchLoader from "@/components/dashboard/RecentResearchLoader";
import { StatsSkeleton, RecentActivitySkeleton } from "@/components/shared/Skeletons";

export default function DashboardOverviewPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-10">
      {/* Static Header Section (Renders immediately) */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Ringkasan Riset
          </h1>
          <p className="text-slate-500 mt-1.5 font-medium">
            Pantau progres dan kelola aktivitas riset akademikmu.
          </p>
        </div>
        <CreateResearchBtn />
      </header>

      {/* Dynamic Stats - Suspense Boundary */}
      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStatsLoader />
      </Suspense>

      {/* Dynamic Recent Activity - Suspense Boundary */}
      <Suspense fallback={<RecentActivitySkeleton />}>
        <RecentResearchLoader />
      </Suspense>
    </div>
  );
}
