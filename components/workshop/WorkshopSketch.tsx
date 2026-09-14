"use client";

import { useRef } from "react";

type Props = {
  sessionId: string;
  active: boolean;
  reloadToken?: number;
};

/**
 * Schets tab embeds an isolated Voorbereidingsfase board (React Flow).
 * Kept in an iframe so workshop React updates cannot destroy the canvas.
 */
export default function WorkshopSketch({ sessionId, active, reloadToken = 0 }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  void active;

  return (
    <div className="absolute inset-0 bg-[#f7f6f2]">
      <iframe
        ref={iframeRef}
        key={`${sessionId}-${reloadToken}`}
        title="Workshop schets"
        src={`/tools/workshop/draw?s=${encodeURIComponent(sessionId)}&v=prep-30&r=${reloadToken}`}
        className="h-full w-full border-0"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
}
