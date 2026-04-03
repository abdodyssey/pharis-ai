
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex bg-white min-h-screen overflow-hidden">
      {/* 
        NOTE: Sidebar and content padding management is handled 
        specifically in nested layout.tsx files to keep this layout 
        as a pure Server Component.
      */}
      {children}
    </div>
  );
}
