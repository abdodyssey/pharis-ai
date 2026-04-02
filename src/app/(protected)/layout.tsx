import Sidebar from "@/components/shared/Sidebar";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex bg-white min-h-screen">
      {/* Sidebar - Hidden on Mobile */}
      <Sidebar />
      
      {/* Main Content */}
      <main className="flex-1 bg-white min-h-screen overflow-y-auto">
        <div className="max-w-6xl mx-auto py-8 px-6 lg:px-12">
          {children}
        </div>
      </main>
    </div>
  );
}
