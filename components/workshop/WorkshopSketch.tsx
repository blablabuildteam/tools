"use client";

import { useEffect, useRef } from "react";

type Props = {
  sessionId: string;
  active: boolean;
};

/**
 * Schets tab = iframe to isolated draw page.
 * Parent React state updates cannot remount tldraw inside the iframe.
 */
export default function WorkshopSketch({ sessionId, active }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!active) return;
    // Tell the frame to recalc viewport after becoming visible
    const t = window.setTimeout(() => {
      iframeRef.current?.contentWindow?.postMessage({ type: "workshop-sketch-visible" }, "*");
    }, 100);
    return () => window.clearTimeout(t);
  }, [active]);

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
