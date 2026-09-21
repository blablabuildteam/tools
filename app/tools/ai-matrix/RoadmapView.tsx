'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronRight, Info, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { type UseCase } from './types';
import {
  ROADMAP_START,
  TIMELINE_MONTHS,
  monthLabel,
  monthRangeLabel,
} from './RoadmapTimeline';
import { projectAccent, projectForCase } from './projectClusters';
import {
  loadPrioritizeMeta,
  type PrioritizeMetaState,
  type RoadmapWave,
  type FeaturePhaseAssignment,
} from './prioritizeMeta';
import type { ProjectPlan } from './projectPlanTypes';

interface Props {
  useCases: UseCase[];
  sessionId: string;
  onBack: () => void;
  onGoPrioritize?: () => void;
}

interface PhaseInfo {
  projectTitle: string;
  phaseTitle: string;
  phaseShort: string;
  phaseDescription: string;
  effort: string;
  accent: string;
  themeName: string;
}

/** Resolve phase/project display info */
function resolvePhaseInfo(
  item: RoadmapWave['items'][number],
  featurePhases: Record<string, FeaturePhaseAssignment>,
  featurePlans: Record<string, ProjectPlan>,
  useCases: UseCase[]
): PhaseInfo {
  const phase = featurePhases[item.caseId];
  const plan = featurePlans[item.caseId];
  const uc = useCases.find((u) => u.id === item.caseId);
  const deliveryPhase = plan?.phasedDelivery?.find((p) => p.id === item.phaseId);

  const projectTitle = phase?.transformedTitle || uc?.name || item.caseId;
  const phaseTitle = deliveryPhase?.title || item.title || item.phaseId;
  const phaseShort = phaseTitle.replace(/^Phase \d+:\s*/, '');
  const phaseDescription = deliveryPhase?.description || '';
  const effort = phase?.effort || 'm';

  const cluster = projectForCase(item.caseId);
  const accent = cluster ? projectAccent(cluster.id) : '#ceff00';
  const themeName = cluster?.name || 'Unclustered';

  return { projectTitle, phaseTitle, phaseShort, phaseDescription, effort, accent, themeName };
}

