'use client';

import { useMemo } from 'react';
import {
  type PriorityStatus,
  type UseCase,
  PRIORITY_STATUS_META,
  ROADMAP_STATUSES,
  getDeptColor,
  normalizePriorityStatus,
  sortUseCasesByPriority,
} from './types';

/** Planning calendar start — first full month after workshop follow-up. */
export const ROADMAP_START = new Date(2026, 8, 1); // 1 Sep 2026
export const TIMELINE_MONTHS = 12;

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function monthLabel(offset: number, start = ROADMAP_START): string {
  const d = new Date(start.getFullYear(), start.getMonth() + offset, 1);
  return `${MONTH_SHORT[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
}

export function monthRangeLabel(startOff: number, endOff: number): string {
  if (endOff <= startOff + 1) return monthLabel(startOff);
  return `${monthLabel(startOff)} – ${monthLabel(endOff - 1)}`;
}

/**
 * Duration in months from workshop "Speed to build" (1=slow … 5=fast).
 * Planning hint only — not a fixed quote.
 */
export function estimateMonths(uc: UseCase): number {
  const speed = Math.min(5, Math.max(1, uc.scores.implementation || 3));
  const map: Record<number, number> = {
    5: 0.5,
    4: 1,
    3: 1.5,
    2: 2.5,
    1: 4,
  };
  return map[speed] ?? 1.5;
}

export function formatDuration(months: number): string {
  if (months < 1) return '~2 wks';
  if (months === 1) return '~1 mo';
  if (Number.isInteger(months)) return `~${months} mo`;
  return `~${months} mo`;
}

/** Horizon windows as month offsets from ROADMAP_START. */
export const HORIZON_WINDOW: Record<
  Exclude<PriorityStatus, 'kill'>,
  { start: number; end: number }
> = {
  now: { start: 0, end: 2 }, // Sep–Oct
  near: { start: 2, end: 5 }, // Nov–Jan
  next: { start: 5, end: 9 }, // Feb–May
  later: { start: 9, end: 12 }, // Jun–Aug
};

interface Props {
  useCases: UseCase[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onFilterHorizon?: (status: PriorityStatus | 'all') => void;
  activeFilter?: PriorityStatus | 'all';
}

export default function RoadmapTimeline({
  useCases,
  selectedId,
  onSelect,
  onFilterHorizon,
  activeFilter = 'all',
}: Props) {
  const monthTicks = useMemo(
    () => Array.from({ length: TIMELINE_MONTHS }, (_, i) => i),
    []
  );

  const lanes = useMemo(() => {
    const ordered = sortUseCasesByPriority(useCases);
    return ROADMAP_STATUSES.map((horizon) => {
      const items = ordered.filter(
        (uc) => normalizePriorityStatus(uc.priorityStatus) === horizon
      );
      const months = items.reduce((sum, uc) => sum + estimateMonths(uc), 0);
      return { horizon, items, months };
    });
  }, [useCases]);

  const totalActive = lanes.reduce((n, l) => n + l.items.length, 0);
  const endLabel = monthLabel(TIMELINE_MONTHS - 1);

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-[#0d0f12]">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/8 px-5 py-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-bla-lime/70">
            § roadmap timeline
          </p>
          <h3 className="mt-1 font-host text-xl font-light text-white">When & how long</h3>
          <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-white/45">
            Calendar from {monthLabel(0)} → {endLabel}. Bar length ≈ Speed to build. Parallel work
            possible — load totals are hints, not one critical path.
          </p>
        </div>
        <p className="font-mono text-[11px] text-white/35">
          {totalActive} initiatives · {TIMELINE_MONTHS} months
        </p>
      </div>

      {/* Month ruler */}
      <div className="relative border-b border-white/8 px-5 py-3">
        <div className="relative h-7">
          {monthTicks.map((m) => (
            <div
              key={m}
              className="absolute top-0 flex flex-col items-start"
              style={{ left: `${(m / TIMELINE_MONTHS) * 100}%` }}
            >
              <span className="font-mono text-[9px] text-white/40">{monthLabel(m)}</span>
              <span className="mt-1 h-2 w-px bg-white/15" />
            </div>
          ))}
        </div>
        <div className="relative mt-1 h-2 overflow-hidden rounded-full bg-white/[0.04]">
          {ROADMAP_STATUSES.map((h) => {
            const win = HORIZON_WINDOW[h];
            const meta = PRIORITY_STATUS_META[h];
            const left = (win.start / TIMELINE_MONTHS) * 100;
            const width = ((win.end - win.start) / TIMELINE_MONTHS) * 100;
            return (
              <button
                key={h}
                type="button"
                title={`${meta.label} · ${monthRangeLabel(win.start, win.end)}`}
                onClick={() => onFilterHorizon?.(activeFilter === h ? 'all' : h)}
                className={`absolute inset-y-0 transition-opacity hover:opacity-100 ${
                  activeFilter !== 'all' && activeFilter !== h ? 'opacity-30' : 'opacity-80'
                } ${meta.bg}`}
                style={{ left: `${left}%`, width: `${width}%` }}
              />
            );
          })}
        </div>
      </div>

      <div className="divide-y divide-white/6">
        {lanes.map(({ horizon, items, months }) => {
          const meta = PRIORITY_STATUS_META[horizon];
          const win = HORIZON_WINDOW[horizon];
          const dimmed = activeFilter !== 'all' && activeFilter !== horizon;

          return (
            <div
              key={horizon}
              className={`px-5 py-4 transition-opacity ${dimmed ? 'opacity-35' : ''}`}
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => onFilterHorizon?.(activeFilter === horizon ? 'all' : horizon)}
                    className={`rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] ${meta.border} ${meta.bg} ${meta.color}`}
                  >
                    {meta.label}
                  </button>
                  <span className="font-mono text-[11px] text-white/35">
                    {monthRangeLabel(win.start, win.end)}
                  </span>
                  <span className="text-[12px] text-white/40">
                    {items.length} cases · ~{months.toFixed(months % 1 ? 1 : 0)} mo load
                  </span>
                </div>
              </div>

              {items.length === 0 ? (
                <p className="py-2 text-[13px] text-white/25">Nothing in this horizon yet.</p>
              ) : (
                <div className="relative space-y-1.5">
                  <div
                    className="pointer-events-none absolute inset-y-0 rounded-lg opacity-40"
                    style={{
                      left: `${(win.start / TIMELINE_MONTHS) * 100}%`,
                      width: `${((win.end - win.start) / TIMELINE_MONTHS) * 100}%`,
                      background: `linear-gradient(90deg, transparent, ${
                        horizon === 'now'
                          ? 'rgba(206,255,0,0.06)'
                          : horizon === 'near'
                            ? 'rgba(34,211,238,0.06)'
                            : horizon === 'next'
                              ? 'rgba(56,189,248,0.05)'
                              : 'rgba(255,255,255,0.03)'
                      }, transparent)`,
                    }}
                  />
                  {items.map((uc, idx) => {
                    const dur = estimateMonths(uc);
                    const slot = items.length <= 1 ? 0 : idx / Math.max(1, items.length - 1);
                    const windowSpan = win.end - win.start;
                    const maxStart = Math.max(0, windowSpan - dur);
                    const start = win.start + slot * maxStart;
                    const widthPct = Math.max(5, (dur / TIMELINE_MONTHS) * 100);
                    const leftPct = (start / TIMELINE_MONTHS) * 100;
                    const selected = selectedId === uc.id;
                    const color = getDeptColor(uc.label || 'General');
                    const durLabel = formatDuration(dur);

                    return (
                      <button
                        key={uc.id}
                        type="button"
                        onClick={() => onSelect(uc.id)}
                        className="group relative block h-9 w-full text-left"
                        title={`${uc.name} · ${durLabel} · ${uc.label || 'General'}`}
                      >
                        <span
                          className={`absolute top-0.5 flex h-8 items-center overflow-hidden rounded-md border px-2.5 transition-shadow ${
                            selected
                              ? 'border-bla-lime/50 shadow-[0_0_0_1px_rgba(206,255,0,0.25)]'
                              : 'border-white/10 group-hover:border-white/25'
                          }`}
                          style={{
                            left: `${leftPct}%`,
                            width: `${widthPct}%`,
                            minWidth: 88,
                            backgroundColor: `${color}22`,
                            borderColor: selected ? undefined : `${color}55`,
                          }}
                        >
                          <span className="truncate font-host text-[12px] text-white/90">
                            {uc.name}
                          </span>
                          <span className="ml-auto shrink-0 pl-2 font-mono text-[10px] text-white/45">
                            {durLabel}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
