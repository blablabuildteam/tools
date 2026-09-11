"use client";

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
    <div className="flex h-full items-center justify-center bg-[#f4f5f2] text-sm text-[#151f28]/55">
      Schets laden…
    </div>
  ),
});

/** Slim UI: keep tools + styles, drop multiplayer / debug chrome */
const SKETCH_UI: TLUiComponents = {
  SharePanel: null,
  PageMenu: null,
  MenuPanel: null,
  TopPanel: null,
  DebugPanel: null,
  DebugMenu: null,
  HelperButtons: null,
  HelpMenu: null,
  NavigationPanel: null,
  Minimap: null,
  KeyboardShortcutsDialog: null,
};

type Props = {
  initialSketch: unknown | null;
  onSave: (sketch: unknown) => void;
  active: boolean;
};

function normalizeSnapshot(raw: unknown): TLStoreSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (obj.document && typeof obj.document === "object") {
    return obj as unknown as TLStoreSnapshot;
  }
  if (obj.store && obj.schema) {
    return { document: obj } as unknown as TLStoreSnapshot;
  }
  return null;
}

/**
 * Stable tldraw host: loads sketch once, ignores later prop churn from polls.
 * Stays mounted while hidden so tab switches don't remount the editor.
 */
export default function WorkshopSketch({ initialSketch, onSave, active }: Props) {
  const [store] = useState<TLStore>(() => createTLStore());
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const loadedRef = useRef(false);
  const onSaveRef = useRef(onSave);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<Editor | null>(null);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  // Load once when first non-null payload arrives — never reload from polls
  useEffect(() => {
    if (loadedRef.current) return;
    if (initialSketch == null) return;
    try {
      const snap = normalizeSnapshot(initialSketch);
      if (snap) loadSnapshot(store, snap);
      loadedRef.current = true;
      setReady(true);
      setError(null);
    } catch (e) {
      console.error("sketch load failed", e);
      loadedRef.current = true;
      setReady(true);
      setError("Schets kon niet geladen worden — lege canvas gestart.");
    }
  }, [initialSketch, store]);

  // Empty canvas fallback if session has no sketch
  useEffect(() => {
    if (loadedRef.current) return;
    const t = setTimeout(() => {
      if (!loadedRef.current) {
        loadedRef.current = true;
        setReady(true);
      }
    }, 2000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const unsub = store.listen(
      () => {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        setSaving(true);
        saveTimer.current = setTimeout(() => {
          try {
            try {
              onSaveRef.current(getSnapshot(store));
            } catch {
              const raw = store.getStoreSnapshot();
              onSaveRef.current({ document: { store: raw.store, schema: raw.schema } });
            }
          } catch (e) {
            console.error("sketch save failed", e);
          } finally {
            setSaving(false);
          }
        }, 1200);
      },
      { source: "user", scope: "document" }
    );
    return () => {
      unsub();
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [ready, store]);

  // Recalc viewport when tab becomes visible again
  useEffect(() => {
    if (!active || !editorRef.current) return;
    const editor = editorRef.current;
    requestAnimationFrame(() => {
      try {
        editor.updateViewportScreenBounds(editor.getContainer());
        editor.zoomToFit({ animation: { duration: 0 } });
      } catch {
        /* ignore */
      }
    });
  }, [active]);

  const onMount = useCallback((editor: Editor) => {
    editorRef.current = editor;
    try {
      editor.user.updateUserPreferences({ colorScheme: "light" });
      editor.updateViewportScreenBounds(editor.getContainer());
      editor.zoomToFit({ animation: { duration: 0 } });
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div
      className={`absolute inset-0 flex flex-col bg-[#eceee8] ${active ? "" : "invisible pointer-events-none"}`}
      aria-hidden={!active}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-black/8 bg-[#151f28] px-4 py-2.5 text-white">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide">Proces-schets</p>
          <p className="truncate text-[11px] text-white/50">
            Sleep om te verschuiven · scroll om te zoomen · dubbelklik tekst om te bewerken
          </p>
        </div>
        <p className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-[#ceff00]/80">
          {saving ? "Opslaan…" : "Opgeslagen"}
        </p>
      </div>

      <div className="relative min-h-0 flex-1">
        {!ready ? (
          <div className="flex h-full items-center justify-center text-sm text-[#151f28]/55">
            Schets laden…
          </div>
        ) : (
          <>
            {error && (
              <div className="absolute left-3 top-3 z-20 rounded-lg bg-amber-100 px-3 py-1.5 text-xs text-amber-900 shadow-sm">
                {error}
              </div>
            )}
            <div className="tldraw-wrap workshop-sketch-canvas">
              <Tldraw store={store} components={SKETCH_UI} onMount={onMount} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
