"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getSnapshot,
  type Editor,
  type TLEditorSnapshot,
  type TLStoreSnapshot,
  type TLUiComponents,
} from "tldraw";
import "tldraw/tldraw.css";

const Tldraw = dynamic(async () => (await import("tldraw")).Tldraw, {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#f7f6f2] text-sm text-[#151f28]/50">
      Schets laden…
    </div>
  ),
});

/** Only strip multiplayer chrome — keep full drawing UI intact */
const SKETCH_UI: TLUiComponents = {
  SharePanel: null,
  CursorChatBubble: null,
  PeopleMenu: null,
  DebugPanel: null,
  DebugMenu: null,
};

type Props = {
  snapshot: unknown | null;
  onSave: (sketch: unknown) => void;
};

function normalizeSnapshot(raw: unknown): TLEditorSnapshot | TLStoreSnapshot | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const obj = raw as Record<string, unknown>;
  if (obj.document && typeof obj.document === "object") {
    // Document only — never restore session/camera (that caused blank viewports)
    return { document: obj.document } as TLEditorSnapshot;
  }
  if (obj.store && obj.schema) {
    return { document: obj } as unknown as TLEditorSnapshot;
  }
  return undefined;
}

function shapeCount(editor: Editor) {
  try {
    return editor.getCurrentPageShapes().length;
  } catch {
    return 0;
  }
}

/**
 * Schets: let tldraw own the store via `snapshot` prop.
 * No external createTLStore, no auto zoomToFit on mount, no empty overwrites.
 */
export default function WorkshopSketch({ snapshot, onSave }: Props) {
  const initial = useMemo(() => normalizeSnapshot(snapshot), [snapshot]);
  const onSaveRef = useRef(onSave);
  const editorRef = useRef<Editor | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const allowSave = useRef(false);
  const baselineShapes = useRef(0);
  const statusRef = useRef<HTMLSpanElement>(null);
  const [client, setClient] = useState(false);

  useEffect(() => {
    setClient(true);
  }, []);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  const setStatus = (text: string) => {
    if (statusRef.current) statusRef.current.textContent = text;
  };

  const persist = useCallback((editor: Editor) => {
    const count = shapeCount(editor);
    // Never persist an empty wipe over a populated board
    if (count === 0 && baselineShapes.current > 0) {
      setStatus("Save geblokkeerd (leeg)");
      return;
    }
    try {
      const full = getSnapshot(editor.store);
      onSaveRef.current({ document: full.document });
      baselineShapes.current = count;
      setStatus("Opgeslagen");
    } catch (e) {
      console.error("sketch save failed", e);
      setStatus("Save mislukt");
    }
  }, []);

  const fitView = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    try {
      const el = editor.getContainer();
      const rect = el.getBoundingClientRect();
      if (rect.width < 80 || rect.height < 80) return;
      editor.updateViewportScreenBounds(el);
      if (shapeCount(editor) > 0) {
        editor.zoomToFit({ animation: { duration: 180 } });
      }
    } catch {
      /* ignore */
    }
  }, []);

  const onMount = useCallback(
    (editor: Editor) => {
      editorRef.current = editor;
      try {
        editor.user.updateUserPreferences({ colorScheme: "light" });
      } catch {
        /* ignore */
      }

      baselineShapes.current = shapeCount(editor);

      // Delay fitting until layout is real — early zoomToFit blanks the canvas
      const fitTimer = window.setTimeout(() => {
        fitView();
        // Only after first paint may we autosave user edits
        allowSave.current = true;
        setStatus(baselineShapes.current > 0 ? "Klaar" : "Lege canvas");
      }, 600);

      const unsub = editor.store.listen(
        () => {
          if (!allowSave.current) return;
          if (saveTimer.current) clearTimeout(saveTimer.current);
          setStatus("Opslaan…");
          saveTimer.current = setTimeout(() => persist(editor), 1000);
        },
        { source: "user", scope: "document" }
      );

      return () => {
        window.clearTimeout(fitTimer);
        unsub();
        if (saveTimer.current) clearTimeout(saveTimer.current);
        editorRef.current = null;
      };
    },
    [fitView, persist]
  );

  if (!client) {
    return (
      <div className="flex h-full items-center justify-center bg-[#f7f6f2] text-sm text-[#151f28]/50">
        Schets laden…
      </div>
    );
  }

  return (
    <div className="relative h-full w-full min-h-0 bg-[#f7f6f2]">
      <div className="tldraw-wrap workshop-sketch-canvas">
        <Tldraw
          // tldraw owns the store — avoids external-store races that wiped the canvas
          // Do NOT use persistenceKey: IndexedDB async hydrate was overwriting the
          // seeded flowchart a few seconds after open (blank canvas).
          snapshot={initial}
          components={SKETCH_UI}
          onMount={onMount}
        />
      </div>

      <div className="absolute bottom-4 left-4 z-30 flex items-center gap-2">
        <div className="flex items-center gap-3 rounded-full bg-[#151f28]/92 px-3.5 py-2 text-[11px] text-white shadow-lg shadow-black/25 ring-1 ring-white/10 backdrop-blur-md">
          <span className="font-medium tracking-wide">Proces</span>
          <span className="h-3 w-px bg-white/20" />
          <span
            ref={statusRef}
            className="font-mono text-[10px] uppercase tracking-wider text-[#ceff00]/90"
          >
            Laden…
          </span>
        </div>
        <button
          type="button"
          onClick={fitView}
          className="rounded-full bg-white/95 px-3.5 py-2 text-[11px] font-semibold text-[#151f28] shadow-lg shadow-black/10 ring-1 ring-black/10 hover:bg-white"
        >
          Alles tonen
        </button>
      </div>
    </div>
  );
}
