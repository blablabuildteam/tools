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
 * 1. affiliate-partner-ops (12 cases) → 
 *    - partner-activation (6 cases) - Partner communication & activation
 *    - partner-intelligence (6 cases) - Partner monitoring & knowledge
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
    name: 'Email Delivery & Content Engine',
    summary: 'Reliable ESP operations (quota, servers, alerts) plus compliant message/HTML craft in one Ongage stack.',
    rationale: 'Shared Ongage/ESP surface — delivery reliability and message craft land as one initiative.',
    suggestedHorizon: 'now',
    primaryDelivery: ['adsomnia', 'bending-the-rules', 'blablabuild'],
    caseIds: ['6wwxlvke', 'zbvbw4s5', '0zzpakqt', 'hss1gydb', 'yax6ipd9', 'q8t5rvsh'],
    plan: {
      problemStatement: 'Email team spends significant time on manual message creation, compliance checking, and monitoring delivery health across servers. No unified view of send capacity and server distribution.',
      opportunity: 'Automate compliant message generation, centralize delivery monitoring, and optimize server distribution to increase email throughput while reducing manual effort and compliance risk.',
      solutions: [
        'Claude-powered compliant message variant generator with legal guardrails',
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
      {
        title: 'Deliverability Health Score Dashboard',
        description: 'Single-pane view of sender reputation, blacklist status, and domain health across all sending IPs.',
        rationale: 'Currently monitoring is reactive. Proactive health monitoring prevents issues before they impact campaigns.',
        expectedValue: 'Early warning system reduces deliverability incidents by 40%.',
        suggestedPhase: 'now',
        effort: 'm',
        category: 'analytics',
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // AFFILIATE - SPLIT INTO TWO WORKSTREAMS
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'partner-activation',
    name: 'Partner Activation Hub',
    summary: 'Streamline partner onboarding, activation messaging, and routine communications with automated drafts and follow-ups.',
    rationale: 'Core partner communication loop (activation → messaging → follow-up) shares the same workflow and tools. Distinct from monitoring/intelligence work.',
    suggestedHorizon: 'near',
    primaryDelivery: ['adsomnia', 'blablabuild'],
    caseIds: ['s01zg1dt', 'nq108m56', 'aiqyvin4', '24lddyfa', 'nuftl8dc', '0pk6tzpv'],
    plan: {
      problemStatement: 'Partner activation and communication is manual and inconsistent. Follow-ups are missed, messaging lacks personalization, and there\'s no unified view of partner communication history.',
      opportunity: 'Create a systematic partner communication engine that automates routine outreach while maintaining personalization, ensuring no partner falls through the cracks.',
      solutions: [
        'Claude-powered personalized activation message generator',
        'Automated payout pause/change communication drafts',
        'Weekly partner digest automation from CSV/exports',
        'New offer follow-up reminder system with templates',
        'PO setting request automation with approval workflow',
        'Weekly sync digest aggregator for partner meetings',
      ],
      expectedImpact: '60% faster partner activation, 100% follow-up coverage, standardized communication quality.',
      targetAudience: ['Affiliate Management Team', 'Partner Success', 'Account Managers'],
      businessValue: 'Faster partner activation = faster revenue. Consistent communication = better partner retention. Reduced manual work = more time for relationship building.',
      technicalApproach: 'Claude for message generation with partner context. Google Sheets/CSV integration for data. Slack/email for delivery. Reminder system on existing workflow tools.',
      risks: [
        'Over-automation may feel impersonal to high-value partners',
        'PO automation blocked until Everflow write access confirmed',
        'Partner data quality varies, affecting personalization',
      ],
      dependencies: [
        'Partner data access (CRM, spreadsheets)',
        'Email/messaging platform integration',
        'Everflow write access for PO automation',
      ],
    },
    initialRecommendations: [
      {
        title: 'Partner Communication History Timeline',
        description: 'Unified view of all communications with each partner across channels (email, Telegram, meetings).',
        rationale: 'Currently team members don\'t have visibility into each other\'s partner communications, leading to duplicate outreach or dropped balls.',
        expectedValue: 'Single source of truth for partner relationships. Eliminates duplicate messages and improves handoffs.',
        suggestedPhase: 'near',
        effort: 'm',
        category: 'integration',
      },
      {
        title: 'Partner Response Sentiment Tracking',
        description: 'Automatically tag partner responses as positive/neutral/negative to surface at-risk relationships.',
        rationale: 'Early warning on partner satisfaction enables proactive relationship management.',
        expectedValue: 'Identify at-risk partners before they churn. Prioritize account manager attention.',
        suggestedPhase: 'next',
        effort: 's',
        category: 'analytics',
      },
    ],
  },
  {
    id: 'partner-intelligence',
    name: 'Partner Intelligence Hub',
    summary: 'Centralize partner knowledge, monitor traffic/performance signals, and generate leads — the intelligence layer for affiliate operations.',
    rationale: 'Knowledge management, monitoring, and lead generation share an intelligence/data focus distinct from direct partner communication.',
    suggestedHorizon: 'near',
    primaryDelivery: ['adsomnia', 'blablabuild'],
    caseIds: ['7oexv73t', 'qa6wbwif', '07g9fjmq', 'c2tybb1k', '3z1pgtaa', '6xgc2yoh'],
    plan: {
      problemStatement: 'Partner knowledge is scattered across chats, notes, and people\'s heads. No systematic way to track partner health signals or identify new partner opportunities.',
      opportunity: 'Build a partner intelligence system that captures knowledge, monitors health signals, and surfaces growth opportunities.',
      solutions: [
        'Morning reports automation (export → AI brief)',
        'Telegram chat notetaker for partner knowledge capture',
        'Partner knowledge CRM from pasted chat histories',
        'Landing page performance alerts via Telegram bot',
        'Payment cycle update tracker',
        'Affiliate lead generator with research dossiers',
      ],
      expectedImpact: 'Complete partner knowledge base, real-time performance visibility, 2x lead pipeline.',
      targetAudience: ['Affiliate Management Team', 'Business Development', 'Finance'],
      businessValue: 'Better partner decisions through data. Faster issue resolution through centralized knowledge. Growth through systematic lead generation.',
      technicalApproach: 'Telegram bot for chat capture and alerts. Claude for knowledge extraction and lead research. Integration with existing data sources for monitoring.',
      risks: [
        'Telegram bot LP alerts requires scoped Everflow access',
        'Knowledge extraction accuracy depends on chat quality',
        'Lead dossiers need careful compliance review',
      ],
      dependencies: [
        'Telegram API access',
        'Everflow read access for performance data',
        'Partner data sources for lead research',
      ],
    },
    initialRecommendations: [
      {
        title: 'Partner Health Score Dashboard',
        description: 'Composite score combining traffic trends, payment history, communication frequency, and conversion rates.',
        rationale: 'Currently partner health is assessed ad-hoc. Systematic scoring enables proactive management.',
        expectedValue: 'Predict partner churn 30 days in advance. Prioritize team focus on high-risk/high-value partners.',
        suggestedPhase: 'near',
        effort: 'm',
        category: 'analytics',
      },
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
        title: 'Campaign Launch Checklist Automation',
        description: 'Interactive checklist that auto-validates campaign setup (targeting, budgets, tracking) before launch.',
        rationale: 'Launch errors are costly. Systematic validation catches mistakes before they impact performance.',
        expectedValue: 'Eliminate launch errors. Reduce QA time by 70%.',
        suggestedPhase: 'now',
        effort: 's',
        category: 'quick-win',
      },
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
    summary: 'Real-time performance visibility, automated reporting, and proactive alerting for media buying operations.',
    rationale: 'Ongoing performance monitoring and reporting share a data/alerting focus distinct from campaign launch.',
    suggestedHorizon: 'now',
    primaryDelivery: ['adsomnia', 'blablabuild'],
    caseIds: ['ytfkqqwj', '1y16z6b7', 'ldfa53nk', 'mg6vhvhm', 'id1vevde', '2e5qnofn'],
    plan: {
      problemStatement: 'Performance monitoring is manual and reactive. Buyers spend hours on reporting instead of optimization. Issues are discovered too late.',
      opportunity: 'Build a performance operations center with automated reporting, real-time alerts, and optimization recommendations.',
      solutions: [
        'MB performance reporting automation (ScaleWizard/exports)',
        'Performance alarming with threshold-based alerts',
        'Financial MB reporting automation',
        'Daily stats autofill from tracker exports',
        'YP auto-optimization integration',
        'YP alert system for tech/performance metrics',
      ],
      expectedImpact: '80% reduction in reporting time, 15-minute issue detection, data-driven optimization.',
      targetAudience: ['Media Buying Team', 'Finance', 'Operations'],
      businessValue: 'Faster issue response = reduced wasted spend. Automated reporting = more optimization time. Better visibility = better decisions.',
      technicalApproach: 'Tracker API integration for data. Alerting system with Slack/email. Dashboard on existing BI stack. YP API for optimization.',
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
        title: 'Anomaly Detection for Campaign Performance',
        description: 'ML-based detection of unusual performance patterns (sudden drops, conversion anomalies).',
        rationale: 'Simple threshold alerts miss complex issues. Anomaly detection catches problems threshold-based monitoring misses.',
        expectedValue: 'Catch performance issues 2 hours earlier on average.',
        suggestedPhase: 'near',
        effort: 'm',
        category: 'automation',
      },
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
    summary: 'Keep Voluum/ExAds flows clean: playbooks, CPM/TSD signals, uploads — Ad Ops control plane.',
    rationale: 'Tracker hygiene + flow decisions share systems; fold low-leverage tasks into alerting rather than side quests.',
    suggestedHorizon: 'near',
    primaryDelivery: ['adsomnia', 'blablabuild'],
    caseIds: ['zvnakelf', '52k9ejik', 'fr8ri4kx', '0xnq9umd', '6nwxxw5m', '1gbuvwx4'],
    plan: {
      problemStatement: 'Tracker flows are maintained ad-hoc, leading to inconsistencies and missed optimization opportunities. CPM monitoring is manual and reactive.',
      opportunity: 'Create a tracker control plane with standardized flows, automated monitoring, and systematic optimization.',
      solutions: [
        'Flow optimization playbooks with best practices',
        'CPM drop alerting with automated investigation',
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
    initialRecommendations: [
      {
        title: 'Flow Health Score',
        description: 'Automated scoring of flow quality based on conversion rates, load times, and error rates.',
        rationale: 'Currently flow quality is assessed manually. Automated scoring surfaces issues and prioritizes fixes.',
        expectedValue: 'Identify problematic flows 50% faster. Prioritize optimization efforts.',
        suggestedPhase: 'near',
        effort: 's',
        category: 'analytics',
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // BI / PRICING - Unchanged (7 cases, coherent scope)
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'bi-pricing-payouts',
    name: 'Pricing Intelligence Hub',
    summary: 'Data-quality triage, payout defaults/moves, and pricing experiments on Looker/DB truth.',
    rationale: 'BI/Pricing owns commercial rules + data truth — one initiative for payout/pricing decisions.',
    suggestedHorizon: 'near',
    primaryDelivery: ['adsomnia', 'blablabuild'],
    caseIds: ['bidqcl01', 'pnsh385v', '5wq983os', 'l32k9os0', 'ge20ac29', 'yr4x9ymq', 'd49ghn33'],
    plan: {
      problemStatement: 'Pricing decisions are slow and risky due to manual analysis. Data quality issues cause incorrect payouts. No systematic experimentation framework.',
      opportunity: 'Build a pricing intelligence platform with automated analysis, data quality monitoring, and experimentation capabilities.',
      solutions: [
        'Data quality triage system with automated checks',
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
    initialRecommendations: [
      {
        title: 'Margin Opportunity Finder',
        description: 'Automated analysis to identify underpriced offers and margin improvement opportunities.',
        rationale: 'Manual margin analysis misses opportunities. Systematic scanning surfaces quick wins.',
        expectedValue: '5-10% margin improvement on identified opportunities.',
        suggestedPhase: 'near',
        effort: 'm',
        category: 'analytics',
      },
      {
        title: 'Payout Anomaly Detection',
        description: 'Automated flagging of unusual payout patterns that may indicate errors or fraud.',
        rationale: 'Manual review misses subtle patterns. Automated detection catches issues faster.',
        expectedValue: 'Reduce payout errors by 50%. Faster fraud detection.',
        suggestedPhase: 'now',
        effort: 's',
        category: 'automation',
      },
    ],
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
    summary: 'Handbook Q&A (merge dups), CV screening, weekly goals, onboarding plans — Claude-first HR kit.',
    rationale: 'Content/skills in Claude with HR as owner; handbook duplicates collapse into one agent.',
    suggestedHorizon: 'now',
    primaryDelivery: ['adsomnia', 'blablabuild'],
    caseIds: ['yluy9f0i', '0x7wpyj2', 'wt3mt2xj', 'hus4qepz', 'urvwa7mq', 'xh4zjeeb', 'f7x2rz3z'],
    plan: {
      problemStatement: 'HR processes are manual and inconsistent. Employee questions require HR time. CV screening is a bottleneck. Onboarding lacks personalization.',
      opportunity: 'Build a Claude-first HR toolkit that automates routine tasks while improving employee experience.',
      solutions: [
        'HR handbook Q&A agent (consolidating duplicates)',
        'Recruitment scorecards with CV analysis',
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
      {
        title: 'Onboarding Progress Tracker',
        description: 'Automated tracking of new hire onboarding completion with manager notifications.',
        rationale: 'Currently onboarding progress is tracked manually. Automated tracking ensures nothing falls through.',
        expectedValue: '100% onboarding completion tracking. Faster time-to-productivity.',
        suggestedPhase: 'now',
        effort: 's',
        category: 'quick-win',
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
    initialRecommendations: [
      {
        title: 'API Integration Health Monitor',
        description: 'Real-time monitoring of partner API integration health with proactive outreach on issues.',
        rationale: 'Integration issues cause partner churn. Proactive monitoring improves retention.',
        expectedValue: 'Reduce integration-related churn by 25%.',
        suggestedPhase: 'next',
        effort: 'm',
        category: 'automation',
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SMALLER PROJECTS - Unchanged
  // ══════════════════════════════════════════════════════════════════════════
  {
    id: 'crm-platform',
    name: 'Client CRM Platform',
    summary: 'Central client database across systems — treat as a multi-phase program, not a sprint.',
    rationale: 'Big-rock integration; keep Later until phased slices and owner are clear.',
    suggestedHorizon: 'later',
    primaryDelivery: ['tbd', 'adsomnia', 'blablabuild'],
    caseIds: ['9qpxrbua'],
    plan: {
      problemStatement: 'Client data is fragmented across multiple systems with no single source of truth.',
      opportunity: 'Create unified client view to improve operations and decision-making.',
      solutions: ['Central CRM integration connecting all systems'],
      expectedImpact: 'Single source of truth for client data, improved operational efficiency.',
      targetAudience: ['All Teams'],
      businessValue: 'Better client management = improved retention and growth.',
      technicalApproach: 'Multi-system integration program with phased delivery.',
      risks: ['Large scope, complex integration', 'Unclear ownership', 'Multi-system dependencies'],
      dependencies: ['System access across organization', 'Clear owner assignment', 'Phased roadmap'],
    },
    initialRecommendations: [
      {
        title: 'CRM Data Audit',
        description: 'Comprehensive audit of client data across all systems to understand integration scope.',
        rationale: 'Before building, need to understand the data landscape.',
        expectedValue: 'Clear scope and phasing for CRM program.',
        suggestedPhase: 'later',
        effort: 'm',
        category: 'analytics',
      },
    ],
  },
  {
    id: 'meeting-productivity',
    name: 'Meeting Assistant',
    summary: 'Boost meeting effectiveness with notes/structure — confirm Gemini vs Claude before scaling.',
    rationale: 'Standalone enablement slice; stack choice is the open question.',
    suggestedHorizon: 'next',
    primaryDelivery: ['adsomnia', 'blablabuild'],
    caseIds: ['jtzx6rw7'],
    plan: {
      problemStatement: 'Meeting notes are inconsistent. Action items get lost. No structure for effective meetings.',
      opportunity: 'AI-assisted meeting productivity with notes, action tracking, and structure.',
      solutions:
        'AI meeting assistant that captures notes, extracts action items, and supports follow-up so teams leave meetings with a clear, tracked plan.',
      expectedImpact: '50% better meeting follow-through, consistent documentation.',
      targetAudience: ['All Employees'],
      businessValue: 'Better meetings = better execution. Action tracking = accountability.',
      technicalApproach: 'Evaluate Gemini vs Claude for meeting assistance. Integration with calendar/notes tools.',
      risks: ['Tool choice (Gemini vs Claude) not confirmed', 'Adoption depends on ease of use'],
      dependencies: ['Tool decision', 'Calendar/notes integration'],
    },
    initialRecommendations: [
      {
        title: 'Meeting Effectiveness Metrics',
        description: 'Track meeting outcomes, action completion rates, and time spent to identify improvement opportunities.',
        rationale: "Can't improve what you don't measure.",
        expectedValue: 'Identify meeting patterns that work/don\'t work. Reduce meeting time 20%.',
        suggestedPhase: 'next',
        effort: 's',
        category: 'analytics',
      },
    ],
  },
];

/**
 * Map from original cluster IDs to new cluster IDs for migration.
 */
export const CLUSTER_MIGRATION_MAP: Record<string, string[]> = {
  'affiliate-partner-ops': ['partner-activation', 'partner-intelligence'],
  'media-buy-performance': ['mb-campaign-launch', 'mb-performance-ops'],
};

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
