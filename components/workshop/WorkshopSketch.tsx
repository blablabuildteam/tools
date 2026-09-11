"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  createTLStore,
  getSnapshot,
  loadSnapshot,
  type TLStore,
  type TLStoreSnapshot,
} from "tldraw";
import "tldraw/tldraw.css";

const Tldraw = dynamic(async () => (await import("tldraw")).Tldraw, {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-white/50">
      Schets laden…
    </div>
  ),
});

type Props = {
  sessionId: string;
  initialSketch: unknown | null;
  onSave: (sketch: unknown) => void;
  active: boolean;
};

function normalizeSnapshot(raw: unknown): TLStoreSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  // Already a full editor snapshot
  if (obj.document && typeof obj.document === "object") {
    return obj as unknown as TLStoreSnapshot;
  }
  // Raw store snapshot { store, schema }
  if (obj.store && obj.schema) {
    return { document: obj } as unknown as TLStoreSnapshot;
  }
  return null;
}

/**
 * Mount tldraw only while the Schets tab is active.
 * Load snapshot once data is available. Persist document-only snapshots.
 */
export default function WorkshopSketch({ initialSketch, onSave, active }: Props) {
  const [store] = useState<TLStore>(() => createTLStore());
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);
  const onSaveRef = useRef(onSave);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  // Load when sketch data arrives (don't mark loaded on null)
  useEffect(() => {
    if (loadedRef.current) return;
    if (initialSketch == null) {
      // Still waiting for session payload — keep waiting
      return;
    }
    try {
      const snap = normalizeSnapshot(initialSketch);
      if (snap) {
        loadSnapshot(store, snap);
      }
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

  // If no sketch ever arrives, still show empty canvas after short wait handled by parent having sketch
  useEffect(() => {
    if (loadedRef.current) return;
    if (initialSketch !== null) return;
    const t = setTimeout(() => {
      if (!loadedRef.current) {
        loadedRef.current = true;
        setReady(true);
      }
    }, 2500);
    return () => clearTimeout(t);
  }, [initialSketch]);

  useEffect(() => {
    if (!ready || !active) return;
    const unsub = store.listen(
      () => {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
          try {
            // Prefer full snapshot when session exists; fall back to document-only
            try {
              onSaveRef.current(getSnapshot(store));
            } catch {
              const raw = store.getStoreSnapshot();
              onSaveRef.current({ document: { store: raw.store, schema: raw.schema } });
            }
          } catch (e) {
            console.error("sketch save failed", e);
          }
        }, 1000);
      },
      { source: "user", scope: "document" }
    );
    return () => {
      unsub();
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [ready, active, store]);

  const onMount = useCallback((editor: { updateViewportScreenBounds?: (force?: boolean) => void }) => {
    try {
      // force recalculate after tab becomes visible
      editor.updateViewportScreenBounds?.(true);
      requestAnimationFrame(() => editor.updateViewportScreenBounds?.(true));
    } catch {
      /* ignore */
    }
  }, []);

  if (!active) return null;

  return (
    <div className="absolute inset-0 bg-white">
      {!ready ? (
        <div className="flex h-full items-center justify-center text-sm text-bla-dark/60">
          Schets laden…
        </div>
      ) : (
        <>
          {error && (
            <div className="absolute left-3 top-3 z-20 rounded-lg bg-amber-100 px-3 py-1.5 text-xs text-amber-900">
              {error}
            </div>
          )}
          <div className="tldraw-wrap">
            <Tldraw store={store} onMount={onMount as never} />
          </div>
        </>
      )}
    </div>
  );
}
