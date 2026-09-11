import type { PriorityStatus } from './types';
import type { FeaturePriority } from './prioritizeMeta';

/**
 * High-level project plan structure for each workstream.
 * Provides strategic context beyond the tactical feature list.
 */
export interface ProjectPlan {
  problemStatement: string;
  opportunity: string;
  /** Single text describing the overall solution approach (legacy: was string[]) */
  solutions: string | string[];
  expectedImpact: string;
  targetAudience: string[];
  businessValue: string;
  technicalApproach: string;
  risks: string[];
  dependencies: string[];
  updatedAt?: string;
}

/**
 * Feature request transformed from workshop submission.
 * More structured than raw use cases with clear acceptance criteria.
 */
export interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  priority: FeaturePriority;
  effort: 'xs' | 's' | 'm' | 'l' | 'xl';
  workshopOrigin: {
    caseId: string;
    name: string;
    description: string;
    department: string;
  };
  transformedAt?: string;
  approved: boolean;
}

/**
 * blablabuild recommendation for additional features.
 * AI-suggested enhancements that can be approved or rejected.
 */
export interface BlaBlaRecommendation {
  id: string;
  projectId: string;
  title: string;
  description: string;
  rationale: string;
  expectedValue: string;
  suggestedPriority?: FeaturePriority;
  /** @deprecated use suggestedPriority — mapped on load from now/near/next/later */
  suggestedPhase?: Exclude<PriorityStatus, 'kill'>;
  effort: 'xs' | 's' | 'm' | 'l' | 'xl';
  category: 'quick-win' | 'enhancement' | 'integration' | 'automation' | 'analytics';
  status: 'suggested' | 'approved' | 'rejected';
  approvedAt?: string;
  rejectedAt?: string;
  rejectedReason?: string;
  createdAt: string;
}

/**
 * Extended project cluster with plan and features.
 */
export interface ProjectClusterEnhanced {
  id: string;
  name: string;
  summary: string;
  rationale: string;
  caseIds: string[];
  suggestedHorizon?: PriorityStatus;
  primaryDelivery?: Array<'adsomnia' | 'blablabuild' | 'harlem-next' | 'bending-the-rules' | 'tbd'>;
  plan?: ProjectPlan;
  featureRequests?: FeatureRequest[];
  recommendations?: BlaBlaRecommendation[];
}

/**
 * Effort estimation in weeks (calendar, not person-weeks).
 */
export const EFFORT_WEEKS: Record<FeatureRequest['effort'], { min: number; max: number; label: string }> = {
  xs: { min: 0.5, max: 1, label: 'Extra Small (< 1 week)' },
  s: { min: 1, max: 2, label: 'Small (1-2 weeks)' },
  m: { min: 2, max: 4, label: 'Medium (2-4 weeks)' },
  l: { min: 4, max: 8, label: 'Large (4-8 weeks)' },
  xl: { min: 8, max: 16, label: 'Extra Large (8+ weeks)' },
};

/**
 * Recommendation category descriptions.
 */
export const RECOMMENDATION_CATEGORIES: Record<
  BlaBlaRecommendation['category'],
  { label: string; description: string; icon: string }
> = {
  'quick-win': {
    label: 'Quick Win',
    description: 'Low effort, high visibility improvements',
    icon: '⚡',
  },
  enhancement: {
    label: 'Enhancement',
    description: 'Improvements to existing capabilities',
    icon: '✨',
  },
  integration: {
    label: 'Integration',
    description: 'Connecting systems or data sources',
    icon: '🔗',
  },
  automation: {
    label: 'Automation',
    description: 'Reducing manual work through automation',
    icon: '🤖',
  },
  analytics: {
    label: 'Analytics',
    description: 'Better insights and reporting',
    icon: '📊',
  },
};

/**
 * Empty project plan template.
 */
export function emptyProjectPlan(): ProjectPlan {
  return {
    problemStatement: '',
    opportunity: '',
    solutions: '',
    expectedImpact: '',
    targetAudience: [],
    businessValue: '',
    technicalApproach: '',
    risks: [],
    dependencies: [],
  };
}

/** Get solutions as a string (handles legacy array format) */
export function getSolutionsText(plan?: ProjectPlan): string {
  if (!plan?.solutions) return '';
  if (Array.isArray(plan.solutions)) {
    return plan.solutions.join('\n\n');
  }
  return plan.solutions;
}

/**
 * Check if a project plan has meaningful content.
 */
export function hasProjectPlanContent(plan?: ProjectPlan): boolean {
  if (!plan) return false;
  const hasSolutions = Array.isArray(plan.solutions) ? plan.solutions.length > 0 : Boolean(plan.solutions);
  return Boolean(
    plan.problemStatement ||
    plan.opportunity ||
    hasSolutions ||
    plan.expectedImpact ||
    plan.targetAudience.length > 0 ||
    plan.businessValue ||
    plan.technicalApproach ||
    plan.risks.length > 0 ||
    plan.dependencies.length > 0
  );
}

/**
 * Calculate project plan completeness (0-100%).
 */
export function projectPlanCompleteness(plan?: ProjectPlan): number {
  if (!plan) return 0;
  const hasSolutions = Array.isArray(plan.solutions) ? plan.solutions.length > 0 : Boolean(plan.solutions);
  const fields = [
    plan.problemStatement,
    plan.opportunity,
    hasSolutions,
    plan.expectedImpact,
    plan.targetAudience.length > 0,
    plan.businessValue,
    plan.technicalApproach,
    plan.risks.length > 0,
    plan.dependencies.length > 0,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
}
