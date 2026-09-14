"use client";

import { useEffect, useState } from "react";
import {
  WORKSHOP_SYNC_EVENT,
  WORKSHOP_SYNC_HOLD_MS,
  type WorkshopSyncKind,
} from "@/lib/workshop-sync";

type Props = {
  variant?: "dark" | "light";
  corner?: "bottom-right" | "top-right";
};

const RING_R = 10;
const RING_C = 2 * Math.PI * RING_R;

export default function WorkshopSyncNotice({
  variant = "dark",
  corner = "bottom-right",
}: Props) {
  const [kind, setKind] = useState<WorkshopSyncKind | null>(null);
  const [token, setToken] = useState(0);
  const [leftMs, setLeftMs] = useState(WORKSHOP_SYNC_HOLD_MS);

  useEffect(() => {
    function onSync(event: Event) {
      const detail = (event as CustomEvent<{ kind?: WorkshopSyncKind }>).detail;
      const next = detail?.kind === "saving" ? "saving" : "incoming";
      setKind(next);
      setToken((n) => n + 1);
      setLeftMs(WORKSHOP_SYNC_HOLD_MS);
    }
    window.addEventListener(WORKSHOP_SYNC_EVENT, onSync);
    return () => window.removeEventListener(WORKSHOP_SYNC_EVENT, onSync);
  }, []);

  useEffect(() => {
    if (!kind) return;
    const started = performance.now();
    const id = window.setInterval(() => {
      const left = Math.max(0, WORKSHOP_SYNC_HOLD_MS - (performance.now() - started));
      setLeftMs(left);
      if (left <= 0) {
        setKind(null);
        window.clearInterval(id);
      }
    }, 80);
    return () => window.clearInterval(id);
  }, [kind, token]);

  if (!kind) return null;

  const seconds = (leftMs / 1000).toFixed(1).replace(".", ",");
  const label = kind === "saving" ? "Opslaan" : "Sync";
  const light = variant === "light";

  return (
    <div
      key={token}
      className={`pointer-events-none absolute z-50 ${
        corner === "top-right" ? "right-3 top-3" : "bottom-3 right-3"
      }`}
      role="status"
      aria-live="polite"
    >
      <div
        className={`flex items-center gap-2 rounded-full px-2.5 py-1.5 shadow-lg ring-1 ${
          light
            ? "bg-[#151f28] text-white ring-black/20"
            : "bg-[#151f28]/95 text-white ring-white/15 backdrop-blur-md"
        }`}
      >
        <span className="relative inline-flex h-7 w-7 items-center justify-center">
          <svg className="h-7 w-7" viewBox="0 0 28 28" aria-hidden="true">
            <circle
              cx="14"
              cy="14"
              r={RING_R}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.25"
              className="text-white/15"
            />
            <circle
              className="workshop-sync-ring"
              cx="14"
              cy="14"
              r={RING_R}
              fill="none"
              stroke="#ceff00"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeDasharray={RING_C}
            />
          </svg>
          <span className="absolute font-mono text-[8px] font-semibold tabular-nums tracking-tight text-[#ceff00]">
            {seconds}
          </span>
        </span>
        <span className="pr-1">
          <span className="block text-[11px] font-semibold leading-none">{label}</span>
          <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-[0.16em] text-white/45">
            {kind === "saving" ? "naar sessie" : "van de groep"}
          </span>
        </span>
      </div>
    </div>
  );
}
