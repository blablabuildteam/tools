'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Info } from 'lucide-react';
import {
  type PriorityStatus,
  type UseCase,
  PRIORITY_STATUS_META,
  ROADMAP_STATUSES,
  normalizePriorityStatus,
} from './types';
import {
  HORIZON_WINDOW,
  ROADMAP_START,
  TIMELINE_MONTHS,
  estimateMonths,
  formatDuration,
  monthLabel,
  monthRangeLabel,
} from './RoadmapTimeline';
import {
  type ProjectCluster,
  projectAccent,
  resolveProjectHorizon,
} from './projectClusters';
import { resolveClusters } from './projectDraft';
import { loadPrioritizeMeta, type PrioritizeMetaState } from './prioritizeMeta';
import { scoreProject, type ProjectScoreInputs } from './projectScore';

type HorizonFocus = 'all' | Exclude<PriorityStatus, 'kill'>;

interface ProjectRow {
  cluster: ProjectCluster;
  members: UseCase[];
  horizon: Exclude<PriorityStatus, 'kill'>;
  /** Calendar duration hint (parallel-aware). */
  months: number;
  projectScore: number;
}

interface Props {
  useCases: UseCase[];
  sessionId: string;
  onBack: () => void;
  onGoPrioritize?: () => void;
}

export default function RoadmapView({ useCases, sessionId, onBack, onGoPrioritize }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focus, setFocus] = useState<HorizonFocus>('all');
  const [clusters, setClusters] = useState<ProjectCluster[]>(() => resolveClusters(null));
  const [projectScores, setProjectScores] = useState<
    Record<string, Partial<ProjectScoreInputs>>
  >({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const meta = (await loadPrioritizeMeta(sessionId)) as PrioritizeMetaState;
      if (cancelled) return;
      setClusters(resolveClusters(meta.clusters, meta.clustersSeedVersion));
      setProjectScores(meta.projectScores || {});
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const visibleHorizons = useMemo(() => {
    if (focus === 'all') return ROADMAP_STATUSES;
    return [focus] as const;
  }, [focus]);

  const projects = useMemo((): ProjectRow[] => {
    return clusters
      .map((cluster) => {
        const members = useCases
          .filter((u) => cluster.caseIds.includes(u.id))
          .filter((u) => normalizePriorityStatus(u.priorityStatus) !== 'kill');
        const horizon = resolveProjectHorizon(cluster, useCases);
        const months =
          members.length === 0
            ? 1
            : Math.max(...members.map((m) => estimateMonths(m)), 1);
        const projectScore = scoreProject(cluster, members, projectScores[cluster.id]).total;
        return { cluster, members, horizon, months, projectScore };
      })
      .filter((p) => p.members.length > 0);
  }, [useCases, clusters, projectScores]);

  const selected = selectedId ? projects.find((p) => p.cluster.id === selectedId) : null;

  const monthTicks = useMemo(
    () => Array.from({ length: TIMELINE_MONTHS }, (_, i) => i),
    []
  );

  const lanes = useMemo(() => {
    return visibleHorizons.map((horizon) => {
      const items = projects
        .filter((p) => p.horizon === horizon)
        .sort((a, b) => b.projectScore - a.projectScore || b.members.length - a.members.length);
      const load = items.reduce((sum, p) => sum + p.months, 0);
      return { horizon, items, load };
    });
  }, [projects, visibleHorizons]);

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-[15px] font-medium text-white/85 transition-colors hover:border-bla-lime/40 hover:bg-bla-lime/10 hover:text-bla-lime"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to matrix
      </button>

      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-bla-lime/70">
            § roadmap · projects
          </p>
          <h2 className="mt-1 font-host text-2xl font-light text-white md:text-3xl">
            Project timeline
          </h2>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-white/55">
            {monthLabel(0, ROADMAP_START)} → {monthLabel(TIMELINE_MONTHS - 1, ROADMAP_START)}. One
            bar per <span className="text-white/75">project</span>. Within each horizon, sorted by{' '}
            <span className="text-white/75">project score</span> (Value / Feasibility / Urgency +
            case evidence from Prioritize). Horizon = earliest active case.
          </p>
        </div>
        {onGoPrioritize && (
          <button
            type="button"
            onClick={onGoPrioritize}
            className="rounded-full border border-white/15 px-4 py-2 text-[13px] text-white/70 hover:border-bla-lime/30 hover:text-bla-lime"
          >
            Adjust in Prioritize →
          </button>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">Show</span>
        {(
          [
            { id: 'all' as const, label: 'ALL' },
            { id: 'now' as const, label: 'NOW' },
            { id: 'near' as const, label: 'NEAR' },
            { id: 'next' as const, label: 'NEXT' },
            { id: 'later' as const, label: 'LATER' },
          ]
        ).map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setFocus(opt.id)}
            className={`rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
              focus === opt.id
                ? 'border-bla-lime/35 bg-bla-lime/10 text-bla-lime'
                : 'border-white/10 text-white/45 hover:text-white/75'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <section className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#0d0f12]">
        <div className="border-b border-white/8 px-5 py-3">
          <div className="relative ml-[min(48%,300px)] h-7 md:ml-[300px]">
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
          <div className="relative mt-1 ml-[min(48%,300px)] h-2 overflow-hidden rounded-full bg-white/[0.04] md:ml-[300px]">
            {ROADMAP_STATUSES.map((h) => {
              const win = HORIZON_WINDOW[h];
              const meta = PRIORITY_STATUS_META[h];
              const left = (win.start / TIMELINE_MONTHS) * 100;
              const width = ((win.end - win.start) / TIMELINE_MONTHS) * 100;
              const active = (visibleHorizons as readonly string[]).includes(h);
              return (
                <div
                  key={h}
                  title={`${meta.label} · ${monthRangeLabel(win.start, win.end)}`}
                  className={`absolute inset-y-0 ${meta.bg} ${active ? 'opacity-80' : 'opacity-20'}`}
                  style={{ left: `${left}%`, width: `${width}%` }}
                />
              );
            })}
          </div>
        </div>

        <div className="divide-y divide-white/6">
          {lanes.map(({ horizon, items, load }) => {
            const meta = PRIORITY_STATUS_META[horizon];
            const win = HORIZON_WINDOW[horizon];

            return (
              <div key={horizon} className="px-4 py-5 md:px-5">
                <div className="mb-4 flex flex-wrap items-center gap-2.5">
                  <span
                    className={`rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] ${meta.border} ${meta.bg} ${meta.color}`}
                  >
                    {meta.label}
                  </span>
                  <span className="font-mono text-[11px] text-white/35">
                    {monthRangeLabel(win.start, win.end)}
                  </span>
                  <span className="text-[12px] text-white/40">
                    {items.length} project{items.length === 1 ? '' : 's'} · ~{load.toFixed(load % 1 ? 1 : 0)}{' '}
                    mo span
                  </span>
                </div>

                {items.length === 0 ? (
                  <p className="py-3 text-[13px] text-white/30">
                    No projects in {meta.label} yet.
                  </p>
                ) : (
                  <ul className="space-y-2.5">
                    {items.map((row, idx) => {
                      const { cluster, members, months, projectScore } = row;
                      const accent = projectAccent(cluster.id);
                      const slot = items.length <= 1 ? 0 : idx / Math.max(1, items.length - 1);
                      const windowSpan = win.end - win.start;
                      const maxStart = Math.max(0, windowSpan - months);
                      const start = win.start + slot * maxStart;
                      const widthPct = Math.max(10, (months / TIMELINE_MONTHS) * 100);
                      const leftPct = (start / TIMELINE_MONTHS) * 100;
                      const isSelected = selectedId === cluster.id;
                      const durLabel = formatDuration(months);

                      return (
                        <li key={cluster.id}>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedId((prev) =>
                                prev === cluster.id ? null : cluster.id
                              )
                            }
                            className={`grid w-full grid-cols-1 items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-colors md:grid-cols-[300px_1fr] ${
                              isSelected
                                ? 'border-bla-lime/40 bg-bla-lime/[0.05]'
                                : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                                  style={{ backgroundColor: accent }}
                                />
                                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/40">
                                  #{idx + 1} · {members.length} features
                                </span>
                                <span className="font-mono text-[10px] text-bla-lime/80">
                                  score {projectScore.toFixed(1)}
                                </span>
                              </div>
                              <p className="mt-1.5 font-host text-[15px] font-medium leading-snug text-white md:text-base">
                                {cluster.name}
                              </p>
                              <p className="mt-1 line-clamp-1 text-[12px] text-white/45">
                                {cluster.summary}
                              </p>
                              <p className="mt-1.5 font-mono text-[11px] text-white/40">{durLabel}</p>
                            </div>

                            <div className="relative hidden h-11 md:block">
                              <div
                                className="absolute inset-y-1 flex items-center overflow-hidden rounded-lg border px-3"
                                style={{
                                  left: `${leftPct}%`,
                                  width: `${widthPct}%`,
                                  minWidth: 64,
                                  backgroundColor: `${accent}28`,
                                  borderColor: `${accent}66`,
                                }}
                              >
                                <span className="truncate font-mono text-[10px] text-white/70">
                                  {durLabel}
                                </span>
                              </div>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {selected && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-[#0d0f12] p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">
                {PRIORITY_STATUS_META[selected.horizon].label} · score{' '}
                {selected.projectScore.toFixed(1)} · {selected.members.length} features
              </p>
              <h3 className="mt-1 font-host text-xl text-white">{selected.cluster.name}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-white/55">
                {selected.cluster.rationale}
              </p>
            </div>
            <span className="shrink-0 font-mono text-[12px] text-bla-lime">
              {formatDuration(selected.months)}
            </span>
          </div>
          <ul className="mt-4 space-y-1.5 border-t border-white/8 pt-4">
            {selected.members
              .slice()
              .sort(
                (a, b) =>
                  (a.priorityRank ?? 0) - (b.priorityRank ?? 0)
              )
              .map((uc) => (
                <li
                  key={uc.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 text-[13px]"
                >
                  <span className="text-white/80">{uc.name}</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/35">
                    {PRIORITY_STATUS_META[normalizePriorityStatus(uc.priorityStatus)].short} ·{' '}
                    {formatDuration(estimateMonths(uc))}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}

      <p className="mt-4 flex items-start gap-2 text-[12px] leading-relaxed text-white/35">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Move use cases between horizons in Prioritize — the project bar follows the earliest
        member. Refine grouping in Prioritize → Grouping (saved on this session).
      </p>
    </div>
  );
}