export default function RoadmapView({ useCases, sessionId, onBack, onGoPrioritize }: Props) {
  const [meta, setMeta] = useState<PrioritizeMetaState>({});
  const [expandedWaves, setExpandedWaves] = useState<Set<string>>(new Set(['wave-1']));
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await loadPrioritizeMeta(sessionId);
      if (cancelled) return;
      setMeta(loaded);
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const waves = meta.roadmapWaves || [];
  const featurePhases = meta.featurePhases || {};
  const featurePlans = meta.featurePlans || {};

  const monthTicks = useMemo(
    () => Array.from({ length: TIMELINE_MONTHS }, (_, i) => i),
    []
  );

  // Group items by project within each wave (preserving item order)
  const waveProjects = useMemo(() => {
    return waves.map((wave) => {
      const byProject = new Map<string, typeof wave.items>();
      wave.items.forEach((item) => {
        const existing = byProject.get(item.caseId) || [];
        existing.push(item);
        byProject.set(item.caseId, existing);
      });
      return { wave, projects: byProject };
    });
  }, [waves]);

  const totalPhases = waves.reduce((sum, w) => sum + w.items.length, 0);

  const toggleWave = (id: string) => {
    setExpandedWaves((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

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
            § roadmap · phased delivery
          </p>
          <h2 className="mt-1 font-host text-2xl font-light text-white md:text-3xl">
            High-priority roadmap
          </h2>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-white/55">
            {monthLabel(0, ROADMAP_START)} → {monthLabel(TIMELINE_MONTHS - 1, ROADMAP_START)}.{' '}
            <span className="text-white/75">{waves.length} waves</span> ·{' '}
            <span className="text-white/75">{totalPhases} phases</span>. Sequenced by tech stack
            synergies and business impact.
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

      {/* ── Overview Gantt: waves on one shared month grid ───────────── */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#0d0f12]">
        <div className="px-5 pt-4 pb-5">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
            Overview
          </p>
          <div className="grid grid-cols-[140px_1fr] gap-x-4 md:grid-cols-[190px_1fr]">
            {/* Month ruler */}
            <div />
            <div className="relative mb-2 h-6 border-b border-white/10">
              {monthTicks.map((m) => (
                <span
                  key={m}
                  className="absolute bottom-1 font-mono text-[9px] text-white/40"
                  style={{ left: `${(m / TIMELINE_MONTHS) * 100}%` }}
                >
                  {monthLabel(m)}
                </span>
              ))}
            </div>

            {/* One aligned row per wave */}
            {waves.map((wave, wi) => {
              const left = (wave.monthStart / TIMELINE_MONTHS) * 100;
              const width = ((wave.monthEnd - wave.monthStart) / TIMELINE_MONTHS) * 100;
              // Unique theme accents in this wave for the segment stripes
              const accents = Array.from(
                new Set(
                  wave.items.map((it) => {
                    const c = projectForCase(it.caseId);
                    return c ? projectAccent(c.id) : '#ceff00';
                  })
                )
              );
              return (
                <div key={wave.id} className="contents">
                  <button
                    type="button"
                    onClick={() => toggleWave(wave.id)}
                    className="truncate py-1.5 text-left font-mono text-[11px] text-white/55 transition-colors hover:text-bla-lime"
                    title={wave.title}
                  >
                    {wi + 1} · {wave.title.replace(/^Wave \d+:\s*/, '')}
                  </button>
                  <div className="relative py-1.5">
                    {/* Grid lines */}
                    {monthTicks.map((m) => (
                      <span
                        key={m}
                        className="absolute inset-y-0 w-px bg-white/[0.04]"
                        style={{ left: `${(m / TIMELINE_MONTHS) * 100}%` }}
                      />
                    ))}
                    <div
                      className="relative flex h-6 items-center gap-1 overflow-hidden rounded-md border border-white/10 bg-white/[0.03] px-1.5"
                      style={{ marginLeft: `${left}%`, width: `${width}%` }}
                    >
                      {accents.map((a) => (
                        <span
                          key={a}
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{ backgroundColor: a }}
                        />
                      ))}
                      <span className="ml-1 truncate font-mono text-[9px] text-white/45">
                        {wave.items.length} phases
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Wave detail cards ─────────────────────────────────────────── */}
      <div className="mt-4 space-y-3">
        {waveProjects.map(({ wave, projects }, wi) => {
          const isExpanded = expandedWaves.has(wave.id);

          return (
            <section
              key={wave.id}
              className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d0f12]"
            >
              {/* Wave header */}
              <button
                type="button"
                onClick={() => toggleWave(wave.id)}
                className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-white/[0.02]"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-bla-lime/10 font-mono text-[12px] font-medium text-bla-lime">
                  {wi + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-host text-[15px] font-medium text-white">
                      {wave.title.replace(/^Wave \d+:\s*/, '')}
                    </span>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[10px] text-white/50">
                      {monthRangeLabel(wave.monthStart, wave.monthEnd)}
                    </span>
                    <span className="font-mono text-[11px] text-white/35">
                      {projects.size} projects · {wave.items.length} phases
                    </span>
                  </div>
                  <p className="mt-0.5 text-[12px] text-white/45">{wave.rationale}</p>
                </div>
                <span className="text-white/35">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </span>
              </button>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2 border-t border-white/6 px-5 py-4">
                      {Array.from(projects.entries()).map(([caseId, items]) => {
                        const info = resolvePhaseInfo(
                          items[0],
                          featurePhases,
                          featurePlans,
                          useCases
                        );

                        return (
                          <div
                            key={caseId}
                            className="rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3"
                            style={{ borderLeftColor: `${info.accent}88`, borderLeftWidth: 3 }}
                          >
                            {/* Project header */}
                            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                              <span className="font-host text-[13.5px] font-medium text-white/85">
                                {info.projectTitle}
                              </span>
                              <span
                                className="font-mono text-[10px] tracking-wide"
                                style={{ color: `${info.accent}bb` }}
                              >
                                {info.themeName}
                              </span>
                              <span className="ml-auto rounded-full border border-white/10 px-2 py-0.5 font-mono text-[9px] uppercase text-white/40">
                                {info.effort.toUpperCase()}
                              </span>
                            </div>

                            {/* Phase step chips */}
                            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                              {items.map((item, idx) => {
                                const key = `${item.caseId}-${item.phaseId}`;
                                const isSelected = selectedPhase === key;
                                const phaseInfo = resolvePhaseInfo(
                                  item,
                                  featurePhases,
                                  featurePlans,
                                  useCases
                                );
                                // Global phase number from the plan (not wave-local)
                                const allPhases =
                                  featurePlans[item.caseId]?.phasedDelivery || [];
                                const globalIdx = allPhases.findIndex(
                                  (p) => p.id === item.phaseId
                                );
                                const num = globalIdx >= 0 ? globalIdx + 1 : idx + 1;

                                return (
                                  <span key={key} className="flex items-center gap-1.5">
                                    {idx > 0 && (
                                      <span className="text-[11px] text-white/20">→</span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setSelectedPhase(isSelected ? null : key)
                                      }
                                      className={`flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-3 transition-colors ${
                                        isSelected
                                          ? 'border-bla-lime/45 bg-bla-lime/10'
                                          : 'border-white/12 bg-white/[0.03] hover:border-white/25'
                                      }`}
                                    >
                                      <span
                                        className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold"
                                        style={{
                                          backgroundColor: `${info.accent}26`,
                                          color: info.accent,
                                        }}
                                      >
                                        {num}
                                      </span>
                                      <span
                                        className={`text-[12px] ${
                                          isSelected ? 'text-bla-lime' : 'text-white/70'
                                        }`}
                                      >
                                        {phaseInfo.phaseShort}
                                      </span>
                                    </button>
                                  </span>
                                );
                              })}
                            </div>

                            {/* Selected phase detail */}
                            <AnimatePresence initial={false}>
                              {items.map((item) => {
                                const key = `${item.caseId}-${item.phaseId}`;
                                if (selectedPhase !== key) return null;
                                const phaseInfo = resolvePhaseInfo(
                                  item,
                                  featurePhases,
                                  featurePlans,
                                  useCases
                                );
                                return (
                                  <motion.div
                                    key={key}
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="mt-2.5 rounded-lg border border-white/10 bg-black/25 px-3.5 py-3">
                                      <p className="font-mono text-[10px] uppercase tracking-wide text-white/40">
                                        {phaseInfo.phaseTitle}
                                      </p>
                                      <p className="mt-1 text-[13px] leading-relaxed text-white/65">
                                        {phaseInfo.phaseDescription ||
                                          'No description available.'}
                                      </p>
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          );
        })}
      </div>

      {/* Legend + note */}
      <div className="mt-5 flex flex-wrap items-center gap-4 text-[12px] text-white/40">
        <span className="flex items-center gap-2">
          <Layers className="h-3.5 w-3.5" />
          Click a wave to expand · click a phase chip for its milestone
        </span>
      </div>

      <p className="mt-3 flex items-start gap-2 text-[12px] leading-relaxed text-white/35">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Sequencing based on tech stack synergies (MB + CPM share the Looker pattern) and business
        impact (Financial kills sheets immediately). Waves overlap — timing is approximate, not
        strict waterfall.
      </p>
    </div>
  );
}
