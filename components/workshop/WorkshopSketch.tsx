"use client";

import { useEffect, useRef } from "react";

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

  useEffect(() => {
    if (!active) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overscrollBehavior;
    const prevBody = body.style.overscrollBehavior;
    html.style.overscrollBehavior = "none";
    body.style.overscrollBehavior = "none";

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) < 1 && !event.ctrlKey) return;
      event.preventDefault();
    };
    window.addEventListener("wheel", onWheel, { capture: true, passive: false });
    return () => {
      html.style.overscrollBehavior = prevHtml;
      body.style.overscrollBehavior = prevBody;
      window.removeEventListener("wheel", onWheel, { capture: true });
    };
  }, [active]);

  return (
    <div className="absolute inset-0 overflow-hidden overscroll-none bg-[#f7f6f2]">
      <iframe
        ref={iframeRef}
        key={`${sessionId}-${reloadToken}`}
        title="Workshop schets"
        src={`/tools/workshop/draw?s=${encodeURIComponent(sessionId)}&v=prep-38&r=${reloadToken}`}
        className="h-full w-full border-0 overscroll-none"
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
}
