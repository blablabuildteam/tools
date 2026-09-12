"use client";

/**
 * Excalidraw draw host — no tldraw license gate (that blanked the canvas after 5s).
 * Runs in an iframe so the workshop shell cannot remount it.
 */
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "@excalidraw/excalidraw/index.css";

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-[#151f28]/50">
        Tekenvlak laden…
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

function isExcalidrawScene(raw: unknown): raw is ExcalidrawScene {
  return Boolean(
    raw &&
      typeof raw === "object" &&
      (raw as ExcalidrawScene).type === "excalidraw" &&
      Array.isArray((raw as ExcalidrawScene).elements)
  );
}

/** Default Sophista process assumption as Excalidraw skeleton elements */
async function buildDefaultElements() {
  const { convertToExcalidrawElements } = await import("@excalidraw/excalidraw");
  return convertToExcalidrawElements(
    [
      {
        type: "text",
        x: 40,
        y: 24,
        text: "Sophista — aanname proces (ter validatie)\nTeken vrij bij / corrigeer / vul aan",
        fontSize: 28,
      },
      {
        type: "rectangle",
        x: 40,
        y: 120,
        width: 200,
        height: 110,
        backgroundColor: "#ffe066",
        label: { text: "1. Intake / trigger\nNieuwe deal of\nverkooptraject start" },
      },
      { type: "arrow", x: 250, y: 165, width: 60, height: 0 },
      {
        type: "rectangle",
        x: 320,
        y: 120,
        width: 220,
        height: 110,
        backgroundColor: "#a5d8ff",
        label: { text: "2. Informatie verzamelen\nKlant + intern + extern\n(nu: handmatig / traag)" },
      },
      { type: "arrow", x: 550, y: 165, width: 60, height: 0 },
      {
        type: "rectangle",
        x: 620,
        y: 120,
        width: 220,
        height: 110,
        backgroundColor: "#d0bfff",
        label: { text: "3. Verwerken & analyseren\nStructureren, checken,\naanvullen, interpreteren" },
      },
      { type: "arrow", x: 850, y: 165, width: 60, height: 0 },
      {
        type: "rectangle",
        x: 920,
        y: 120,
        width: 230,
        height: 110,
        backgroundColor: "#b2f2bb",
        label: { text: "4. Eerste standaardrapport\nGestandaardiseerde output\n(fase-1 doel)" },
      },
      {
        type: "rectangle",
        x: 40,
        y: 280,
        width: 240,
        height: 100,
        backgroundColor: "#ffc078",
        label: { text: "Hypothese pijn\nTijd & inconsistentie in\nverzamelen + schrijven" },
      },
      {
        type: "rectangle",
        x: 320,
        y: 280,
        width: 160,
        height: 80,
        backgroundColor: "#e9ecef",
        label: { text: "Klantinput\ndossier / gesprekken" },
      },
      {
        type: "rectangle",
        x: 500,
        y: 280,
        width: 160,
        height: 80,
        backgroundColor: "#e9ecef",
        label: { text: "Intern\nIMs / templates" },
      },
      {
        type: "rectangle",
        x: 680,
        y: 280,
        width: 180,
        height: 80,
        backgroundColor: "#e9ecef",
        label: { text: "Extern\nCompany.info / Gain.pro" },
      },
      {
        type: "rectangle",
        x: 920,
        y: 280,
        width: 230,
        height: 100,
        backgroundColor: "#fff3bf",
        label: { text: "Workshop-vraag\nKlopt deze flow?\nWat mist? Waar AI eerst?" },
      },
      {
        type: "text",
        x: 40,
        y: 420,
        text: "Later (niet bouwen vandaag)",
        fontSize: 18,
      },
      {
        type: "rectangle",
        x: 40,
        y: 460,
        width: 180,
        height: 70,
        backgroundColor: "#dee2e6",
        label: { text: "Marketing\nteaser / NDA" },
      },
      { type: "arrow", x: 230, y: 490, width: 50, height: 0 },
      {
        type: "rectangle",
        x: 290,
        y: 460,
        width: 180,
        height: 70,
        backgroundColor: "#dee2e6",
        label: { text: "Due diligence\nVDR / Q&A" },
      },
      { type: "arrow", x: 480, y: 490, width: 50, height: 0 },
      {
        type: "rectangle",
        x: 540,
        y: 460,
        width: 200,
        height: 70,
        backgroundColor: "#dee2e6",
        label: { text: "Signing & closing\nSPA / notaris" },
      },
    ],
    { regenerateIds: true }
  );
}

export default function SketchDrawFrame({ sessionId }: { sessionId: string }) {
  const [initialData, setInitialData] = useState<{
    elements: readonly unknown[];
    appState: Record<string, unknown>;
    scrollToContent: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const statusRef = useRef<HTMLSpanElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const baseline = useRef(0);
  const ready = useRef(false);

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

        let elements: readonly unknown[];
        if (isExcalidrawScene(data.sketch) && data.sketch.elements.length > 0) {
          elements = data.sketch.elements;
        } else {
          elements = await buildDefaultElements();
        }

        baseline.current = elements.filter((el) => !(el as { isDeleted?: boolean }).isDeleted).length;
        setInitialData({
          elements,
          appState: {
            viewBackgroundColor: "#f7f6f2",
            currentItemFontFamily: 1,
            ...(isExcalidrawScene(data.sketch) ? data.sketch.appState || {} : {}),
          },
          scrollToContent: true,
        });
        ready.current = true;
        if (statusRef.current) {
          statusRef.current.textContent = `${baseline.current} elementen · teken vrij`;
        }
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

  const onChange = useCallback(
    (elements: readonly unknown[]) => {
      if (!ready.current) return;
      const live = elements.filter((el) => !(el as { isDeleted?: boolean }).isDeleted);
      if (live.length === 0 && baseline.current > 0) {
        if (statusRef.current) statusRef.current.textContent = "Lege save geblokkeerd";
        return;
      }

      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (statusRef.current) statusRef.current.textContent = "Opslaan…";

      saveTimer.current = setTimeout(() => {
        const scene: ExcalidrawScene = {
          type: "excalidraw",
          version: 2,
          elements: elements as unknown[],
          appState: { viewBackgroundColor: "#f7f6f2" },
          files: {},
        };
        void fetch(`/api/workshop-sessions/${encodeURIComponent(sessionId)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "save-sketch", sketch: scene }),
        }).then((r) => {
          if (r.ok) {
            baseline.current = live.length;
            if (statusRef.current) statusRef.current.textContent = "Opgeslagen";
          } else if (statusRef.current) {
            statusRef.current.textContent = "Save mislukt";
          }
        });
      }, 900);
    },
    [sessionId]
  );

  const uiOptions = useMemo(
    () => ({
      canvasActions: {
        changeViewBackgroundColor: true,
        clearCanvas: false,
        export: false,
        loadScene: false,
        saveToActiveFile: false,
        toggleTheme: false,
        saveAsImage: true,
      },
    }),
    []
  );

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-[#f7f6f2] px-6 text-center text-sm text-[#151f28]">
        {error}
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className="flex h-full items-center justify-center bg-[#f7f6f2] text-sm text-[#151f28]/50">
        Tekenvlak laden…
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-[#f7f6f2]">
      <div className="absolute inset-0">
        <Excalidraw
          initialData={initialData as never}
          onChange={onChange as never}
          UIOptions={uiOptions as never}
          theme="light"
          langCode="nl-NL"
        />
      </div>
      <div className="pointer-events-none absolute bottom-3 left-3 z-50">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-[#151f28]/92 px-3 py-1.5 text-[11px] text-white shadow-lg ring-1 ring-white/10">
          <span className="font-medium">Schets</span>
          <span className="h-3 w-px bg-white/20" />
          <span ref={statusRef} className="font-mono text-[10px] uppercase tracking-wider text-[#ceff00]">
            …
          </span>
        </div>
      </div>
    </div>
  );
}
