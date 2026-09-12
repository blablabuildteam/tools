"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
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
  loading: () => <SketchLoading />,
});

function SketchLoading() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-[#f7f6f2] text-[#151f28]">
      <div className="h-8 w-8 animate-pulse rounded-full border-2 border-[#151f28]/15 border-t-[#1125ff]" />
      <p className="text-sm text-[#151f28]/45">Schets laden…</p>
    </div>
  );
}

/** Keep drawing tools; strip multiplayer / debug chrome */
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
  CursorChatBubble: null,
  PeopleMenu: null,
};

type Props = {
  /** Frozen at first mount — parent must not change this after open */
  snapshot: unknown | null;
  onSave: (sketch: unknown) => void;
};

function normalizeSnapshot(raw: unknown): TLStoreSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  // Prefer document-only — session camera state causes viewport jumps
  if (obj.document && typeof obj.document === "object") {
    return { document: obj.document } as unknown as TLStoreSnapshot;
  }
  if (obj.store && obj.schema) {
    return { document: obj } as unknown as TLStoreSnapshot;
  }
  return null;
}

class SketchErrorBoundary extends Component<
  { children: ReactNode; onReset: () => void },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#f7f6f2] px-6 text-center">
          <p className="text-sm font-medium text-[#151f28]">Schets crashte even</p>
          <p className="max-w-sm text-xs leading-relaxed text-[#151f28]/50">
            {this.state.error.message || "Onbekende fout"}
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ error: null });
              this.props.onReset();
            }}
            className="rounded-full bg-[#151f28] px-4 py-2 text-xs font-semibold text-white"
          >
            Opnieuw laden
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * Stable canvas host. Parent should mount this once (after first Schets visit)
 * and keep it mounted. Snapshot is read only on mount / reset.
 */
export default function WorkshopSketch({ snapshot, onSave }: Props) {
  const [bootId, setBootId] = useState(0);

  return (
    <SketchErrorBoundary onReset={() => setBootId((n) => n + 1)}>
      <SketchCanvas key={bootId} snapshot={snapshot} onSave={onSave} />
    </SketchErrorBoundary>
  );
}

function SketchCanvas({ snapshot, onSave }: Props) {
  const [store] = useState<TLStore>(() => createTLStore());
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const onSaveRef = useRef(onSave);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusRef = useRef<HTMLSpanElement>(null);
  const fittedRef = useRef(false);
  const snapshotRef = useRef(snapshot);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  // Load once per boot — never from later parent updates
  useEffect(() => {
    try {
      const snap = normalizeSnapshot(snapshotRef.current);
      if (snap) loadSnapshot(store, snap);
      setReady(true);
    } catch (e) {
      console.error("sketch load failed", e);
      setLoadError("Kon opgeslagen schets niet laden — lege canvas.");
      setReady(true);
    }
  }, [store]);

  useEffect(() => {
    if (!ready) return;
    const unsub = store.listen(
      () => {
        if (saveTimer.current) clearTimeout(saveTimer.current);
        if (statusRef.current) statusRef.current.textContent = "Opslaan…";
        saveTimer.current = setTimeout(() => {
          try {
            const full = getSnapshot(store);
            // Persist shapes only — never session/camera (prevents jumps on reload)
            onSaveRef.current({ document: full.document });
            if (statusRef.current) statusRef.current.textContent = "Opgeslagen";
          } catch (e) {
            console.error("sketch save failed", e);
            if (statusRef.current) statusRef.current.textContent = "Save mislukt";
          }
        }, 900);
      },
      { source: "user", scope: "document" }
    );
    return () => {
      unsub();
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [ready, store]);

  const onMount = useCallback((editor: Editor) => {
    try {
      editor.user.updateUserPreferences({ colorScheme: "light", isSnapMode: true });
      // Fit once after layout settles — never again automatically
      if (!fittedRef.current) {
        fittedRef.current = true;
        requestAnimationFrame(() => {
          try {
            editor.updateViewportScreenBounds(editor.getContainer());
            const shapes = editor.getCurrentPageShapes();
            if (shapes.length > 0) {
              editor.zoomToFit({ animation: { duration: 220 } });
            }
          } catch {
            /* ignore */
          }
        });
      }
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <div className="relative h-full w-full bg-[#f7f6f2]">
      {/* Soft paper atmosphere */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 12% 8%, rgba(17,37,255,0.06), transparent 42%), radial-gradient(circle at 88% 92%, rgba(206,255,0,0.08), transparent 40%)",
        }}
      />

      {!ready ? (
        <SketchLoading />
      ) : (
        <>
          {loadError && (
            <div className="absolute left-4 top-4 z-30 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900 shadow-sm ring-1 ring-amber-200/80">
              {loadError}
            </div>
          )}

          <div className="tldraw-wrap workshop-sketch-canvas">
            <Tldraw store={store} components={SKETCH_UI} onMount={onMount} />
          </div>

          {/* Floating status — no second header bar */}
          <div className="pointer-events-none absolute bottom-4 left-4 z-30">
            <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-[#151f28]/92 px-3.5 py-2 text-[11px] text-white shadow-lg shadow-black/20 ring-1 ring-white/10 backdrop-blur-md">
              <span className="font-medium tracking-wide">Proces</span>
              <span className="h-3 w-px bg-white/20" />
              <span ref={statusRef} className="font-mono text-[10px] uppercase tracking-wider text-[#ceff00]/90">
                Opgeslagen
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
