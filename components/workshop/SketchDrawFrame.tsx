"use client";

/**
 * Workshop draw host (iframe):
 * - Proces = React Flow (connected flowchart — best for arrows)
 * - Vrij = Excalidraw (freehand when needed)
 */
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ProcessFlowEditor, {
  createDefaultSophistaFlow,
  type FlowSketch,
} from "@/components/workshop/ProcessFlowEditor";
import "@excalidraw/excalidraw/index.css";

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-[#151f28]/50">
        Vrij tekenen laden…
      </div>
    ),
  }
);

type ExcalidrawScene = {
  type: "excalidraw";
  version: 2;
  elements: readonly unknown[];
  appState?: Record<string, unknown>;
  files?: Record<string, unknown>;
};

type WorkshopSketchDoc = {
  type: "workshop-sketch-v2";
  flow: FlowSketch;
  freehand: ExcalidrawScene | null;
};

type Mode = "flow" | "free";

function isFlowSketch(raw: unknown): raw is FlowSketch {
  return Boolean(
    raw &&
      typeof raw === "object" &&
      Array.isArray((raw as FlowSketch).nodes) &&
      Array.isArray((raw as FlowSketch).edges)
  );
}

function isV2(raw: unknown): raw is WorkshopSketchDoc {
  return Boolean(raw && typeof raw === "object" && (raw as WorkshopSketchDoc).type === "workshop-sketch-v2");
}

function isExcalidraw(raw: unknown): raw is ExcalidrawScene {
  return Boolean(
    raw && typeof raw === "object" && (raw as ExcalidrawScene).type === "excalidraw"
  );
}

export default function SketchDrawFrame({ sessionId }: { sessionId: string }) {
  const [mode, setMode] = useState<Mode>("flow");
  const [flow, setFlow] = useState<FlowSketch | null>(null);
  const [freehand, setFreehand] = useState<ExcalidrawScene | null>(null);
  const [error, setError] = useState<string | null>(null);
  const freeStatus = useRef<HTMLSpanElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const docRef = useRef<WorkshopSketchDoc | null>(null);

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

        const sketch = data.sketch;
        let next: WorkshopSketchDoc;

        if (isV2(sketch)) {
          next = {
            type: "workshop-sketch-v2",
            flow: isFlowSketch(sketch.flow) ? sketch.flow : createDefaultSophistaFlow(),
            freehand: isExcalidraw(sketch.freehand) ? sketch.freehand : null,
          };
        } else if (isExcalidraw(sketch) && sketch.elements.length > 0) {
          // Migrate previous Excalidraw-only saves
          next = {
            type: "workshop-sketch-v2",
            flow: createDefaultSophistaFlow(),
            freehand: sketch,
          };
        } else {
          next = {
            type: "workshop-sketch-v2",
            flow: createDefaultSophistaFlow(),
            freehand: null,
          };
        }

        docRef.current = next;
        setFlow(next.flow);
        setFreehand(next.freehand);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("Schets laden mislukt");
      }
    })();
    return () => {
      cancelled = true;
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [sessionId]);

  const persistDoc = useCallback(
    (next: WorkshopSketchDoc) => {
      docRef.current = next;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void fetch(`/api/workshop-sessions/${encodeURIComponent(sessionId)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "save-sketch", sketch: next }),
        }).then((r) => {
          if (mode === "free" && freeStatus.current) {
            freeStatus.current.textContent = r.ok ? "Opgeslagen" : "Save mislukt";
          }
        });
      }, 500);
    },
    [mode, sessionId]
  );

  const onSaveFlow = useCallback(
    (nextFlow: FlowSketch) => {
      const base = docRef.current ?? {
        type: "workshop-sketch-v2" as const,
        flow: nextFlow,
        freehand: freehand,
      };
      const next = { ...base, flow: nextFlow };
      setFlow(nextFlow);
      persistDoc(next);
    },
    [freehand, persistDoc]
  );

  const onFreeChange = useCallback(
    (elements: readonly unknown[]) => {
      if (freeStatus.current) freeStatus.current.textContent = "Opslaan…";
      const scene: ExcalidrawScene = {
        type: "excalidraw",
        version: 2,
        elements: elements as unknown[],
        appState: { viewBackgroundColor: "#f7f6f2" },
        files: {},
      };
      setFreehand(scene);
      const base = docRef.current ?? {
        type: "workshop-sketch-v2" as const,
        flow: flow ?? createDefaultSophistaFlow(),
        freehand: scene,
      };
      persistDoc({ ...base, freehand: scene });
    },
    [flow, persistDoc]
  );

  const freeInitial = useMemo(() => {
    if (!freehand) {
      return {
        elements: [],
        appState: { viewBackgroundColor: "#f7f6f2" },
        scrollToContent: true,
      };
    }
    return {
      elements: freehand.elements,
      appState: { viewBackgroundColor: "#f7f6f2", ...(freehand.appState || {}) },
      scrollToContent: true,
    };
  }, [freehand]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-[#f3f1eb] px-6 text-sm text-[#151f28]">
        {error}
      </div>
    );
  }

  if (!flow) {
    return (
      <div className="flex h-full items-center justify-center bg-[#f3f1eb] text-sm text-[#151f28]/50">
        Proces laden…
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-[#f3f1eb]">
      <div className="z-30 flex shrink-0 items-center gap-2 border-b border-black/8 bg-white/90 px-3 py-2 backdrop-blur">
        <div className="flex rounded-full bg-[#151f28]/5 p-1 ring-1 ring-black/10">
          <button
            type="button"
            onClick={() => setMode("flow")}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
              mode === "flow" ? "bg-[#ceff00] text-[#151f28]" : "text-[#151f28]/55 hover:text-[#151f28]"
            }`}
          >
            Proces (pijlen)
          </button>
          <button
            type="button"
            onClick={() => setMode("free")}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
              mode === "free" ? "bg-[#ceff00] text-[#151f28]" : "text-[#151f28]/55 hover:text-[#151f28]"
            }`}
          >
            Vrij tekenen
          </button>
        </div>
        <p className="hidden text-[11px] text-[#151f28]/45 sm:block">
          {mode === "flow"
            ? "Blokken verbinden via de bolletjes — ideaal voor de flowchart"
            : "Vrij schetsen / annoteren naast het proces"}
        </p>
      </div>

      <div className="relative min-h-0 flex-1">
        {mode === "flow" ? (
          <ProcessFlowEditor initial={flow} onSave={onSaveFlow} />
        ) : (
          <div className="absolute inset-0">
            <Excalidraw
              // remount when switching into free so initialData applies once per visit
              key={freehand ? "free-saved" : "free-empty"}
              initialData={freeInitial as never}
              onChange={onFreeChange as never}
              theme="light"
              UIOptions={
                {
                  canvasActions: {
                    loadScene: false,
                    export: false,
                    clearCanvas: true,
                    saveAsImage: true,
                  },
                } as never
              }
            />
            <div className="pointer-events-none absolute bottom-3 left-3 z-50">
              <div className="rounded-full bg-[#151f28]/92 px-3 py-1.5 text-[11px] text-white shadow-lg">
                <span className="font-medium">Vrij</span>
                <span className="mx-2 text-white/25">|</span>
                <span ref={freeStatus} className="font-mono text-[10px] uppercase tracking-wider text-[#ceff00]">
                  Klaar
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
