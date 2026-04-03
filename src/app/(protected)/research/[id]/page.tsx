import { Suspense } from "react";
import ResearchPageClient from "./ResearchPageClient";
import { EditorSkeleton } from "@/components/shared/Skeletons";

export default async function ResearchEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-slate-50 w-full">
      {/* 
        We use a Client Component for the main logic (Stepper + Workspace), 
        but we can wrap the whole thing or parts of it in Suspense 
        here or inside the client component.
      */}
      <Suspense fallback={<EditorSkeleton />}>
        <ResearchPageClient id={id} />
      </Suspense>
    </div>
  );
}
