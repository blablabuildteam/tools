import type { PriorityStatus } from './types';
import type { ProjectPlan, BlaBlaRecommendation } from './projectPlanTypes';

/**
 * Enhanced project clusters for Adsomnia with:
 * - Recommended splits for large clusters
 * - Pre-filled project plans
 * - Initial blablabuild recommendations
 * 
 * Bump CLUSTERS_ENHANCED_VERSION when making structural changes.
 */

export interface ProjectClusterV2 {
  id: string;
  name: string;
  summary: string;
  rationale: string;
  caseIds: string[];
  suggestedHorizon?: PriorityStatus;
  primaryDelivery?: Array<'adsomnia' | 'blablabuild' | 'harlem-next' | 'bending-the-rules' | 'tbd'>;
  plan: ProjectPlan;
  initialRecommendations: Omit<BlaBlaRecommendation, 'id' | 'projectId' | 'status' | 'createdAt'>[];
}

export const CLUSTERS_ENHANCED_VERSION = 1;

/**
 * Recommended project structure with splits applied:
 * 
 * SPLITS APPLIED:
 * 1. affiliate-partner-ops (12 cases) → Partner Intelligence Hub
 *    (activation comms + knowledge/monitoring were split, then folded back —
 *    onboarding is a project, not a second theme)
 * 
 * 2. media-buy-performance (11 cases) →
 *    - mb-campaign-launch (5 cases) - Campaign launch & creative
 *    - mb-performance-ops (6 cases) - Performance monitoring & reporting
 */
