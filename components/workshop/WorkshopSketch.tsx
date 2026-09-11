"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Tldraw,
  createTLStore,
  getSnapshot,
  loadSnapshot,
  type TLStoreSnapshot,
} from "tldraw";
import "tldraw/tldraw.css";

type Props = {
  sessionId: string;
  initialSketch: unknown | null;
  onSave: (sketch: unknown) => void;
  /** When false, canvas stays mounted but hidden — prevents tldraw teardown crashes */
  active: boolean;
};

class ErrorCatch extends React.Component<
  { children: React.ReactNode; onError: () => void },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

/**
 * Stable tldraw host:
 * - store created once
 * - snapshot loaded once
 * - onSave via ref (no effect churn)
 * - stays mounted while inactive (CSS hide)
 */
export default function WorkshopSketch({ sessionId, initialSketch, onSave, active }: Props) {
  const storeRef = useRef(createTLStore());
  const onSaveRef = useRef(onSave);
  const loadedRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [ready, setReady] = useState(false);
  const [crashed, setCrashed] = useState(false);
  const [mountKey, setMountKey] = useState(0);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    try {
      if (initialSketch && typeof initialSketch === "object") {
        loadSnapshot(storeRef.current, initialSketch as TLStoreSnapshot);
      }
    } catch {
      // bad snapshot — start empty rather than crash
    }
    setReady(true);
  }, [initialSketch]);

  useEffect(() => {
    if (!ready || crashed) return;
    const store = storeRef.current;
    const unsub = store.listen(
      () => {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => {
          try {
            onSaveRef.current(getSnapshot(store));
          } catch {
            /* ignore */
          }
        }, 1200);
      },
      { source: "user", scope: "document" }
    );
    return () => {
      unsub();
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [ready, crashed, mountKey]);

  const recover = useCallback(() => {
    setCrashed(false);
    setMountKey((k) => k + 1);
    setReady(true);
  }, []);

  if (crashed) {
    return (
      <div
        className={`${active ? "relative" : "hidden"} flex h-full min-h-[480px] flex-col items-center justify-center gap-3 text-sm text-bla-text-muted`}
      >
        <p>Schets even vastgelopen.</p>
        <button
          type="button"
          onClick={recover}
          className="rounded-lg bg-bla-lime px-4 py-2 text-xs font-semibold text-bla-dark"
        >
          Opnieuw laden
        </button>
      </div>
    );
  }

  return (
    <div
      className={`${active ? "relative" : "pointer-events-none invisible absolute inset-0"} h-full min-h-[480px] w-full`}
      aria-hidden={!active}
    >
      {!ready ? (
        <div className="flex h-full items-center justify-center text-sm text-bla-text-muted">
          Schets laden…
        </div>
      ) : (
        <div className="tldraw-wrap">
          <ErrorCatch onError={() => setCrashed(true)}>
            <Tldraw
              key={`tldraw-${sessionId}-${mountKey}`}
              store={storeRef.current}
              onMount={() => {
                /* store already loaded; keep mount lightweight */
              }}
            />
          </ErrorCatch>
        </div>
      )}
    </div>
  );
}
