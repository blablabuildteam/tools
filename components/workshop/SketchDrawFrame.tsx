"use client";

/**
 * Workshop draw host (iframe): Voorbereidingsfase milestone board.
 */
import { useCallback, useEffect, useState } from "react";
import PrepPhaseEditor from "@/components/workshop/PrepPhaseEditor";
import {
  createEmptyPrepPhase,
  isPrepPhaseSketch,
  normalizePrepPhase,
  type PrepPhaseSketch,
} from "@/lib/workshop-types";

export default function SketchDrawFrame({ sessionId }: { sessionId: string }) {
  const [doc, setDoc] = useState<PrepPhaseSketch | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/workshop-sessions/${encodeURIComponent(sessionId)}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (cancelled) return;
        if (data.requiresPassword) {
          setError("Sessie is vergrendeld — ontgrendel eerst in de workshop.");
          return;
        }
        const sketch = data.sketch as { aiIdeas?: unknown; milestones?: unknown; stickies?: unknown } | null;
        const hadAiField = isPrepPhaseSketch(data.sketch) && Array.isArray(sketch?.aiIdeas);
        const hadMilestones =
          isPrepPhaseSketch(data.sketch) && Array.isArray(sketch?.milestones) && (sketch?.milestones?.length ?? 0) > 0;
        const hadStickies = isPrepPhaseSketch(data.sketch) && Array.isArray(sketch?.stickies);
        const next = normalizePrepPhase(data.sketch) ?? createEmptyPrepPhase();
        setDoc(next);
        if (!isPrepPhaseSketch(data.sketch) || !hadAiField || !hadMilestones || !hadStickies) {
          void fetch(`/api/workshop-sessions/${encodeURIComponent(sessionId)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "save-sketch", sketch: next }),
          });
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("Schets laden mislukt");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const persist = useCallback(
    (next: PrepPhaseSketch) => {
      setDoc(next);
      void fetch(`/api/workshop-sessions/${encodeURIComponent(sessionId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save-sketch", sketch: next }),
      });
    },
    [sessionId]
  );

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-[#f3f1eb] px-6 text-sm text-[#151f28]">
        {error}
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex h-full items-center justify-center bg-[#f3f1eb] text-sm text-[#151f28]/50">
        Voorbereidingsfase laden…
      </div>
    );
  }

  return <PrepPhaseEditor initial={doc} onSave={persist} />;
}