export const PROJECT_CLUSTERS_V2: ProjectClusterV2[] = [
  // ══════════════════════════════════════════════════════════════════════════
  // EMAIL / ONGAGE - Unchanged (6 cases, coherent scope)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'email-ongage',
    name: 'Email Content and Delivery Engine',
    summary:
      'First, speed up email content production so it can run at scale and on brand — copy, templates, and write-back into Ongage as one loop. Once that is shipping, look at the rest of the desk: send health, quotas, server distribution, and alerts that actually matter.',
    rationale: 'Shared Ongage/ESP surface — delivery reliability and message craft land as one initiative.',
    suggestedHorizon: 'now',
    primaryDelivery: ['adsomnia', 'bending-the-rules', 'blablabuild'],
    caseIds: ['6wwxlvke', '0zzpakqt', 'hss1gydb', 'yax6ipd9', 'q8t5rvsh'],
    plan: {
      problemStatement: 'Email team spends significant time on manual message creation, compliance checking, and monitoring delivery health across servers. No unified view of send capacity and server distribution.',
      opportunity: 'Automate compliant message generation, centralize delivery monitoring, and optimize server distribution to increase email throughput while reducing manual effort and compliance risk.',
      solutions: [
        'Email production loop — copy, template fills, Ongage write-back, and performance back into the next pack',
        'Automated HTML email template builder with brand consistency',
        'Real-time Slack alerts for delivery issues (bounces, complaints, blacklists)',
        'Daily send quota dashboard with predictive capacity planning',
        'Server distribution optimizer based on deliverability metrics',
      ],
      expectedImpact: '50% reduction in message creation time, 30% improvement in deliverability rates, near-zero compliance incidents.',
      targetAudience: ['Email Marketing Team', 'Compliance', 'Operations'],
      businessValue: 'Increased email revenue through higher deliverability and send volume. Reduced legal risk through automated compliance. Freed team capacity for strategic campaign work.',
      technicalApproach: 'Claude integration for content generation with compliance rules. Ongage API for delivery metrics. Slack webhooks for alerting. Dashboard on existing BI stack.',
      risks: [
        'Ongage API rate limits may constrain real-time monitoring',
        'Compliance rules need regular legal review and updates',
        'Server distribution changes need careful rollout to avoid deliverability drops',
      ],
      dependencies: [
        'Ongage API access and documentation',
        'Compliance rule definitions from legal',
        'Slack workspace integration approval',
      ],
    },
    initialRecommendations: [
      {
        title: 'A/B Testing Framework for Subject Lines',
        description: 'Automated subject line testing with statistical significance calculation and winner selection.',
        rationale: 'Client already generates variants but lacks systematic testing. Quick win that compounds over time.',
        expectedValue: '10-20% improvement in open rates through data-driven subject line optimization.',
        suggestedPhase: 'near',
        effort: 's',
        category: 'analytics',
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // AFFILIATE — one partner lifecycle desk
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'partner-intelligence',
    name: 'Partner Intelligence Hub',
    summary:
      'First, one partner desk AMs will actually use: knowledge in one place, and outreach that stays personal at scale — activation packs, digests, and pause notices. Once that is trusted, automate the rest of the cycle — POs, payment status, LP alerts, lead dossiers, and a unified partner CRM.',
    rationale:
      'Activation comms and partner intelligence are the same AM job. Onboarding is a project on this desk; pause notices, digests, POs, CRM, briefs, and leads are maintenance and growth of the same relationships — not a second theme.',
    suggestedHorizon: 'near',
    primaryDelivery: ['adsomnia', 'blablabuild'],
    caseIds: [
      's01zg1dt',
      'nq108m56',
      'aiqyvin4',
      '24lddyfa',
      'nuftl8dc',
      '0pk6tzpv',
      '7oexv73t',
      'qa6wbwif',
      '07g9fjmq',
      'c2tybb1k',
      '3z1pgtaa',
      '6xgc2yoh',
      '9qpxrbua',
    ],
    plan: {
      problemStatement:
        'Partner work is split across chats, exports, Everflow, and personal Claude skills. Onboarding is inconsistent; maintenance (pauses, digests, POs, follow-ups) is manual; knowledge lives in people’s heads. Treating “activation” and “intelligence” as two tools duplicates the affiliate desk.',
      opportunity:
        'One Partner Intelligence Hub. The activation pack is the onboarding project. Everything else is how AMs maintain, grow, and manage partners — with knowledge and performance in the same place as the messages.',
      solutions: [
        'Personalized activation pack for net-new partners (onboarding)',
        'Maintenance comms: pause notices, weekly offer digest, PO requests, HN sync',
        'Morning performance brief and LP alerts',
        'Telegram notetaker + partner knowledge CRM',
        'Unified client/partner CRM across notes, Everflow, and briefs (later scale of the knowledge layer)',
        'Payment-cycle status and affiliate lead dossiers',
      ],
      expectedImpact:
        'No second partner theme. Onboarding and ongoing management share context. Faster first send, fewer dropped follow-ups, one knowledge layer.',
      targetAudience: ['Affiliate Management', 'Partner Success', 'BI / Pricing', 'Finance (payment cycle)'],
      businessValue:
        'Faster activation and better retention from the same desk. AMs spend time on relationships, not assembling packs and hunting notes.',
      technicalApproach:
        'Activation pack already specified (Everflow + Telegram + BI). Remaining projects attach to the same hub: exports, Telegram, Everflow read, and review-then-send patterns.',
      risks: [
        'Over-automation may feel impersonal to high-value partners',
        'PO automation blocked until Everflow write access is confirmed',
        'Telegram/Everflow access for LP alerts and chat capture',
      ],
      dependencies: [
        'Everflow partner records and (later) write access for POs',
        'Telegram groups / bot',
        'BI / Pricing for offer logic',
        'Historic comms and chat as knowledge',
      ],
    },
    initialRecommendations: [
      {
        title: 'Competitive Intelligence Tracker',
        description: 'Monitor competitor offers, payout changes, and market movements relevant to your partner base.',
        rationale: 'Partners compare offers. Knowing the market helps with retention and negotiation.',
        expectedValue: 'Stay competitive on payouts. Identify market opportunities faster.',
        suggestedPhase: 'next',
        effort: 'm',
        category: 'automation',
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // MEDIA BUYING - SPLIT INTO TWO WORKSTREAMS
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'mb-campaign-launch',
    name: 'Campaign Launch Engine',
    summary: 'Streamline campaign creation, creative briefing, and launch execution for media buying.',
    rationale: 'Campaign launch and creative work share a creation/briefing workflow distinct from ongoing performance monitoring.',
    suggestedHorizon: 'now',
    primaryDelivery: ['adsomnia', 'harlem-next', 'blablabuild'],
    caseIds: ['px4a19ax', 'pfnizv8a', 'bcutgw41', 'cy7gzjyt', 'jj12rux9'],
    plan: {
      problemStatement: 'Campaign launches are slow due to manual creative briefing, repeated setup tasks, and lack of templates. Creative strategy is ad-hoc rather than systematic.',
      opportunity: 'Build a campaign launch engine that accelerates time-to-market with templated workflows, AI-assisted briefing, and automated setup.',
      solutions: [
        'Campaign management dashboard for MB workflow',
        'Ad network auto-optimization triggers',
        'Creative strategy system with AI-generated briefs',
        'Claude-assisted campaign launch checklist',
        'Automated offer upload to trackers',
      ],
      expectedImpact: '50% faster campaign launches, consistent creative quality, reduced setup errors.',
      targetAudience: ['Media Buying Team', 'Creative Team', 'Campaign Managers'],
      businessValue: 'Faster launches = faster revenue. Better creatives = higher conversion. Less manual work = more campaigns per buyer.',
      technicalApproach: 'Integration with Harlem Next tooling for campaign management. Claude for creative briefing. API connections to trackers for automated uploads.',
      risks: [
        'Harlem Next integration complexity and timelines',
        'Creative automation may need human review for brand safety',
        'Tracker API changes could break upload automation',
      ],
      dependencies: [
        'Harlem Next platform access and documentation',
        'Tracker API access (Voluum, etc.)',
        'Creative asset templates and brand guidelines',
      ],
    },
    initialRecommendations: [
      {
        title: 'Creative Performance Predictor',
        description: 'AI analysis of creative elements (images, copy, CTAs) with predicted performance scores.',
        rationale: 'Currently creative decisions are intuition-based. Data-driven creative selection improves results.',
        expectedValue: '15% improvement in creative hit rate through data-driven selection.',
        suggestedPhase: 'next',
        effort: 'l',
        category: 'analytics',
      },
    ],
  },
  {
    id: 'mb-performance-ops',
    name: 'Performance Monitoring Hub',
    summary:
      'First, one trusted performance picture: centralize the data and only surface insights and anomalies that actually matter. Once that desk is believed, start automating the actions that follow — YieldPro routing, pacing, and the reporting packs that still get rebuilt by hand.',
    rationale: 'Ongoing performance monitoring and reporting share a data/alerting focus distinct from campaign launch.',
    suggestedHorizon: 'now',
    primaryDelivery: ['adsomnia', 'blablabuild'],
    caseIds: ['ytfkqqwj', 'ldfa53nk', 'id1vevde', '2e5qnofn'],
    plan: {
      problemStatement: 'Performance monitoring is manual and reactive. Buyers spend hours on reporting instead of optimization. Issues are discovered too late.',
      opportunity: 'Build a performance operations center with automated reporting, real-time alerts, and optimization recommendations.',
      solutions: [
        'MB performance reporting — custom dashboard on the Looker Studio feed, anomaly agent, daily/weekly packs, Slack alerts',
        'Financial MB reporting — kill Sheets; API + manual template entry; what-matters packs and Slack',
        'YP auto-optimization integration',
        'YP alert system for tech/performance metrics',
      ],
      expectedImpact: '80% reduction in reporting time, 15-minute issue detection, data-driven optimization.',
      targetAudience: ['Media Buying Team', 'Finance', 'Operations'],
      businessValue: 'Faster issue response = reduced wasted spend. Automated reporting = more optimization time. Better visibility = better decisions.',
      technicalApproach: 'Looker Studio feed for performance packs. Separate financial ledger (API + manual entry, no Sheets). YP is another project.',
      risks: [
        'Tracker API rate limits may constrain real-time monitoring',
        'Alert fatigue if thresholds not tuned properly',
        'YP optimization needs careful rollout to avoid performance drops',
      ],
      dependencies: [
        'Tracker API access and documentation',
        'YP API access',
        'BI platform for dashboards',
        'Slack workspace for alerting',
      ],
    },
    initialRecommendations: [
      {
        title: 'Budget Pacing Alerts',
        description: 'Proactive alerts when campaigns are under/over-pacing against daily/weekly budgets.',
        rationale: 'Budget management is currently reactive. Pacing alerts enable proactive adjustment.',
        expectedValue: 'Eliminate budget overspend. Maximize budget utilization.',
        suggestedPhase: 'now',
        effort: 's',
        category: 'quick-win',
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // AD OPS TRACKER - Unchanged (6 cases, coherent scope)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'adops-tracker',
    name: 'Tracker Operations Center',
    summary:
      'First, one trusted tracker picture: centralize CPM, flow, and drop data and only alert on what Ad Ops should act on. Once that is believed, automate the actions — offer uploads, TSD share, banner cuts, and the flow moves the playbook already encodes.',
    rationale: 'Tracker hygiene + flow decisions share systems; fold low-leverage tasks into alerting rather than side quests.',
    suggestedHorizon: 'near',
    primaryDelivery: ['adsomnia', 'blablabuild'],
    caseIds: ['zvnakelf', '52k9ejik', 'fr8ri4kx', '0xnq9umd', '6nwxxw5m', '1gbuvwx4'],
    plan: {
      problemStatement: 'Tracker flows are maintained ad-hoc, leading to inconsistencies and missed optimization opportunities. CPM monitoring is manual and reactive.',
      opportunity: 'Create a tracker control plane with standardized flows, automated monitoring, and systematic optimization.',
      solutions: [
        'Flow optimization playbooks with best practices',
        'CPM reporting & drop alerts — Looker Studio feed, daily pack, Slack (absorbs automated CPM reporting)',
        'TSD optimization guidelines and automation',
        'Offer upload automation to Voluum',
        'ExAds banner optimization workflow',
        'CPM documentation consolidation into alerting',
      ],
      expectedImpact: 'Consistent flow quality, 30% faster issue resolution, systematic optimization.',
      targetAudience: ['Ad Ops Team', 'Media Buying Team'],
      businessValue: 'Better flow hygiene = higher conversion rates. Faster issue resolution = less wasted spend. Systematic optimization = sustainable performance.',
      technicalApproach: 'Voluum/ExAds API integration for monitoring. Playbook documentation in Notion/Confluence. Alerting via Slack.',
      risks: [
        'Voluum API complexity and rate limits',
        'Flow changes need careful testing before rollout',
        'ExAds optimization depends on their platform capabilities',
      ],
      dependencies: [
        'Voluum API access',
        'ExAds platform access',
        'Documentation platform for playbooks',
      ],
    },
    initialRecommendations: [],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BI / PRICING - Unchanged (7 cases, coherent scope)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'bi-pricing-payouts',
    name: 'Pricing Intelligence Hub',
    summary: 'Claude-first data-quality triage (knowledge center), payout defaults/moves, and pricing experiments. Live Looker is later.',
    rationale: 'BI/Pricing owns commercial rules + data truth — one initiative for payout/pricing decisions.',
    suggestedHorizon: 'near',
    primaryDelivery: ['adsomnia', 'blablabuild'],
    caseIds: ['5wq983os', 'pnsh385v', 'l32k9os0', 'ge20ac29', 'yr4x9ymq', 'd49ghn33'],
    plan: {
      problemStatement: 'Pricing decisions are slow and risky due to manual analysis. Data quality issues cause incorrect payouts. No systematic experimentation framework.',
      opportunity: 'Build a pricing intelligence platform with automated analysis, data quality monitoring, and experimentation capabilities.',
      solutions: [
        'DB / Looker data-quality triage — Claude + knowledge center; productize the center only after the connect',
        'Text-to-SQL investigative queries on BI schema',
        'Automated payout defaults management',
        'Payout increase/decrease analysis automation',
        'Pricing simulation sandbox for scenarios',
        'Price experimentation framework on exports',
      ],
      expectedImpact: '70% faster pricing decisions, zero data quality incidents, systematic experimentation.',
      targetAudience: ['BI Team', 'Pricing Team', 'Finance'],
      businessValue: 'Better pricing = higher margins. Data quality = accurate payouts. Experimentation = optimized commercial strategy.',
      technicalApproach: 'Looker/DB integration for data. Claude for text-to-SQL. Simulation models on owned inputs. Experimentation framework on existing analytics.',
      risks: [
        'Everflow write access needed for payout automation',
        'Text-to-SQL accuracy depends on schema documentation',
        'Price experiments need careful rollout to avoid partner impact',
      ],
      dependencies: [
        'Looker/DB read access',
        'Schema documentation for text-to-SQL',
        'Everflow write access for payout automation',
      ],
    },
    initialRecommendations: [],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // FINANCE INTEL - Unchanged (4 cases, coherent scope)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'finance-intel',
    name: 'Finance Decision Briefs',
    summary: 'KYC dossiers, CoS scenarios, cashflow and P&L anomaly briefs on exports — not live banking rails.',
    rationale: 'Finance decision-support pack: same export/model surface, Claude-assisted briefs.',
    suggestedHorizon: 'next',
    primaryDelivery: ['adsomnia', 'blablabuild'],
    caseIds: ['i6n2lr3x', 'trvcvu9j', 'gbs3hxtt', 'mu3ctc3n'],
    plan: {
      problemStatement: 'Finance decisions require manual research and analysis. KYC is time-consuming. Scenario modeling is ad-hoc.',
      opportunity: 'Automate finance research and analysis to enable faster, better-informed decisions.',
      solutions: [
        'KYC dossier builder with automated research',
        'Business modeling scenarios on owned inputs',
        'Cashflow forecasting from CoS/pricing exports',
        'P&L analysis automation',
      ],
      expectedImpact: '60% faster financial research, consistent analysis quality, better scenario planning.',
      targetAudience: ['Finance Team', 'Leadership', 'Compliance'],
      businessValue: 'Faster decisions = competitive advantage. Better analysis = reduced risk. Scenario planning = strategic clarity.',
      technicalApproach: 'Claude for research and analysis. Export integration for data. Modeling on spreadsheet/BI tools.',
      risks: [
        'KYC automation needs compliance review',
        'Financial modeling accuracy depends on data quality',
        'Cashflow forecasting sensitive to assumptions',
      ],
      dependencies: [
        'Financial data exports',
        'Compliance guidelines for KYC',
        'Business model inputs and assumptions',
      ],
    },
    initialRecommendations: [
      {
        title: 'Partner Financial Health Score',
        description: 'Automated assessment of partner financial stability based on public data and payment history.',
        rationale: 'Currently partner financial risk is assessed ad-hoc. Systematic scoring improves risk management.',
        expectedValue: 'Reduce bad debt by 20%. Better partner selection.',
        suggestedPhase: 'next',
        effort: 'm',
        category: 'analytics',
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // HR ENABLEMENT - Unchanged (7 cases, coherent scope)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'hr-enablement',
    name: 'HR Assistant Hub',
    summary: 'Handbook Q&A (merge dups), CV/cover-letter screen + interview kit, weekly goals, onboarding plans — Claude-first HR kit.',
    rationale: 'Content/skills in Claude with HR as owner; handbook duplicates collapse into one agent.',
    suggestedHorizon: 'now',
    primaryDelivery: ['adsomnia', 'blablabuild'],
    caseIds: ['yluy9f0i', '0x7wpyj2', 'wt3mt2xj', 'hus4qepz', 'urvwa7mq', 'xh4zjeeb', 'f7x2rz3z'],
    plan: {
      problemStatement: 'HR processes are manual and inconsistent. Employee questions require HR time. CV screening is a bottleneck. Onboarding lacks personalization.',
      opportunity: 'Build a Claude-first HR toolkit that automates routine tasks while improving employee experience.',
      solutions: [
        'HR handbook Q&A agent (consolidating duplicates)',
        'One Claude skill: CV + cover letter screen, then interview kit',
        'Weekly HR checks with priorities extraction',
        'Personalized onboarding plan generation',
        'HR workflow integration with Personio/Slack',
      ],
      expectedImpact: '70% reduction in routine HR queries, 50% faster CV screening, consistent onboarding quality.',
      targetAudience: ['HR Team', 'All Employees', 'Hiring Managers'],
      businessValue: 'Freed HR capacity for strategic work. Better candidate experience. Consistent employee support. Faster onboarding.',
      technicalApproach: 'Claude for handbook Q&A and CV analysis. Integration with Personio for workflows. Slack for accessibility.',
      risks: [
        'Handbook Q&A accuracy depends on content quality',
        'CV screening needs bias review',
        'Personio/Slack integration complexity',
      ],
      dependencies: [
        'Employee handbook content',
        'CV screening criteria',
        'Personio API access',
        'Slack workspace integration',
      ],
    },
    initialRecommendations: [
      {
        title: 'Employee FAQ Analytics',
        description: 'Track and analyze common employee questions to identify handbook gaps and process improvements.',
        rationale: 'Understanding what employees ask reveals where documentation and processes need improvement.',
        expectedValue: 'Reduce repeat questions by 30%. Identify process improvement opportunities.',
        suggestedPhase: 'near',
        effort: 's',
        category: 'analytics',
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // API GROWTH - Unchanged (5 cases, coherent scope)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'api-growth',
    name: 'API Growth Hub',
    summary: 'See and grow the API funnel: monitor, insights, partner onboarding assist, traffic radar.',
    rationale: 'API commercial motion + funnel visibility as one growth initiative.',
    suggestedHorizon: 'next',
    primaryDelivery: ['adsomnia', 'blablabuild'],
    caseIds: ['3ylknke6', '80h0qak5', '3mtuqw72', 'uexqvvwe', '89rj00th'],
    plan: {
      problemStatement: 'No unified view of API funnel performance. Partner onboarding is manual. Traffic opportunities are missed.',
      opportunity: 'Build API growth visibility and automation to accelerate partner acquisition and traffic growth.',
      solutions: [
        'API funnel monitoring with alerts',
        'API growth insights dashboard',
        'Partner onboarding bot for API partners',
        'Traffic Start/Scale Radar for opportunities',
        'Automated offer addition workflow',
      ],
      expectedImpact: 'Complete funnel visibility, 40% faster partner onboarding, systematic opportunity identification.',
      targetAudience: ['API Team', 'Partner Success', 'Business Development'],
      businessValue: 'Faster partner activation = faster revenue. Better visibility = better decisions. Opportunity radar = growth acceleration.',
      technicalApproach: 'API metrics integration for monitoring. Claude for onboarding assist. Dashboard on existing BI stack.',
      risks: [
        'API metrics access may need development work',
        'Onboarding bot needs CRM/Finance/EF path',
        'Traffic radar depends on data availability',
      ],
      dependencies: [
        'API metrics access',
        'CRM integration for partner data',
        'Everflow access for offer management',
      ],
    },
    initialRecommendations: [],
  },
];

/**
 * Map from original cluster IDs to new cluster IDs for migration.
 */
export const CLUSTER_MIGRATION_MAP: Record<string, string[]> = {
  'affiliate-partner-ops': ['partner-intelligence'],
  'partner-activation': ['partner-intelligence'],
  'media-buy-performance': ['mb-campaign-launch', 'mb-performance-ops'],
};

/** Seed recs that duplicate developed projects — prune from saved sessions on seed bump. */
export const DROPPED_RECOMMENDATION_TITLES = new Set([
  'Deliverability Health Score Dashboard',
  'Partner Communication History Timeline',
  'Partner Response Sentiment Tracking',
  'Partner Health Score Dashboard',
  'CRM data audit',
  'Campaign Launch Checklist Automation',
  'Anomaly Detection for Campaign Performance',
  'Flow Health Score',
  'Payout Anomaly Detection',
  'Margin Opportunity Finder',
  'API Integration Health Monitor',
  'Onboarding Progress Tracker',
]);

/**
 * Get project by ID.
 */
export function getProjectById(id: string): ProjectClusterV2 | undefined {
  return PROJECT_CLUSTERS_V2.find((p) => p.id === id);
}

/**
 * Get all project IDs.
 */
export function getAllProjectIds(): string[] {
  return PROJECT_CLUSTERS_V2.map((p) => p.id);
}

/**
 * Count features across projects by phase.
 */
export function countFeaturesByPhase(projects: ProjectClusterV2[]): Record<string, number> {
  const counts: Record<string, number> = { now: 0, near: 0, next: 0, later: 0 };
  projects.forEach((p) => {
    const horizon = p.suggestedHorizon || 'later';
    counts[horizon] = (counts[horizon] || 0) + p.caseIds.length;
  });
  return counts;
}
