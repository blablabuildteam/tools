'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react';
import {
  type PriorityStatus,
  type UseCase,
  PRIORITY_STATUS_META,
  ROADMAP_STATUSES,
  SCORE_DIMENSIONS,
  calcScore,
  getDeptColor,
  hasV2CopyChange,
  normalizePriorityStatus,
  workshopDescription,
  workshopName,
} from './types';
import {
  ensureRanks,
  migrateLegacyStatuses,
  proposeRoadmap,
} from './roadmapProposal';
import {
  projectAccent,
  resolveProjectHorizon,
  CLUSTERS_SEED_VERSION,
  type ProjectCluster,
} from './projectClusters';
import {
  mergeProjectInto,
  moveCase,
  resolveClusters,
  updateProjectFields,
} from './projectDraft';
import {
  loadPrioritizeMeta,
  savePrioritizeMeta,
  type PrioritizeMetaState,
  type FeaturePhaseAssignment,
} from './prioritizeMeta';
import {
  PROJECT_SCORE_DIMS,
  scoreProject,
  type ProjectScoreInputs,
} from './projectScore';
import ProjectPlanPanel from './ProjectPlanPanel';
import type { ProjectPlan, BlaBlaRecommendation } from './projectPlanTypes';
import {
  loadProjectPlan,
  loadRecommendationsForProject,
  initializeFeaturePhases,
  approveRecommendation,
  rejectRecommendation,
  calculatePhaseDistribution,
  resolveFeatureCopy,
} from './projectPlanHelpers';
import { getSolutionsText } from './projectPlanTypes';
import {
  FEATURE_PRIORITY_META,
  type FeaturePriority,
} from './prioritizeMeta';

export type CaseInterest = 'yes' | 'maybe' | 'no';
type Mode = 'triage' | 'grouping' | 'planning';

interface Props {
  useCases: UseCase[];
  sessionId: string;
  onBack: () => void;
  onUpdate: (uc: UseCase) => void | Promise<void>;
  onReplaceAll: (cases: UseCase[]) => void;
}

function getInterest(uc: UseCase): CaseInterest {
  if (uc.interest === 'yes' || uc.interest === 'maybe' || uc.interest === 'no') return uc.interest;
  if (normalizePriorityStatus(uc.priorityStatus) === 'kill') return 'no';
  return 'yes';
}

function deptsInCases(members: UseCase[]): string[] {
  const set = new Set<string>();
  members.forEach((m) => set.add(m.label || 'General'));
  return [...set].sort((a, b) => a.localeCompare(b));
}

