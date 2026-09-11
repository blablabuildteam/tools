import { calcScore, normalizePriorityStatus, type UseCase } from './types';
import type { ProjectCluster } from './projectClusters';

/** Manual levers for ranking projects on the roadmap (1–5). */
export interface ProjectScoreInputs {
  /** Business / strategic upside of shipping this project */
  value: number;
  /** Can we deliver a useful first slice soon? */
  feasibility: number;
  /** Do we need this now vs later? */
  urgency: number;
}

export const PROJECT_SCORE_WEIGHTS = {
  value: 0.35,
  feasibility: 0.25,
  urgency: 0.2,
  /** Avg workshop score of Yes/Maybe features in the project */
  evidence: 0.2,
} as const;

export const PROJECT_SCORE_DIMS: {
  key: keyof ProjectScoreInputs;
  label: string;
  weight: number;
  hint: string;
}[] = [
  {
    key: 'value',
    label: 'Value',
    weight: PROJECT_SCORE_WEIGHTS.value,
    hint: 'Business / strategic upside if this project ships',
  },
  {
    key: 'feasibility',
    label: 'Feasibility',
    weight: PROJECT_SCORE_WEIGHTS.feasibility,
    hint: 'Useful first slice soon — stack, owner, data ready',
  },
  {
    key: 'urgency',
    label: 'Urgency',
    weight: PROJECT_SCORE_WEIGHTS.urgency,
    hint: 'Need this now vs near/next/later',
  },
];

const DEFAULT_BY_HORIZON: Record<string, ProjectScoreInputs> = {
  now: { value: 4, feasibility: 4, urgency: 5 },
  near: { value: 4, feasibility: 3, urgency: 4 },
  next: { value: 3, feasibility: 3, urgency: 2 },
  later: { value: 3, feasibility: 2, urgency: 1 },
  kill: { value: 1, feasibility: 1, urgency: 1 },
};

function clampScore(n: number): number {
  if (!Number.isFinite(n)) return 3;
  return Math.min(5, Math.max(1, Math.round(n)));
}

export function defaultProjectScoreInputs(cluster: ProjectCluster): ProjectScoreInputs {
  const h = cluster.suggestedHorizon || 'later';
  return { ...(DEFAULT_BY_HORIZON[h] || DEFAULT_BY_HORIZON.later) };
}

export function resolveProjectScoreInputs(
  cluster: ProjectCluster,
  stored?: Partial<ProjectScoreInputs> | null
): ProjectScoreInputs {
  const base = defaultProjectScoreInputs(cluster);
  return {
    value: clampScore(stored?.value ?? base.value),
    feasibility: clampScore(stored?.feasibility ?? base.feasibility),
    urgency: clampScore(stored?.urgency ?? base.urgency),
  };
}

function isActiveFeature(uc: UseCase): boolean {
  if (uc.interest === 'no') return false;
  if (normalizePriorityStatus(uc.priorityStatus) === 'kill') return false;
  return true;
}

/** Avg workshop score of Yes/Maybe (non-killed) features — 0 if none. */
export function projectEvidenceScore(members: UseCase[]): number {
  const active = members.filter(isActiveFeature);
  if (active.length === 0) return 0;
  const sum = active.reduce((s, uc) => s + calcScore(uc.scores), 0);
  return sum / active.length;
}

export interface ProjectScoreResult {
  total: number;
  inputs: ProjectScoreInputs;
  evidence: number;
  activeCount: number;
  breakdown: { label: string; weight: number; raw: number; contrib: number }[];
}

export function scoreProject(
  cluster: ProjectCluster,
  members: UseCase[],
  stored?: Partial<ProjectScoreInputs> | null
): ProjectScoreResult {
  const inputs = resolveProjectScoreInputs(cluster, stored);
  const evidence = projectEvidenceScore(members);
  const activeCount = members.filter(isActiveFeature).length;
  const parts = [
    {
      label: 'Value',
      weight: PROJECT_SCORE_WEIGHTS.value,
      raw: inputs.value,
    },
    {
      label: 'Feasibility',
      weight: PROJECT_SCORE_WEIGHTS.feasibility,
      raw: inputs.feasibility,
    },
    {
      label: 'Urgency',
      weight: PROJECT_SCORE_WEIGHTS.urgency,
      raw: inputs.urgency,
    },
    {
      label: 'Case evidence',
      weight: PROJECT_SCORE_WEIGHTS.evidence,
      raw: evidence,
    },
  ];
  const breakdown = parts.map((p) => ({
    ...p,
    contrib: p.raw * p.weight,
  }));
  const total = breakdown.reduce((s, p) => s + p.contrib, 0);
  return { total, inputs, evidence, activeCount, breakdown };
}
