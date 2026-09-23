"use client";

/**
 * Workshop draw host (iframe): Voorbereidingsfase milestone board.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import PrepPhaseEditor from "@/components/workshop/PrepPhaseEditor";
import WorkshopSyncNotice from "@/components/workshop/WorkshopSyncNotice";
import {
  fetchWorkshopSession,
  reportWorkshopSync,
  startWorkshopPoll,
  type WorkshopClientPayload,
} from "@/lib/workshop-sync";
import {
  createEmptyPrepPhase,
  isPrepPhaseSketch,
  normalizePrepPhase,
  sketchFingerprint,
  type PrepPhaseSketch,
  type SketchPatchKey,
  type WorkshopSketchHelp,
} from "@/lib/workshop-types";

export default function SketchDrawFrame({ sessionId }: { sessionId: string }) {
  const [doc, setDoc] = useState<PrepPhaseSketch | null>(null);
  const [remote, setRemote] = useState<PrepPhaseSketch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sketchLabel, setSketchLabel] = useState("Processen");
  const [sketchHelp, setSketchHelp] = useState<WorkshopSketchHelp | undefined>();
  const [hideAiToggle, setHideAiToggle] = useState(false);
  const [hidePainPoints, setHidePainPoints] = useState(false);
  const revRef = useRef<number | undefined>(undefined);
  const dirtyRef = useRef(false);
  const fingerprintRef = useRef("");

  const rememberWrite = (data: WorkshopClientPayload) => {
    if (typeof data.rev === "number") revRef.current = data.rev;
  };

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    html.classList.add("overflow-hidden", "overscroll-none");
    body.classList.add("overflow-hidden", "overscroll-none");

    const onWheel = (event: WheelEvent) => {
      const target = event.target as HTMLElement | null;
      const allowNativeY =
        Boolean(target?.closest(".nowheel")) &&
        !event.ctrlKey &&
        Math.abs(event.deltaX) <= Math.abs(event.deltaY);
      if (allowNativeY) return;
      event.preventDefault();
    };
    const preventGesture = (event: Event) => event.preventDefault();
    document.addEventListener("wheel", onWheel, { capture: true, passive: false });
    document.addEventListener("gesturestart", preventGesture, { capture: true });
    document.addEventListener("gesturechange", preventGesture, { capture: true });
    return () => {
      html.classList.remove("overflow-hidden", "overscroll-none");
      body.classList.remove("overflow-hidden", "overscroll-none");
      document.removeEventListener("wheel", onWheel, { capture: true });
      document.removeEventListener("gesturestart", preventGesture, { capture: true });
      document.removeEventListener("gesturechange", preventGesture, { capture: true });
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchWorkshopSession(sessionId);
        if (cancelled) return;
        if (data.requiresPassword) {
          setError("Sessie is vergrendeld — ontgrendel eerst in de workshop.");
          return;
        }
        if (typeof data.rev === "number") revRef.current = data.rev;
        setSketchLabel(data.meta?.sketchLabel?.trim() || "Processen");
        setSketchHelp(data.meta?.sketchHelp);
        const tabs = Array.isArray(data.meta?.tabs) ? data.meta.tabs.map(String) : null;
        setHideAiToggle(Boolean(tabs && !tabs.includes("reference")));
        setHidePainPoints(data.meta?.hidePainPoints === true);
        const sketch = data.sketch as { aiIdeas?: unknown; milestones?: unknown; stickies?: unknown } | null;
        const hadAiField = isPrepPhaseSketch(data.sketch) && Array.isArray(sketch?.aiIdeas);
        const hadMilestones =
          isPrepPhaseSketch(data.sketch) && Array.isArray(sketch?.milestones) && (sketch?.milestones?.length ?? 0) > 0;
        const hadStickies = isPrepPhaseSketch(data.sketch) && Array.isArray(sketch?.stickies);
        const next = normalizePrepPhase(data.sketch) ?? createEmptyPrepPhase();
        fingerprintRef.current = sketchFingerprint(next);
        setDoc(next);
        const touched: SketchPatchKey[] = [];
        if (!isPrepPhaseSketch(data.sketch)) {
          touched.push(...["steps", "connections", "aiIdeas", "milestones", "stickies"] as SketchPatchKey[]);
        } else {
          if (!hadAiField) touched.push("aiIdeas");
          if (!hadMilestones) touched.push("milestones");
          if (!hadStickies) touched.push("stickies");
        }
        if (touched.length) {
          void fetch(`/api/workshop-sessions/${encodeURIComponent(sessionId)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "save-sketch", sketch: next, touched }),
          }).then(async (res) => {
            rememberWrite((await res.json()) as WorkshopClientPayload);
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

  const hydrated = Boolean(doc);

  useEffect(() => {
    if (!hydrated) return;
    return startWorkshopPoll({
      sessionId,
      getRev: () => revRef.current,
      shouldSkip: () => dirtyRef.current,
      onPayload: (data) => {
        if (data.requiresPassword) return;
        if (typeof data.rev === "number") revRef.current = data.rev;
        const next = normalizePrepPhase(data.sketch);
        if (!next) return;
        const fp = sketchFingerprint(next);
        if (fp === fingerprintRef.current) return;
        fingerprintRef.current = fp;
        setRemote(next);
        setDoc(next);
        reportWorkshopSync("incoming");
      },
    });
  }, [hydrated, sessionId]);

  const persist = useCallback(
    (next: PrepPhaseSketch, touched: SketchPatchKey[] = []) => {
      setDoc(next);
      fingerprintRef.current = sketchFingerprint(next);
      dirtyRef.current = true;
      reportWorkshopSync("saving");
      void fetch(`/api/workshop-sessions/${encodeURIComponent(sessionId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save-sketch",
          sketch: next,
          touched: touched.length ? touched : undefined,
        }),
      })
        .then(async (res) => {
          rememberWrite((await res.json()) as WorkshopClientPayload);
        })
        .finally(() => {
          window.setTimeout(() => {
            dirtyRef.current = false;
          }, 800);
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
        Voorbereiding laden…
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <PrepPhaseEditor
        initial={doc}
        remote={remote}
        onSave={persist}
        sketchLabel={sketchLabel}
        sketchHelp={sketchHelp}
        hideAiToggle={hideAiToggle}
        hidePainPoints={hidePainPoints}
      />
      <WorkshopSyncNotice variant="light" corner="top-right" />
    </div>
  );
}
