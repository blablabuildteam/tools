"use client";

/**
 * Isolated tldraw host — runs in its own iframe so parent React re-renders
 * can never remount/destroy the canvas (that caused the blanking bug).
 */
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  createTLStore,
  getSnapshot,
  loadSnapshot,
  type Editor,
  type TLStore,
  type TLStoreSnapshot,
  type TLUiComponents,
} from "tldraw";
import "tldraw/tldraw.css";

const Tldraw = dynamic(async () => (await import("tldraw")).Tldraw, {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-[#151f28]/50">
      Canvas starten…
    </div>
  ),
});

const UI: TLUiComponents = {
  SharePanel: null,
  CursorChatBubble: null,
  PeopleMenu: null,
  DebugPanel: null,
  DebugMenu: null,
};

function normalize(raw: unknown): TLStoreSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  // Ignore HTML process-flow payloads — frame expects tldraw
  if ((obj as { type?: string }).type === "process-flow") return null;
  if (obj.document && typeof obj.document === "object") {
    return { document: obj.document } as unknown as TLStoreSnapshot;
  }
  if (obj.store && obj.schema) {
    return { document: obj } as unknown as TLStoreSnapshot;
  }
  return null;
}

export default function SketchDrawFrame({ sessionId }: { sessionId: string }) {
  const [store] = useState<TLStore>(() => createTLStore());
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState<string | null>(null);
  const loaded = useRef(false);
  const editorRef = useRef<Editor | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const allowSave = useRef(false);
  const baseline = useRef(0);
  const statusRef = useRef<HTMLSpanElement>(null);

  // Load once from API into the stable store
  useEffect(() => {
    if (!sessionId || loaded.current) return;
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
          setPhase("error");
          return;
        }

        const snap = normalize(data.sketch);
        if (snap) {
          loadSnapshot(store, snap);
        }
        loaded.current = true;
        baseline.current = [...store.allRecords()].filter((r) => r.typeName === "shape").length;
        setPhase("ready");
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setError("Schets laden mislukt");
          setPhase("error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionId, store]);

  // Persist user edits — never write an empty wipe over existing shapes
  useEffect(() => {
    if (phase !== "ready") return;

    const unsub = store.listen(
      () => {
        if (!allowSave.current) return;
        if (saveTimer.current) clearTimeout(saveTimer.current);
        if (statusRef.current) statusRef.current.textContent = "Opslaan…";

        saveTimer.current = setTimeout(() => {
          const shapes = [...store.allRecords()].filter((r) => r.typeName === "shape").length;
          if (shapes === 0 && baseline.current > 0) {
            if (statusRef.current) statusRef.current.textContent = "Lege save geblokkeerd";
            return;
          }
          try {
            const full = getSnapshot(store);
            void fetch(`/api/workshop-sessions/${encodeURIComponent(sessionId)}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "save-sketch",
                sketch: { document: full.document },
              }),
            }).then((r) => {
              if (r.ok) {
                baseline.current = shapes;
                if (statusRef.current) statusRef.current.textContent = "Opgeslagen";
              } else if (statusRef.current) {
                statusRef.current.textContent = "Save mislukt";
              }
            });
          } catch {
            if (statusRef.current) statusRef.current.textContent = "Save mislukt";
          }
        }, 900);
      },
      { source: "user", scope: "document" }
    );

    // Enable saves after first paint settles (no camera hacks)
    const t = window.setTimeout(() => {
      allowSave.current = true;
      if (statusRef.current) {
        statusRef.current.textContent =
          baseline.current > 0 ? `${baseline.current} vormen · teken vrij` : "Teken vrij";
      }
    }, 800);

    return () => {
      unsub();
      window.clearTimeout(t);
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [phase, store, sessionId]);

  const fit = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    try {
      const el = editor.getContainer();
      const rect = el.getBoundingClientRect();
      if (rect.width < 100 || rect.height < 100) return;
      editor.updateViewportScreenBounds(el);
      if (editor.getCurrentPageShapes().length > 0) {
        editor.zoomToFit({ animation: { duration: 200 } });
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Parent asks us to recalc bounds when Schets tab becomes visible again
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.data?.type === "workshop-sketch-visible") {
        requestAnimationFrame(() => fit());
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [fit]);

  const onMount = useCallback((editor: Editor) => {
    editorRef.current = editor;
    try {
      editor.user.updateUserPreferences({ colorScheme: "light" });
    } catch {
      /* ignore */
    }
  }, []);

  if (phase === "loading") {
    return (
      <div className="flex h-full items-center justify-center bg-[#f7f6f2] text-sm text-[#151f28]/50">
        Tekenvlak laden…
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-[#f7f6f2] px-6 text-center">
        <p className="text-sm font-medium text-[#151f28]">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-[#f7f6f2]">
      <div className="absolute inset-0">
        <Tldraw store={store} components={UI} onMount={onMount} autoFocus />
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 z-50 flex gap-2">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-[#151f28]/92 px-3 py-1.5 text-[11px] text-white shadow-lg ring-1 ring-white/10">
          <span className="font-medium">Schets</span>
          <span className="h-3 w-px bg-white/20" />
          <span ref={statusRef} className="font-mono text-[10px] uppercase tracking-wider text-[#ceff00]">
            …
          </span>
        </div>
        <button
          type="button"
          onClick={fit}
          className="pointer-events-auto rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-[#151f28] shadow-lg ring-1 ring-black/10"
        >
          Alles tonen
        </button>
      </div>
    </div>
  );
}
