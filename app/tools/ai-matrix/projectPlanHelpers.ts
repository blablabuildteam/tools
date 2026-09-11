import type { ProjectPlan, BlaBlaRecommendation } from './projectPlanTypes';
import { getSolutionsText } from './projectPlanTypes';
import type {
  FeaturePhaseAssignment,
  FeaturePriority,
  PrioritizeMetaState,
} from './prioritizeMeta';
import { normalizeFeaturePriority } from './prioritizeMeta';
import {
  CLUSTER_MIGRATION_MAP,
  PROJECT_CLUSTERS_V2,
  type ProjectClusterV2,
} from './projectClustersEnhanced';
import type { UseCase } from './types';
import { FEATURE_TRANSFORMS } from './featureTransforms';

function resolveRecPriority(
  seed: Omit<BlaBlaRecommendation, 'id' | 'projectId' | 'status' | 'createdAt'>
): FeaturePriority {
  if (seed.suggestedPriority) return seed.suggestedPriority;
  return normalizeFeaturePriority(seed.suggestedPhase);
}
/**
 * Generate a stable ID for recommendations (same project + title → same id).
 */
export function stableRecommendationId(projectId: string, title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  return `rec-${projectId}-${slug || 'item'}`;
}

/** @deprecated Use stableRecommendationId for seed recommendations */
export function generateRecommendationId(): string {
  return `rec-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Load initial recommendations from enhanced clusters for a project.
 * Returns existing recommendations merged with any new ones from the seed.
 */
export function loadRecommendationsForProject(
  projectId: string,
  existingRecs: Record<string, BlaBlaRecommendation>
): BlaBlaRecommendation[] {
  const splitIds = CLUSTER_MIGRATION_MAP[projectId];
  if (splitIds?.length) {
    const seen = new Set<string>();
    return splitIds
      .flatMap((id) => loadRecommendationsForProject(id, existingRecs))
      .filter((rec) => {
        if (seen.has(rec.title)) return false;
        seen.add(rec.title);
        return true;
      })
      .map((rec) => ({ ...rec, projectId }));
  }

  const cluster = PROJECT_CLUSTERS_V2.find((c) => c.id === projectId);
  if (!cluster) return Object.values(existingRecs).filter((r) => r.projectId === projectId);

  const existing = Object.values(existingRecs).filter((r) => r.projectId === projectId);
  const existingTitles = new Set(existing.map((r) => r.title));

  const newRecs: BlaBlaRecommendation[] = cluster.initialRecommendations
    .filter((seed) => !existingTitles.has(seed.title))
    .map((seed) => ({
      ...seed,
      suggestedPriority: resolveRecPriority(seed),
      id: stableRecommendationId(projectId, seed.title),
      projectId,
      status: 'suggested' as const,
      createdAt: new Date().toISOString(),
    }));

  return [...existing, ...newRecs];
}

/** Merged plan preview for legacy clusters that should split into multiple workstreams. */
function legacySplitPlan(projectId: string): ProjectPlan | undefined {
  const splitIds = CLUSTER_MIGRATION_MAP[projectId];
  if (!splitIds?.length) return undefined;

  const parts = splitIds
    .map((id) => PROJECT_CLUSTERS_V2.find((c) => c.id === id))
    .filter(Boolean) as ProjectClusterV2[];

  if (parts.length === 0) return undefined;

  return {
    problemStatement: parts.map((p) => `[${p.name}] ${p.plan.problemStatement}`).join(' '),
    opportunity: parts.map((p) => p.plan.opportunity).join(' '),
    solutions: parts.flatMap((p) => p.plan.solutions),
    expectedImpact: parts.map((p) => p.plan.expectedImpact).join(' '),
    targetAudience: Array.from(new Set(parts.flatMap((p) => p.plan.targetAudience))),
    businessValue: parts.map((p) => p.plan.businessValue).join(' '),
    technicalApproach: parts.map((p) => p.plan.technicalApproach).join(' '),
    risks: [
      `Recommended split: ${parts.map((p) => p.name).join(' + ')}`,
      ...parts.flatMap((p) => p.plan.risks),
    ],
    dependencies: Array.from(new Set(parts.flatMap((p) => p.plan.dependencies))),
  };
}

/**
 * Load project plan from enhanced clusters (seed) or meta (user edits).
 */
export function loadProjectPlan(
  projectId: string,
  metaPlans?: Record<string, ProjectPlan>
): ProjectPlan | undefined {
  if (metaPlans?.[projectId]) return metaPlans[projectId];
  const cluster = PROJECT_CLUSTERS_V2.find((c) => c.id === projectId);
  if (cluster) return cluster.plan;
  return legacySplitPlan(projectId);
}

/**
 * Get all projects with their plans and recommendations merged.
 */
export function getEnhancedProjects(
  meta: PrioritizeMetaState
): Array<{
  cluster: ProjectClusterV2;
  plan: ProjectPlan;
  recommendations: BlaBlaRecommendation[];
}> {
  return PROJECT_CLUSTERS_V2.map((cluster) => ({
    cluster,
    plan: loadProjectPlan(cluster.id, meta.projectPlans) || cluster.plan,
    recommendations: loadRecommendationsForProject(cluster.id, meta.recommendations || {}),
  }));
}

/**
 * Initialize feature priority assignments from use cases if not already set.
 * Seeds transformed title/description from FEATURE_TRANSFORMS.
 */
export function initializeFeaturePhases(
  useCases: UseCase[],
  existingPhases: Record<string, FeaturePhaseAssignment>
): Record<string, FeaturePhaseAssignment> {
  const result: Record<string, FeaturePhaseAssignment> = {};

  Object.entries(existingPhases).forEach(([id, prev]) => {
    const transform = FEATURE_TRANSFORMS[id];
    result[id] = {
      ...prev,
      priority: normalizeFeaturePriority(prev.priority || prev.phase),
      transformedTitle: prev.transformedTitle || transform?.title,
      transformedDescription: prev.transformedDescription || transform?.description,
    };
  });

  useCases.forEach((uc) => {
    if (!result[uc.id]) {
      const transform = FEATURE_TRANSFORMS[uc.id];
      result[uc.id] = {
        caseId: uc.id,
        priority: normalizeFeaturePriority(
          uc.priorityStatus === 'now'
            ? 'high'
            : uc.priorityStatus === 'near'
              ? 'medium'
              : uc.priorityStatus === 'next'
                ? 'low'
                : 'backlog'
        ),
        effort: 'm',
        approved: false,
        transformedTitle: transform?.title,
        transformedDescription: transform?.description,
      };
    }
  });

  return result;
}

/**
 * Display title/description for a feature (transformed solution copy preferred).
 */
export function resolveFeatureCopy(
  uc: UseCase,
  assignment?: FeaturePhaseAssignment
): { title: string; description: string } {
  const transform = FEATURE_TRANSFORMS[uc.id];
  return {
    title: assignment?.transformedTitle || transform?.title || uc.name,
    description:
      assignment?.transformedDescription ||
      transform?.description ||
      uc.description ||
      '',
  };
}

/**
 * Calculate priority distribution for a set of features.
 */
export function calculatePhaseDistribution(
  caseIds: string[],
  featurePhases: Record<string, FeaturePhaseAssignment>
): Record<FeaturePriority, number> {
  const dist: Record<FeaturePriority, number> = {
    high: 0,
    medium: 0,
    low: 0,
    backlog: 0,
  };
  caseIds.forEach((id) => {
    const priority = normalizeFeaturePriority(
      featurePhases[id]?.priority || featurePhases[id]?.phase
    );
    dist[priority]++;
  });
  return dist;
}

/**
 * Get summary stats for a project.
 */
export function getProjectSummaryStats(
  cluster: ProjectClusterV2,
  useCases: UseCase[],
  featurePhases: Record<string, FeaturePhaseAssignment>,
  recommendations: BlaBlaRecommendation[]
): {
  featureCount: number;
  phaseDistribution: Record<FeaturePriority, number>;
  pendingRecommendations: number;
  approvedRecommendations: number;
} {
  const members = useCases.filter((uc) => cluster.caseIds.includes(uc.id));
  const phaseDistribution = calculatePhaseDistribution(
    members.map((m) => m.id),
    featurePhases
  );
  const projectRecs = recommendations.filter((r) => r.projectId === cluster.id);

  return {
    featureCount: members.length,
    phaseDistribution,
    pendingRecommendations: projectRecs.filter((r) => r.status === 'suggested').length,
    approvedRecommendations: projectRecs.filter((r) => r.status === 'approved').length,
  };
}

/**
 * Approve a recommendation and convert it to a feature request.
 */
export function approveRecommendation(
  rec: BlaBlaRecommendation
): BlaBlaRecommendation {
  return {
    ...rec,
    status: 'approved',
    approvedAt: new Date().toISOString(),
  };
}

/**
 * Reject a recommendation with optional reason.
 */
export function rejectRecommendation(
  rec: BlaBlaRecommendation,
  reason?: string
): BlaBlaRecommendation {
  return {
    ...rec,
    status: 'rejected',
    rejectedAt: new Date().toISOString(),
    rejectedReason: reason,
  };
}

/**
 * Generate AI-assisted recommendations for a project based on context.
 * This is a template for future AI integration.
 */
export function generateRecommendationsForProject(
  cluster: ProjectClusterV2,
  members: UseCase[],
  existingRecs: BlaBlaRecommendation[]
): Omit<BlaBlaRecommendation, 'id' | 'projectId' | 'status' | 'createdAt'>[] {
  // For now, return initial recommendations from seed if not already present
  const existingTitles = new Set(existingRecs.map((r) => r.title));
  return cluster.initialRecommendations.filter((r) => !existingTitles.has(r.title));
}

/**
 * Migrate from old cluster structure to enhanced clusters.
 * Maps case IDs from old clusters to new split clusters.
 */
export function migrateToEnhancedClusters(
  oldClusters: Array<{ id: string; caseIds: string[] }>,
  useCases: UseCase[]
): ProjectClusterV2[] {
  const caseIdSet = new Set(useCases.map((uc) => uc.id));
  
  return PROJECT_CLUSTERS_V2.map((cluster) => ({
    ...cluster,
    caseIds: cluster.caseIds.filter((id) => caseIdSet.has(id)),
  }));
}

/**
 * Export project as structured document (for reporting).
 */
export function exportProjectDocument(
  cluster: ProjectClusterV2,
  plan: ProjectPlan,
  members: UseCase[],
  featurePhases: Record<string, FeaturePhaseAssignment>,
  recommendations: BlaBlaRecommendation[]
): string {
  const approvedRecs = recommendations.filter((r) => r.status === 'approved');
  
  let doc = `# ${cluster.name}\n\n`;
  doc += `## Summary\n${cluster.summary}\n\n`;
  
  doc += `## Problem Statement\n${plan.problemStatement || 'Not defined'}\n\n`;
  doc += `## Opportunity\n${plan.opportunity || 'Not defined'}\n\n`;
  
  const solutionsText = getSolutionsText(plan);
  if (solutionsText) {
    doc += `## Solutions\n${solutionsText}\n\n`;
  }
  
  doc += `## Expected Impact\n${plan.expectedImpact || 'Not defined'}\n\n`;
  
  if (plan.targetAudience.length > 0) {
    doc += `## Target Audience\n${plan.targetAudience.map((t) => `- ${t}`).join('\n')}\n\n`;
  }
  
  doc += `## Business Value\n${plan.businessValue || 'Not defined'}\n\n`;
  doc += `## Technical Approach\n${plan.technicalApproach || 'Not defined'}\n\n`;
  
  if (plan.risks.length > 0) {
    doc += `## Risks\n${plan.risks.map((r) => `- ${r}`).join('\n')}\n\n`;
  }
  
  if (plan.dependencies.length > 0) {
    doc += `## Dependencies\n${plan.dependencies.map((d) => `- ${d}`).join('\n')}\n\n`;
  }
  
  doc += `## Features & Functionalities\n\n`;

  const byPriority = {
    high: [] as UseCase[],
    medium: [] as UseCase[],
    low: [] as UseCase[],
    backlog: [] as UseCase[],
  };
  members.forEach((uc) => {
    const priority = normalizeFeaturePriority(
      featurePhases[uc.id]?.priority || featurePhases[uc.id]?.phase
    );
    byPriority[priority].push(uc);
  });

  (['high', 'medium', 'low', 'backlog'] as const).forEach((priority) => {
    if (byPriority[priority].length > 0) {
      doc += `### ${priority.charAt(0).toUpperCase() + priority.slice(1)}\n`;
      byPriority[priority].forEach((uc) => {
        const copy = resolveFeatureCopy(uc, featurePhases[uc.id]);
        doc += `- **${copy.title}**${copy.description ? `: ${copy.description}` : ''}\n`;
      });
      doc += '\n';
    }
  });
  
  if (approvedRecs.length > 0) {
    doc += `## Approved Recommendations\n`;
    approvedRecs.forEach((rec) => {
      doc += `- **${rec.title}**: ${rec.description}\n`;
    });
  }
  
  return doc;
}
