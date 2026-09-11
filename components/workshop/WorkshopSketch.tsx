"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Tldraw,
  createTLStore,
  getSnapshot,
  loadSnapshot,
  type TLStore,
  type TLStoreSnapshot,
} from "tldraw";
import "tldraw/tldraw.css";

type Props = {
  sessionId: string;
  initialSketch: unknown | null;
  onSave: (sketch: unknown) => void;
};

export default function WorkshopSketch({ sessionId, initialSketch, onSave }: Props) {
  const [store] = useState<TLStore>(() => createTLStore());
  const [ready, setReady] = useState(false);
  const loadedFor = useRef<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (loadedFor.current === sessionId) return;
    loadedFor.current = sessionId;
    try {
      if (initialSketch && typeof initialSketch === "object") {
        loadSnapshot(store, initialSketch as TLStoreSnapshot);
      }
    } catch {
      // ignore bad snapshots
    }
    setReady(true);
  }, [initialSketch, sessionId, store]);

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        onSave(getSnapshot(store));
      } catch {
        /* ignore */
      }
    }, 900);
  }, [onSave, store]);

  useEffect(() => {
    if (!ready) return;
    const unsub = store.listen(() => scheduleSave(), {
      source: "user",
      scope: "document",
    });
    return () => {
      unsub();
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [ready, scheduleSave, store]);

  if (!ready) {
    return (
      <div className="flex h-[calc(100vh-7rem)] items-center justify-center text-sm text-bla-text-muted">
        Schets laden…
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-7rem)] min-h-[480px] w-full">
      <div className="tldraw-wrap">
        <Tldraw store={store} />
      </div>
    </div>
  );
}
