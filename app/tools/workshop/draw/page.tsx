"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import SketchDrawFrame from "@/components/workshop/SketchDrawFrame";

function FrameInner() {
  const params = useSearchParams();
  const sessionId = (params.get("s") || "").trim();

  if (!sessionId) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-[#f7f6f2] text-sm text-[#151f28]/50">
        Geen sessiecode
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-screen overflow-hidden">
      <SketchDrawFrame sessionId={sessionId} />
    </div>
  );
}

/** Bare drawing surface — embed as iframe from the workshop Schets tab. */
export default function WorkshopDrawPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[100dvh] items-center justify-center bg-[#f7f6f2] text-sm text-[#151f28]/50">
          Laden…
        </div>
      }
    >
      <FrameInner />
    </Suspense>
  );
}
