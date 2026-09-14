import type { WorkshopCard, WorkshopColumn, WorkshopMeta } from "@/lib/workshop-types";

export const WORKSHOP_POLL_MS = 1500;
export const WORKSHOP_SYNC_HOLD_MS = 2000;
export const WORKSHOP_SYNC_EVENT = "workshop-sync";

export type WorkshopSyncKind = "saving" | "incoming";

export function reportWorkshopSync(kind: WorkshopSyncKind) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(WORKSHOP_SYNC_EVENT, { detail: { kind } }));
}

export type WorkshopClientPayload = {
  meta: Omit<WorkshopMeta, "passwordHash">;
  cards: WorkshopCard[];
  columns?: WorkshopColumn[];
  sketch: unknown | null;
  kv: boolean;
  unlocked: boolean;
  requiresPassword: boolean;
  rev?: number;
  unchanged?: boolean;
};

export async function fetchWorkshopSession(
  sessionId: string,
  opts?: { rev?: number; signal?: AbortSignal }
): Promise<WorkshopClientPayload> {
  const params =
    typeof opts?.rev === "number" && Number.isFinite(opts.rev) ? `?rev=${opts.rev}` : "";
  const res = await fetch(`/api/workshop-sessions/${encodeURIComponent(sessionId)}${params}`, {
    cache: "no-store",
    signal: opts?.signal,
  });
  return (await res.json()) as WorkshopClientPayload;
}

export const WORKSHOP_NAME_KEY = "workshop:display-name";

export function readWorkshopDisplayName(): string {
  try {
    return (window.localStorage.getItem(WORKSHOP_NAME_KEY) || "").trim();
  } catch {
    return "";
  }
}

export function writeWorkshopDisplayName(name: string) {
  try {
    const trimmed = name.trim();
    if (trimmed) window.localStorage.setItem(WORKSHOP_NAME_KEY, trimmed);
  } catch {
    /* ignore quota / private mode */
  }
}

export function isEditingTextField(): boolean {
  const el = document.activeElement;
  if (!el || !(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
}

export function startWorkshopPoll(opts: {
  sessionId: string;
  getRev: () => number | undefined;
  shouldSkip?: () => boolean;
  onPayload: (data: WorkshopClientPayload) => void;
  intervalMs?: number;
}): () => void {
  const intervalMs = opts.intervalMs ?? WORKSHOP_POLL_MS;
  let cancelled = false;
  let inFlight = false;

  const tick = async () => {
    if (cancelled || inFlight) return;
    if (document.hidden) return;
    if (opts.shouldSkip?.()) return;
    inFlight = true;
    try {
      const data = await fetchWorkshopSession(opts.sessionId, { rev: opts.getRev() });
      if (cancelled || data.unchanged) return;
      opts.onPayload(data);
    } catch {
      /* ignore poll errors */
    } finally {
      inFlight = false;
    }
  };

  const id = window.setInterval(() => {
    void tick();
  }, intervalMs);
  const onVis = () => {
    if (!document.hidden) void tick();
  };
  document.addEventListener("visibilitychange", onVis);

  return () => {
    cancelled = true;
    window.clearInterval(id);
    document.removeEventListener("visibilitychange", onVis);
  };
}