function ScoreBreakdown({ uc }: { uc: UseCase }) {
  const [open, setOpen] = useState(false);
  const total = calcScore(uc.scores);

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-white/40 hover:text-white/70"
      >
        score {total.toFixed(1)} / 5
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <span className="normal-case tracking-normal text-white/25">how scored</span>
      </button>
      {open && (
        <div className="mt-2 space-y-1.5 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
          <p className="text-[11px] leading-relaxed text-white/45">
            Workshop scores (1–5), weighted into one total. Same formula as the matrix.
          </p>
          {SCORE_DIMENSIONS.map((d) => {
            const raw = uc.scores[d.key] ?? 0;
            const contrib = raw * d.weight;
            return (
              <div
                key={d.key}
                className="flex items-baseline justify-between gap-3 font-mono text-[10px]"
              >
                <span className="min-w-0 text-white/55">
                  {d.label}{' '}
                  <span className="text-white/30">×{(d.weight * 100).toFixed(0)}%</span>
                </span>
                <span className="shrink-0 tabular-nums text-white/70">
                  {raw}/5 → {contrib.toFixed(2)}
                </span>
              </div>
            );
          })}
          <div className="flex justify-between border-t border-white/8 pt-1.5 font-mono text-[10px] text-bla-lime/80">
            <span>Total</span>
            <span className="tabular-nums">{total.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function CaseRow({
  uc,
  onUpdate,
  mode,
  clusters,
  currentProjectId,
  onMove,
}: {
  uc: UseCase;
  onUpdate: (uc: UseCase) => void;
  mode: Mode;
  clusters: ProjectCluster[];
  currentProjectId: string | 'unclustered';
  onMove: (caseId: string, target: string | 'unclustered') => void;
}) {
  const interest = getInterest(uc);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(uc.name);
  const [description, setDescription] = useState(uc.description || '');
  const v1Name = workshopName(uc);
  const v1Desc = workshopDescription(uc);
  const changed = hasV2CopyChange(uc);

  useEffect(() => {
    setName(uc.name);
    setDescription(uc.description || '');
  }, [uc.name, uc.description]);

  const setInterest = (next: CaseInterest) => {
    onUpdate({
      ...uc,
      interest: next,
      priorityStatus:
        next === 'no'
          ? 'kill'
          : normalizePriorityStatus(uc.priorityStatus) === 'kill'
            ? 'later'
            : uc.priorityStatus,
    });
  };

  const saveEdit = () => {
    const nextName = name.trim() || uc.name;
    const nextDesc = description.trim();
    if (nextName === uc.name && nextDesc === (uc.description || '')) {
      setEditing(false);
      return;
    }
    onUpdate({
      ...uc,
      name: nextName,
      description: nextDesc,
    });
    setEditing(false);
  };

  return (
    <div
      className={`flex flex-col gap-2 rounded-xl border px-3 py-3 ${
        interest === 'no'
          ? 'border-white/8 bg-white/[0.015] opacity-50'
          : 'border-white/10 bg-white/[0.03]'
      }`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: getDeptColor(uc.label || 'General') }}
            />
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/40">
              Dept · {uc.label || 'General'}
            </span>
            {interest === 'no' && (
              <span className="rounded-full border border-red-400/30 bg-red-400/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-red-300">
                Killed · v2
              </span>
            )}
            {changed && (
              <span className="rounded-full border border-sky-400/30 bg-sky-400/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-sky-300">
                Edited · v2
              </span>
            )}
          </div>

          {editing ? (
            <div className="mt-2 space-y-2">
              <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/35">
                v2 working copy — matrix overview keeps workshop v1
              </p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-white/15 bg-[#0a0b0e] px-3 py-2 text-[14px] text-white"
                placeholder="v2 title"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-lg border border-white/15 bg-[#0a0b0e] px-3 py-2 text-[12px] text-white/80"
                placeholder="v2 description"
              />
              <div className="rounded-lg border border-white/8 bg-white/[0.02] px-3 py-2 text-[11px] text-white/40">
                <span className="font-mono uppercase tracking-[0.1em] text-white/30">v1 · </span>
                {v1Name}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={saveEdit}
                  className="rounded-full border border-bla-lime/35 bg-bla-lime/10 px-3 py-1 text-[12px] text-bla-lime"
                >
                  Save v2
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setName(uc.name);
                    setDescription(uc.description || '');
                    setEditing(false);
                  }}
                  className="rounded-full border border-white/10 px-3 py-1 text-[12px] text-white/45"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="mt-1 font-host text-[14px] font-medium text-white">{uc.name}</p>
              {uc.description ? (
                <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-white/40">
                  {uc.description}
                </p>
              ) : null}
              <ScoreBreakdown uc={uc} />
              {changed && (
                <p className="mt-1.5 font-mono text-[10px] text-white/30">
                  Workshop v1: {v1Name}
                  {v1Desc && v1Desc !== uc.description
                    ? ` · ${v1Desc.slice(0, 80)}${v1Desc.length > 80 ? '…' : ''}`
                    : ''}
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                {
                  id: 'yes' as const,
                  label: 'Yes',
                  cls: 'border-bla-lime/35 bg-bla-lime/10 text-bla-lime',
                },
                {
                  id: 'maybe' as const,
                  label: 'Maybe',
                  cls: 'border-amber-400/35 bg-amber-400/10 text-amber-300',
                },
                {
                  id: 'no' as const,
                  label: 'Kill',
                  cls: 'border-red-400/35 bg-red-400/10 text-red-300',
                },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setInterest(opt.id)}
                className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] ${
                  interest === opt.id
                    ? opt.cls
                    : 'border-white/10 text-white/35 hover:text-white/60'
                }`}
              >
                {opt.label}
              </button>
            ))}
            {!editing && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-full border border-white/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-white/40 hover:text-white/70"
              >
                Edit
              </button>
            )}
          </div>

          {mode === 'grouping' && (
            <label className="flex flex-col gap-1">
              <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/35">
                Move to project
              </span>
              <select
                value={currentProjectId}
                onChange={(e) =>
                  onMove(uc.id, e.target.value as string | 'unclustered')
                }
                className="max-w-[220px] rounded-lg border border-white/15 bg-[#0a0b0e] px-2 py-1.5 text-[12px] text-white/85"
              >
                <option value="unclustered">Unclustered</option>
                {clusters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </div>
    </div>
  );
}

function ProjectBlock({
  cluster,
  members,
  expanded,
  onToggle,
  onUpdate,
  onSetHorizon,
  mode,
  allClusters,
  onMove,
  onRename,
  onMergeInto,
  scoreInputs,
  onScoreChange,
  rank,
  projectPlan,
  onPlanChange,
  featurePhases,
  onFeaturePhaseChange,
  recommendations,
  onRecommendationAction,
  onFeatureUpdate,
  onFeatureDelete,
  onAddFeature,
}: {
  cluster: ProjectCluster;
  members: UseCase[];
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (uc: UseCase) => void;
  onSetHorizon: (status: PriorityStatus) => void;
  mode: Mode;
  allClusters: ProjectCluster[];
  onMove: (caseId: string, target: string | 'unclustered') => void;
  onRename: (name: string, summary: string) => void;
  onMergeInto: (intoId: string) => void;
  scoreInputs?: Partial<ProjectScoreInputs> | null;
  onScoreChange: (patch: Partial<ProjectScoreInputs>) => void;
  rank: number;
  projectPlan?: ProjectPlan;
  onPlanChange: (plan: ProjectPlan) => void;
  featurePhases: Record<string, FeaturePhaseAssignment>;
  onFeaturePhaseChange: (caseId: string, assignment: Partial<FeaturePhaseAssignment>) => void;
  recommendations: BlaBlaRecommendation[];
  onRecommendationAction: (recId: string, action: 'approve' | 'reject', reason?: string) => void;
  onFeatureUpdate: (caseId: string, updates: { name?: string; description?: string }) => void;
  onFeatureDelete: (caseId: string) => void;
  onAddFeature: (feature: {
    name: string;
    description: string;
    priority: FeaturePriority;
    effort: 'xs' | 's' | 'm' | 'l' | 'xl';
  }) => void;
}) {
  const accent = projectAccent(cluster.id);
  const horizon =
    cluster.suggestedHorizon && cluster.suggestedHorizon !== 'kill'
      ? cluster.suggestedHorizon
      : resolveProjectHorizon(cluster, members);
  const scored = scoreProject(cluster, members, scoreInputs);
  const depts = deptsInCases(members);
  const [draftName, setDraftName] = useState(cluster.name);
  const [draftSummary, setDraftSummary] = useState(cluster.summary);
  const priorityDist = calculatePhaseDistribution(
    members.map((m) => m.id),
    featurePhases
  );
  const visibleRecs = recommendations.filter((r) => r.status === 'suggested' || r.status === 'approved');

  useEffect(() => {
    setDraftName(cluster.name);
    setDraftSummary(cluster.summary);
  }, [cluster.name, cluster.summary]);

  return (
    <div
      className={`overflow-hidden rounded-2xl border ${
        expanded ? 'border-white/20 bg-[#0d0f12]' : 'border-white/10 bg-[#0d0f12]/80'
      }`}
    >
      <div className="flex w-full items-start gap-3 px-4 py-4 md:px-5">
        <button
          type="button"
          onClick={onToggle}
          className="mt-1 shrink-0 text-white/40"
          aria-label={expanded ? 'Collapse project' : 'Expand project'}
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={onToggle}
          className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: accent }}
          aria-hidden
        />
        <div className="min-w-0 flex-1 text-left">
          <button type="button" onClick={onToggle} className="w-full text-left">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/15 bg-white/[0.04] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-white/50">
                #{rank} · Project
              </span>
              {depts.length === 0 ? (
                <span className="font-mono text-[10px] text-white/25">—</span>
              ) : (
                depts.map((d) => (
                  <span
                    key={d}
                    className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-0.5 font-mono text-[10px] text-white/55"
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: getDeptColor(d) }}
                    />
                    {d}
                  </span>
                ))
              )}
            </div>
            <h3 className="mt-1.5 font-host text-[17px] font-medium text-white md:text-lg">
              {cluster.name}
            </h3>
            {projectPlan?.problemStatement ? (
              <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-white/40">
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/30">
                  Problem ·{' '}
                </span>
                {projectPlan.problemStatement}
              </p>
            ) : null}
            {getSolutionsText(projectPlan) ? (
              <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-white/40">
                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/30">
                  Solution ·{' '}
                </span>
                {getSolutionsText(projectPlan)}
              </p>
            ) : null}
            {(members.length > 0 || visibleRecs.length > 0) && (
              <div className="mt-2 flex flex-wrap gap-1">
                {members.map((m) => {
                  const copy = resolveFeatureCopy(m, featurePhases[m.id]);
                  return (
                    <span
                      key={m.id}
                      className="rounded border border-white/8 bg-white/[0.03] px-1.5 py-0.5 text-[10px] text-white/50"
                    >
                      {copy.title}
                    </span>
                  );
                })}
                {visibleRecs.map((r) => (
                  <span
                    key={r.id}
                    className="rounded border border-amber-400/25 bg-amber-400/10 px-1.5 py-0.5 text-[10px] text-amber-200/80"
                  >
                    {r.title}
                  </span>
                ))}
              </div>
            )}
          </button>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 font-mono text-[9px] uppercase tracking-[0.12em] text-white/30">
              Horizon
            </span>
            {ROADMAP_STATUSES.map((s) => {
              const m = PRIORITY_STATUS_META[s];
              const active = horizon === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => onSetHorizon(s)}
                  className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] ${
                    active
                      ? `${m.border} ${m.bg} ${m.color}`
                      : 'border-white/10 text-white/35 hover:text-white/60'
                  }`}
                >
                  {m.short}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {(['high', 'medium', 'low', 'backlog'] as const).map((p) => {
              const count = priorityDist[p];
              if (!count) return null;
              const m = FEATURE_PRIORITY_META[p];
              return (
                <span
                  key={p}
                  className={`rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] ${m.border} ${m.bg} ${m.color}`}
                >
                  {m.short} {count}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="space-y-3 border-t border-white/8 px-4 pb-4 pt-3 md:px-5">
          <ProjectPlanPanel
            projectId={cluster.id}
            projectName={cluster.name}
            plan={projectPlan}
            members={members}
            featurePhases={featurePhases}
            recommendations={recommendations}
            onPlanChange={onPlanChange}
            onFeaturePhaseChange={onFeaturePhaseChange}
            onRecommendationAction={onRecommendationAction}
            onFeatureUpdate={onFeatureUpdate}
            onFeatureDelete={onFeatureDelete}
            onAddFeature={onAddFeature}
          />

          {mode !== 'planning' && (
          <div className="rounded-xl border border-bla-lime/20 bg-bla-lime/[0.04] px-3 py-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-bla-lime/70">
                Project score · roadmap rank
              </p>
              <p className="mt-1 text-[13px] text-white/70">
                Total <span className="font-mono text-bla-lime">{scored.total.toFixed(2)}</span> / 5
                · {scored.activeCount} active features
              </p>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {PROJECT_SCORE_DIMS.map((d) => (
                <label key={d.key} className="block rounded-lg border border-white/10 bg-black/20 p-2.5">
                  <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/40">
                    {d.label} · ×{(d.weight * 100).toFixed(0)}%
                  </span>
                  <select
                    value={scored.inputs[d.key]}
                    onChange={(e) =>
                      onScoreChange({ [d.key]: Number(e.target.value) } as Partial<ProjectScoreInputs>)
                    }
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1.5 w-full rounded-md border border-white/15 bg-[#0a0b0e] px-2 py-1.5 text-[13px] text-white"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <span className="mt-1 block text-[10px] leading-snug text-white/35">{d.hint}</span>
                </label>
              ))}
            </div>

            <div className="mt-3 space-y-1 border-t border-white/8 pt-2">
                {scored.breakdown.map((row) => (
                  <div
                    key={row.label}
                    className="flex justify-between font-mono text-[10px] text-white/45"
                  >
                    <span>
                      {row.label}{' '}
                      <span className="text-white/25">×{(row.weight * 100).toFixed(0)}%</span>
                    </span>
                    <span className="tabular-nums">
                      {row.raw.toFixed(2)} → {row.contrib.toFixed(2)}
                    </span>
                  </div>
                ))}
                <p className="pt-1 text-[11px] leading-relaxed text-white/35">
                  Case evidence = avg workshop score of Yes/Maybe (non-killed) features. Higher
                  project score → pick earlier on the roadmap (still cap Now at 2–3 projects).
                </p>
              </div>
          </div>
          )}

          {mode === 'grouping' && (
            <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/35">
                Edit project
              </p>
              <input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onBlur={() => {
                  if (draftName.trim() && draftName !== cluster.name) {
                    onRename(draftName.trim(), draftSummary);
                  }
                }}
                className="w-full rounded-lg border border-white/10 bg-[#0a0b0e] px-3 py-2 text-[14px] text-white"
                placeholder="Project name"
              />
              <textarea
                value={draftSummary}
                onChange={(e) => setDraftSummary(e.target.value)}
                onBlur={() => {
                  if (draftSummary !== cluster.summary) {
                    onRename(draftName.trim() || cluster.name, draftSummary);
                  }
                }}
                rows={2}
                className="w-full resize-none rounded-lg border border-white/10 bg-[#0a0b0e] px-3 py-2 text-[12px] text-white/80"
                placeholder="Short summary"
              />
              <label className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/35">
                  Merge into
                </span>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      onMergeInto(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="rounded-lg border border-white/15 bg-[#0a0b0e] px-2 py-1.5 text-[12px] text-white/85"
                >
                  <option value="" disabled>
                    Choose project…
                  </option>
                  {allClusters
                    .filter((c) => c.id !== cluster.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </label>
            </div>
          )}

          {mode === 'triage' && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 font-mono text-[10px] uppercase tracking-[0.12em] text-white/35">
                Project horizon
              </span>
              {ROADMAP_STATUSES.map((s) => {
                const m = PRIORITY_STATUS_META[s];
                const active = horizon === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onSetHorizon(s)}
                    className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] ${
                      active
                        ? `${m.border} ${m.bg} ${m.color}`
                        : 'border-white/10 text-white/35 hover:text-white/60'
                    }`}
                  >
                    {m.short}
                  </button>
                );
              })}
            </div>
          )}

          {mode !== 'planning' && (
          <div className="space-y-2">
            {members.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/10 px-3 py-4 text-[13px] text-white/35">
                Geen cases hier. Verplaats cases in Grouping, of zet “Show No cases” aan.
              </p>
            ) : (
              members.map((uc) => (
                <CaseRow
                  key={uc.id}
                  uc={uc}
                  onUpdate={onUpdate}
                  mode={mode}
                  clusters={allClusters}
                  currentProjectId={cluster.id}
                  onMove={onMove}
                />
              ))
            )}
          </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function PrioritizeView({
  useCases,
  sessionId,
  onBack,
  onUpdate,
  onReplaceAll,
}: Props) {
  const [mode] = useState<Mode>('planning');
  const [meta, setMeta] = useState<PrioritizeMetaState>({});
  const [metaLoaded, setMetaLoaded] = useState(false);
  const [savingMeta, setSavingMeta] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const initDone = useRef(false);

  const clusters = useMemo(
    () => resolveClusters(meta.clusters, meta.clustersSeedVersion),
    [meta.clusters, meta.clustersSeedVersion]
  );

  const persistMeta = useCallback(
    async (next: PrioritizeMetaState) => {
      setMeta(next);
      setSavingMeta(true);
      try {
        const saved = await savePrioritizeMeta(sessionId, next);
        setMeta(saved);
      } finally {
        setSavingMeta(false);
      }
    },
    [sessionId]
  );

  const persistClusters = useCallback(
    (nextClusters: ProjectCluster[]) => {
      void persistMeta({
        ...meta,
        clusters: nextClusters,
        clustersUpdatedAt: new Date().toISOString(),
        clustersSeedVersion: CLUSTERS_SEED_VERSION,
      });
    },
    [meta, persistMeta]
  );

  const setProjectScore = useCallback(
    (projectId: string, patch: Partial<ProjectScoreInputs>) => {
      const prev = meta.projectScores?.[projectId] || {};
      void persistMeta({
        ...meta,
        projectScores: {
          ...(meta.projectScores || {}),
          [projectId]: { ...prev, ...patch },
        },
      });
    },
    [meta, persistMeta]
  );

  // ══════════════════════════════════════════════════════════════════════════
  // NEW: Project Plan, Feature Phase, and Recommendation handlers
  // ══════════════════════════════════════════════════════════════════════════

  const setProjectPlan = useCallback(
    (projectId: string, plan: ProjectPlan) => {
      void persistMeta({
        ...meta,
        projectPlans: {
          ...(meta.projectPlans || {}),
          [projectId]: plan,
        },
      });
    },
    [meta, persistMeta]
  );

  const setFeaturePhase = useCallback(
    (caseId: string, assignment: Partial<FeaturePhaseAssignment>) => {
      const prev = meta.featurePhases?.[caseId] || {
        caseId,
        priority: 'backlog' as const,
        effort: 'm' as const,
        approved: false,
      };
      void persistMeta({
        ...meta,
        featurePhases: {
          ...(meta.featurePhases || {}),
          [caseId]: { ...prev, ...assignment, updatedAt: new Date().toISOString() },
        },
      });
    },
    [meta, persistMeta]
  );

  // Load recommendations from enhanced clusters when meta is loaded
  const loadedRecommendations = useMemo(() => {
    const result: Record<string, BlaBlaRecommendation> = { ...(meta.recommendations || {}) };

    clusters.forEach((cluster) => {
      const projectRecs = loadRecommendationsForProject(cluster.id, result);
      projectRecs.forEach((rec) => {
        if (!result[rec.id]) {
          result[rec.id] = rec;
        }
      });
    });

    return result;
  }, [clusters, meta.recommendations]);

  const handleRecommendationAction = useCallback(
    (recId: string, action: 'approve' | 'reject', reason?: string) => {
      const rec =
        meta.recommendations?.[recId] ?? loadedRecommendations[recId];
      if (!rec) return;

      const updated =
        action === 'approve'
          ? approveRecommendation(rec)
          : rejectRecommendation(rec, reason);

      void persistMeta({
        ...meta,
        recommendations: {
          ...(meta.recommendations || {}),
          [recId]: updated,
        },
      });
    },
    [meta, persistMeta, loadedRecommendations]
  );

  // Initialize feature phases for all use cases
  const featurePhases = useMemo(() => {
    return initializeFeaturePhases(useCases, meta.featurePhases || {});
  }, [useCases, meta.featurePhases]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = await loadPrioritizeMeta(sessionId);
      if (cancelled) return;
      let next = loaded;
      // Refresh seed titles into draft once when version bumps
      if (
        loaded.clusters?.length &&
        (!loaded.clustersSeedVersion || loaded.clustersSeedVersion < CLUSTERS_SEED_VERSION)
      ) {
        const refreshed = resolveClusters(loaded.clusters, loaded.clustersSeedVersion);
        next = {
          ...loaded,
          clusters: refreshed,
          clustersSeedVersion: CLUSTERS_SEED_VERSION,
          clustersUpdatedAt: new Date().toISOString(),
        };
        void savePrioritizeMeta(sessionId, next);
      }
      setMeta(next);
      setMetaLoaded(true);
      const resolved = resolveClusters(next.clusters, next.clustersSeedVersion);
      setExpandedId(resolved[0]?.id ?? 'unclustered');
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const persistBatch = useCallback(
    async (next: UseCase[]) => {
      if (next.length === 0) return;
      onReplaceAll(next);
      try {
        await fetch(`/api/matrix-sessions/${sessionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'batch',
            items: next.map((uc) => ({
              id: uc.id,
              priorityRank: uc.priorityRank,
              priorityStatus: uc.priorityStatus,
              deliveryPartners: uc.deliveryPartners,
              owner: uc.owner,
              scores: uc.scores,
              interest: uc.interest,
            })),
          }),
        });
      } catch {
        // local already updated
      }
    },
    [onReplaceAll, sessionId]
  );

  useEffect(() => {
    if (initDone.current || useCases.length === 0) return;
    initDone.current = true;
    const hasLegacyBacklog = useCases.some(
      (uc) => (uc.priorityStatus as string | undefined) === 'backlog'
    );
    const needsDelivery = useCases.some((uc) => !uc.deliveryPartners?.length);
    const needsRank = useCases.some((uc) => typeof uc.priorityRank !== 'number');
    const hasRoadmapSpread = useCases.some((uc) => {
      const s = normalizePriorityStatus(uc.priorityStatus);
      return s === 'now' || s === 'near' || s === 'next';
    });
    if (hasLegacyBacklog || needsDelivery || needsRank || !hasRoadmapSpread) {
      if (!hasRoadmapSpread) void persistBatch(proposeRoadmap(useCases));
      else void persistBatch(ensureRanks(migrateLegacyStatuses(useCases)));
    }
  }, [useCases, persistBatch]);

  const visibleProjects = useMemo(() => {
    return clusters.filter((cluster) => useCases.some((u) => cluster.caseIds.includes(u.id)));
  }, [clusters, useCases]);

  const rankedProjects = useMemo(() => {
    return [...visibleProjects]
      .map((cluster) => {
        const members = useCases.filter((u) => cluster.caseIds.includes(u.id));
        const scored = scoreProject(cluster, members, meta.projectScores?.[cluster.id]);
        return { cluster, members, scored };
      })
      .sort((a, b) => b.scored.total - a.scored.total || a.cluster.name.localeCompare(b.cluster.name));
  }, [visibleProjects, useCases, meta.projectScores]);

  const sortMembers = (list: UseCase[]) =>
    [...list].sort((a, b) => {
      const order = { yes: 0, maybe: 1, no: 2 };
      const d = order[getInterest(a)] - order[getInterest(b)];
      return d !== 0 ? d : calcScore(b.scores) - calcScore(a.scores);
    });

  const setProjectHorizon = (projectId: string, status: PriorityStatus) => {
    if (status === 'kill') return;
    persistClusters(
      updateProjectFields(clusters, projectId, { suggestedHorizon: status })
    );
  };

  const handleMove = (caseId: string, target: string | 'unclustered') => {
    persistClusters(moveCase(clusters, caseId, target));
  };

  const handleFeatureUpdate = (caseId: string, updates: { name?: string; description?: string }) => {
    const uc = useCases.find((u) => u.id === caseId);
    if (!uc) return;
    onUpdate({
      ...uc,
      name: updates.name ?? uc.name,
      description: updates.description ?? uc.description,
    });
  };

  const handleAddFeature = (
    clusterId: string,
    feature: {
      name: string;
      description: string;
      priority: FeaturePriority;
      effort: 'xs' | 's' | 'm' | 'l' | 'xl';
    }
  ) => {
    const newId = `new-${Date.now().toString(36)}`;
    const newCase: UseCase = {
      id: newId,
      name: feature.name.trim(),
      description: feature.description.trim(),
      knockout: { recurring: null, costly: null, dataAvailable: null, standardized: null },
      scores: {
        businessImpact: 3,
        frequency: 3,
        aiSuitability: 3,
        implementation: 3,
        risk: 3,
        adoption: 3,
      },
      label: 'General',
      interest: 'yes',
      priorityStatus: 'later',
      originalInput: {
        name: feature.name.trim(),
        description: feature.description.trim(),
        savedAt: new Date().toISOString(),
      },
    };
    const nextClusters = moveCase(clusters, newId, clusterId);
    const nextPhases = {
      ...(meta.featurePhases || {}),
      [newId]: {
        caseId: newId,
        priority: feature.priority,
        effort: feature.effort,
        transformedTitle: feature.name.trim(),
        transformedDescription: feature.description.trim(),
        approved: true,
        updatedAt: new Date().toISOString(),
      },
    };
    onReplaceAll([...useCases, newCase]);
    void persistMeta({
      ...meta,
      clusters: nextClusters,
      clustersUpdatedAt: new Date().toISOString(),
      clustersSeedVersion: CLUSTERS_SEED_VERSION,
      featurePhases: nextPhases,
    });
    void fetch(`/api/matrix-sessions/${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCase),
    }).catch(() => {
      // local already updated
    });
  };

  const handleDeleteFeature = (caseId: string, clusterId: string) => {
    const nextClusters = clusters.map((c) =>
      c.id === clusterId
        ? { ...c, caseIds: c.caseIds.filter((id) => id !== caseId) }
        : c
    );
    const nextPhases = { ...(meta.featurePhases || {}) };
    delete nextPhases[caseId];
    onReplaceAll(useCases.filter((u) => u.id !== caseId));
    void persistMeta({
      ...meta,
      clusters: nextClusters,
      clustersUpdatedAt: new Date().toISOString(),
      clustersSeedVersion: CLUSTERS_SEED_VERSION,
      featurePhases: nextPhases,
    });
    void fetch(`/api/matrix-sessions/${sessionId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: caseId }),
    }).catch(() => {
      // local already updated
    });
  };

  if (!metaLoaded) {
    return (
      <div className="mx-auto w-full max-w-[1100px] py-16 text-center text-white/40">
        Loading prioritize…
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1100px]">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-[15px] font-medium text-white/85 transition-colors hover:border-bla-lime/40 hover:bg-bla-lime/10 hover:text-bla-lime"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to matrix
      </button>

      <div className="mb-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-bla-lime/70">
          § prioritize · internal
        </p>
        <h2 className="mt-1 font-host text-2xl font-light text-white md:text-3xl">Prioritize</h2>
      </div>

      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
          Projects
        </p>
        <p className="font-mono text-[10px] text-white/30">
          {rankedProjects.length} projects
        </p>
      </div>

      <div className="space-y-3">
        {rankedProjects.map(({ cluster, members: allMembers }, index) => {
          const visible = allMembers;
          return (
            <ProjectBlock
              key={cluster.id}
              cluster={cluster}
              members={sortMembers(visible)}
              expanded={expandedId === cluster.id}
              onToggle={() => setExpandedId((id) => (id === cluster.id ? null : cluster.id))}
              onUpdate={onUpdate}
              onSetHorizon={(status) => setProjectHorizon(cluster.id, status)}
              mode={mode}
              allClusters={clusters}
              onMove={handleMove}
              onRename={(name, summary) =>
                persistClusters(updateProjectFields(clusters, cluster.id, { name, summary }))
              }
              onMergeInto={(intoId) => {
                if (
                  !window.confirm(
                    `Merge “${cluster.name}” into the selected project? Cases move over; this project is removed.`
                  )
                ) {
                  return;
                }
                persistClusters(mergeProjectInto(clusters, cluster.id, intoId));
                setExpandedId(intoId);
              }}
              scoreInputs={meta.projectScores?.[cluster.id]}
              onScoreChange={(patch) => setProjectScore(cluster.id, patch)}
              rank={index + 1}
              projectPlan={loadProjectPlan(cluster.id, meta.projectPlans)}
              onPlanChange={(plan) => setProjectPlan(cluster.id, plan)}
              featurePhases={featurePhases}
              onFeaturePhaseChange={setFeaturePhase}
              recommendations={Object.values(loadedRecommendations).filter(
                (r) => r.projectId === cluster.id
              )}
              onRecommendationAction={handleRecommendationAction}
              onFeatureUpdate={handleFeatureUpdate}
              onFeatureDelete={(caseId) => handleDeleteFeature(caseId, cluster.id)}
              onAddFeature={(feature) => handleAddFeature(cluster.id, feature)}
            />
          );
        })}
      </div>
    </div>
  );
}
