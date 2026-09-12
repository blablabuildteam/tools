"use client";

import { useRef } from "react";

type Props = {
  sessionId: string;
  active: boolean;
};

/**
 * Schets tab embeds an isolated draw frame (Excalidraw).
 * Kept in an iframe so workshop React updates cannot destroy the canvas.
 */
export default function WorkshopSketch({ sessionId, active }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  void active;
  void iframeRef;

  return (
    <div className="absolute inset-0 bg-[#f7f6f2]">
      <iframe
        ref={iframeRef}
        title="Workshop schets"
        src={`/tools/workshop/draw?s=${encodeURIComponent(sessionId)}`}
        className="h-full w-full border-0"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
}
