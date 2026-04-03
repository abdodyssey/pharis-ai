
export function SidebarSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <div className="h-8 w-32 bg-slate-100 animate-pulse rounded-lg" />
      <div className="space-y-2">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <div className="h-2 w-2 bg-slate-200 animate-pulse rounded-full" />
            <div className="h-4 flex-1 bg-slate-100 animate-pulse rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function EditorSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-12 space-y-10">
      <div className="space-y-4">
        <div className="h-12 w-3/4 bg-slate-100 animate-pulse rounded-2xl" />
        <div className="h-4 w-1/4 bg-slate-50 animate-pulse rounded-md" />
      </div>
      <div className="space-y-4 pt-10">
        {[...Array(12)].map((_, i) => (
          <div 
            key={i} 
            className="h-4 bg-slate-50 animate-pulse rounded-md" 
            style={{ width: `${(i % 5) * 10 + 60}%` }}
          />
        ))}
      </div>
      <div className="space-y-4 pt-10">
        {[...Array(8)].map((_, i) => (
          <div 
            key={i} 
            className="h-4 bg-slate-50 animate-pulse rounded-md" 
            style={{ width: `${(i % 4) * 10 + 60}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-3">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-slate-100 animate-pulse rounded-xl" />
            <div className="space-y-2">
              <div className="h-3 w-16 bg-slate-50 animate-pulse rounded-md" />
              <div className="h-6 w-10 bg-slate-100 animate-pulse rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function RecentActivitySkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="h-48 bg-slate-50 border border-slate-100 rounded-3xl animate-pulse" />
      ))}
    </div>
  );
}
