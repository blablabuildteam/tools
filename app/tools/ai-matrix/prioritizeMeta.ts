import type { ProjectCluster } from './projectClusters';
import type { ProjectScoreInputs } from './projectScore';
import type {
  ProjectPlan,
  FeatureRequest,
  BlaBlaRecommendation,
} from './projectPlanTypes';

export type ProjectDecisionKind = 'pending' | 'keep' | 'split' | 'park' | 'kill';

export interface ProjectDecisionEntry {
  decision: ProjectDecisionKind;
  note: string;
  updatedAt?: string;
}

/** Feature-level priority (distinct from project roadmap horizon). */
export type FeaturePriority = 'high' | 'medium' | 'low' | 'backlog';

export const FEATURE_PRIORITY_META: Record<
  FeaturePriority,
  { label: string; short: string; color: string; bg: string; border: string }
> = {
  high: {
    label: 'High',
    short: 'High',
    color: 'text-bla-lime',
    bg: 'bg-bla-lime/10',
    border: 'border-bla-lime/35',
  },
  medium: {
    label: 'Medium',
    short: 'Med',
    color: 'text-amber-300',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/30',
  },
  low: {
    label: 'Low',
    short: 'Low',
    color: 'text-violet-300',
    bg: 'bg-violet-400/10',
    border: 'border-violet-400/30',
  },
  backlog: {
    label: 'Backlog',
    short: 'Backlog',
    color: 'text-white/55',
    bg: 'bg-white/5',
    border: 'border-white/15',
  },
};

const LEGACY_PHASE_TO_PRIORITY: Record<string, FeaturePriority> = {
  now: 'high',
  near: 'medium',
  next: 'low',
  later: 'backlog',
  high: 'high',
  medium: 'medium',
  low: 'low',
  backlog: 'backlog',
};

export function normalizeFeaturePriority(
  value?: string | null
): FeaturePriority {
  if (!value) return 'backlog';
  return LEGACY_PHASE_TO_PRIORITY[value] || 'backlog';
}

/**
 * Feature priority + effort assignment for individual features within a project.
 */
export interface FeaturePhaseAssignment {
  caseId: string;
  /** @deprecated use priority — kept for migration from NOW/NEAR/NEXT/LATER */
  phase?: 'now' | 'near' | 'next' | 'later';
  priority: FeaturePriority;
  effort?: 'xs' | 's' | 'm' | 'l' | 'xl';
  acceptanceCriteria?: string[];
  transformedTitle?: string;
  transformedDescription?: string;
  approved?: boolean;
  updatedAt?: string;
}

export interface PrioritizeMetaState {
  projectDecisions?: Record<string, ProjectDecisionEntry>;
  checklist?: Record<string, boolean>;
  /** Editable project grouping (v2 draft). Null/absent = use code defaults. */
  clusters?: ProjectCluster[] | null;
  clustersUpdatedAt?: string;
  /** Tracks which seed title/summary version the draft was last refreshed from */
  clustersSeedVersion?: number;
  /** Manual Value / Feasibility / Urgency (1–5) per project id */
  projectScores?: Record<string, Partial<ProjectScoreInputs>>;

  // ══════════════════════════════════════════════════════════════════════════
  // NEW: Enhanced project planning fields
  // ══════════════════════════════════════════════════════════════════════════

  /** High-level project plans keyed by project ID */
  projectPlans?: Record<string, ProjectPlan>;

  /** Feature priority assignments keyed by case ID */
  featurePhases?: Record<string, FeaturePhaseAssignment>;

  /** blablabuild recommendations keyed by recommendation ID */
  recommendations?: Record<string, BlaBlaRecommendation>;

  /** Which enhanced cluster version was last loaded */
  enhancedClustersVersion?: number;

  /** Whether the user has migrated to enhanced clusters */
  usesEnhancedClusters?: boolean;
}

export function lsMetaKey(sessionId: string) {
  return `ai-matrix-prioritize-meta:${sessionId}`;
}

export async function loadPrioritizeMeta(sessionId: string): Promise<PrioritizeMetaState> {
  let local: PrioritizeMetaState | null = null;
  try {
    const raw = window.localStorage.getItem(lsMetaKey(sessionId));
    if (raw) local = JSON.parse(raw) as PrioritizeMetaState;
  } catch {
    local = null;
  }
  try {
    const res = await fetch(`/api/matrix-sessions/${sessionId}`);
    const data = await res.json();
    const remote = (data.meta as PrioritizeMetaState | null) || null;
    return {
      projectDecisions: {
        ...(local?.projectDecisions || {}),
        ...(remote?.projectDecisions || {}),
      },
      checklist: {
        ...(local?.checklist || {}),
        ...(remote?.checklist || {}),
      },
      clusters:
        remote?.clusters && remote.clusters.length > 0
          ? remote.clusters
          : local?.clusters && local.clusters.length > 0
            ? local.clusters
            : null,
      clustersUpdatedAt: remote?.clustersUpdatedAt || local?.clustersUpdatedAt,
      clustersSeedVersion: remote?.clustersSeedVersion ?? local?.clustersSeedVersion,
      projectScores: {
        ...(local?.projectScores || {}),
        ...(remote?.projectScores || {}),
      },
      projectPlans: {
        ...(local?.projectPlans || {}),
        ...(remote?.projectPlans || {}),
      },
      featurePhases: {
        ...(local?.featurePhases || {}),
        ...(remote?.featurePhases || {}),
      },
      recommendations: {
        ...(local?.recommendations || {}),
        ...(remote?.recommendations || {}),
      },
      enhancedClustersVersion:
        remote?.enhancedClustersVersion ?? local?.enhancedClustersVersion,
      usesEnhancedClusters:
        remote?.usesEnhancedClusters ?? local?.usesEnhancedClusters,
    };
  } catch {
    return local || {};
  }
}

export async function savePrioritizeMeta(
  sessionId: string,
  next: PrioritizeMetaState
): Promise<PrioritizeMetaState> {
  try {
    window.localStorage.setItem(lsMetaKey(sessionId), JSON.stringify(next));
  } catch {
    // ignore
  }
  try {
    const res = await fetch(`/api/matrix-sessions/${sessionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'meta', meta: next }),
    });
    const data = await res.json();
    if (data?.meta && typeof data.meta === 'object') {
      return data.meta as PrioritizeMetaState;
    }
  } catch {
    // local already written
  }
  return next;
}
