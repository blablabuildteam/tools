/**
 * Workshop submissions → feature solution copy.
 * Titles and descriptions describe what we build, not the pain the client typed.
 */

export interface FeatureTransform {
  title: string;
  description: string;
}

export const FEATURE_TRANSFORMS: Record<string, FeatureTransform> = {
  // ── Email Delivery & Content Engine ──────────────────────────────────────
  '6wwxlvke': {
    title: 'Compliant message variant generator',
    description:
      'Claude generates varied, brand-safe flirting-message variants with compliance guardrails so Email Marketing can scale outreach without grey-area copy or one-person style lock-in.',
  },
  zbvbw4s5: {
    title: 'Template-driven Ongage message builder',
    description:
      'Auto-create Ongage email messages from the existing template library by filling GEO × placement variables — one brief produces the full message set instead of manual cloning.',
  },
  '0zzpakqt': {
    title: 'Figma-to-HTML email builder',
    description:
      'Convert Figma email designs into production-ready static (then dynamic) HTML templates automatically, cutting hand-coding time for Email Marketing.',
  },
  hss1gydb: {
    title: 'Delivery issue Slack alerts',
    description:
      'Monitor email server delivery daily and post Slack alerts only when servers cross bounce, complaint, or blacklist thresholds — signal without noise.',
  },
  yax6ipd9: {
    title: 'Daily send-quota optimizer',
    description:
      'Scheduled job that recalculates and applies optimal daily send quotas so volume throttles smoothly without the current semi-manual R prompt.',
  },
  q8t5rvsh: {
    title: 'Server distribution bulk updater',
    description:
      'Change Ongage server distributions across hundreds of trigger events in one action instead of editing each event by hand.',
  },

  // ── Partner Activation Hub ───────────────────────────────────────────────
  s01zg1dt: {
    title: 'Personalized partner activation pack',
    description:
      'Generate tailored activation outreach per affiliate — top offers, angles, and CTAs — so every partner gets consistent, high-quality activation messaging.',
  },
  nq108m56: {
    title: 'Underperforming campaign pause notices',
    description:
      'Draft and send payout/optimization messages when campaigns should pause, so partner managers can clear the twice-weekly pause cycle in minutes.',
  },
  aiqyvin4: {
    title: 'Weekly partner offer digest',
    description:
      'Pull best weekly offers from DB/Looker and email a personalized digest plus reminders to every partner — no manual export-and-send loop.',
  },
  '24lddyfa': {
    title: 'New-offer follow-up reminders',
    description:
      'Track newly uploaded offers sent to media buyers and nudge owners until the offer is tested, so nothing sits forgotten in the queue.',
  },
  nuftl8dc: {
    title: 'PO request automation',
    description:
      'Generate and route payout (PO) setting requests for new affiliate × offer combinations, including multi-source custom POs and bump requests.',
  },
  '0pk6tzpv': {
    title: 'HarlemNext weekly sync digest',
    description:
      'Aggregate HarlemNext priorities (geos, winning offers, focus areas) into a structured weekly digest for partner managers and media buying.',
  },

  // ── Partner Intelligence Hub ─────────────────────────────────────────────
  '7oexv73t': {
    title: 'Morning performance brief',
    description:
      'Turn yesterday’s export into an AI morning brief that flags volume/revenue drops by account and offer with clear act-on-next actions.',
  },
  qa6wbwif: {
    title: 'Telegram chat notetaker',
    description:
      'Capture notes, sentiment, opportunities, and challenges from affiliate Telegram chats into a searchable knowledge layer.',
  },
  '07g9fjmq': {
    title: 'Partner knowledge CRM',
    description:
      'Build a living partner profile from chats and notes — team setup, mediabuy approach, flows, preferences — so AMs share one source of truth.',
  },
  c2tybb1k: {
    title: 'LP performance Telegram alerts',
    description:
      'Telegram bot that flags underperforming partner landing pages (CR/EPC) via scoped Everflow access before partners waste weeks on dead LPs.',
  },
  '3z1pgtaa': {
    title: 'Payment-cycle status updater',
    description:
      'Proactively confirm payment status and POPs for each cycle so affiliates stop chasing “was period X paid?” every Wednesday.',
  },
  '6xgc2yoh': {
    title: 'Affiliate lead generator',
    description:
      'Research dossiers for potential partners scraped from conferences, LinkedIn, and Telegram — ranked overview ready for outreach.',
  },

  // ── Campaign Launch Engine ───────────────────────────────────────────────
  px4a19ax: {
    title: 'Cross-tracker campaign optimizer',
    description:
      'Unify optimization actions and heads-ups across trackers/metrics (building on Voluum MCP) so buyers spend less time hopping tools.',
  },
  pfnizv8a: {
    title: 'Ad network auto-optimization',
    description:
      'Automate optimization on supported ad networks to cut manual bid/placement work and improve source performance.',
  },
  bcutgw41: {
    title: 'Creative strategy brief pack',
    description:
      'Systematize strategy → angles → hooks → testing plans into reusable brief packs so creative production starts from a clear playbook.',
  },
  cy7gzjyt: {
    title: 'Claude-assisted campaign launch',
    description:
      'Launch campaigns via prompt on core networks (Exoclick, Traffic Junkie, Outbrain/Taboola, MGI, …) with MCP connectors for the repetitive setup.',
  },
  jj12rux9: {
    title: 'Offer auto-upload to trackers',
    description:
      'Push offers into trackers automatically so launch prep does not stall on manual upload chores.',
  },

  // ── Performance Monitoring Hub ───────────────────────────────────────────
  ytfkqqwj: {
    title: 'MB performance reporting automation',
    description:
      'Combine ScaleWizard/exports with Claude to produce faster performance insights and analysis packs for media buying.',
  },
  '1y16z6b7': {
    title: 'Performance drop alarming',
    description:
      'Threshold- and anomaly-based alerts when campaigns lose performance from tech issues or sudden metric drops.',
  },
  ldfa53nk: {
    title: 'Financial MB reporting automation',
    description:
      'Automate financial media-buying reporting so Finance/MB stop rebuilding the same manual packs each cycle.',
  },
  mg6vhvhm: {
    title: 'Daily stats autofill',
    description:
      'Auto-fill the per–media-buyer P&L/stats doc from tracker exports every day instead of one buyer doing it by hand.',
  },
  id1vevde: {
    title: 'YieldPro cascade optimizer',
    description:
      'Recommend weekly YieldPro cascade placements from paid CR%, AR%, and ePAR so offer routing decisions are data-backed.',
  },
  '2e5qnofn': {
    title: 'Tech & performance alert system',
    description:
      'Unified alert layer for tech failures and sudden performance drop-offs with clear ownership routing.',
  },

  // ── Tracker Operations Center ────────────────────────────────────────────
  zvnakelf: {
    title: 'Flow optimization playbook',
    description:
      'Decision playbook for weekly Voluum flow optimization by geo × zone — encode operator judgment where built-in AI disagrees.',
  },
  '52k9ejik': {
    title: 'CPM drop daily alert report',
    description:
      'Daily report of significant CPM drops per geo/zone/buyer so Ad Ops reacts before margin erodes.',
  },
  fr8ri4kx: {
    title: 'TSD traffic-share optimizer',
    description:
      'Compare buyer CPMs per geo/zone and recommend traffic-share splits so TSD allocation stays competitive.',
  },
  '0xnq9umd': {
    title: 'Everflow → Voluum offer uploader',
    description:
      'Bulk-upload offers and landing pages from Everflow to Voluum for multiple affiliate IDs without the spreadsheet grind.',
  },
  '6nwxxw5m': {
    title: 'ExAds banner upload & cut',
    description:
      'Automate monthly ExAds banner uploads and auto-cut underperforming creatives per campaign.',
  },
  '1gbuvwx4': {
    title: 'Monthly CPM log autofill',
    description:
      'On the 1st of each month, write previous-month CPMs per geo/zone/buyer into the ops document automatically.',
  },

  // ── Pricing Intelligence Hub ─────────────────────────────────────────────
  bidqcl01: {
    title: 'Data-quality investigation assist',
    description:
      'Claude-assisted triage for odd patterns and Looker mismatches — draft investigation paths before full live DB/Looker work.',
  },
  pnsh385v: {
    title: 'Text-to-SQL draft assistant',
    description:
      'Turn partner/MB data questions into draft SQL from schema docs so BI spends less time on one-off pulls.',
  },
  '5wq983os': {
    title: 'DB / Looker data-quality triage',
    description:
      'Structured workflow to investigate suspicious values and dashboard drift across DB and Looker with repeatable checks.',
  },
  l32k9os0: {
    title: 'Default payout request automation',
    description:
      'Auto-handle standard default payouts for new affiliate × offer pairs, with a clear path for special-case overrides.',
  },
  ge20ac29: {
    title: 'Payout increase/decrease analyzer',
    description:
      'Analyze margin and scale impact for payout change requests so increases/decreases are approved with evidence.',
  },
  yr4x9ymq: {
    title: 'Volume response price modeller',
    description:
      'Predict volume lift from source/affiliate price increases so pricing moves are model-backed, not gut estimates.',
  },
  d49ghn33: {
    title: 'Pricing simulation sandbox',
    description:
      'Sandbox to simulate pricing scenarios on owned inputs before changing live partner payouts.',
  },

  // ── Finance Decision Briefs ──────────────────────────────────────────────
  i6n2lr3x: {
    title: 'Partner KYC dossier builder',
    description:
      'Assemble structured KYC / onboarding dossiers from statutory and public sources into a digital filing cabinet for Finance.',
  },
  trvcvu9j: {
    title: 'Geo × cost-of-sales scenario modeller',
    description:
      'Run granular Finance scenarios by geo and cost-of-sales spend on owned exports — beyond simple cashflow what-ifs.',
  },
  gbs3hxtt: {
    title: 'Cashflow forecast brief',
    description:
      'Produce forward-looking cashflow views that incorporate Cost of Sales levers so Finance can plan at a usable grain.',
  },
  mu3ctc3n: {
    title: 'P&L budget-vs-actual anomaly brief',
    description:
      'Scan exports each period, flag budget deviations, and draft variance reasoning so Finance skips the manual hunt.',
  },

  // ── HR Assistant Hub ─────────────────────────────────────────────────────
  yluy9f0i: {
    title: 'CV & cover letter screening agent',
    description:
      'Score and compare applicants from CVs/cover letters against role criteria (with LinkedIn/TeamTailor context) to shortlist faster.',
  },
  '0x7wpyj2': {
    title: 'Weekly HR goals tracker',
    description:
      'Capture weekly HR goals and project updates into a living priority board so urgent work stays visible without manual rewrites.',
  },
  wt3mt2xj: {
    title: 'HR handbook Q&A agent',
    description:
      'Answer policy and framework questions from local handbook docs so employees self-serve and HR stops repeating the same answers.',
  },
  hus4qepz: {
    title: 'Employee handbook Q&A (merged)',
    description:
      'Consolidate duplicate handbook Q&A intents into the single HR handbook agent — one retrieval surface for policy questions.',
  },
  urvwa7mq: {
    title: 'HR handbook agent (merged)',
    description:
      'Fold into the primary handbook Q&A build; keep one Claude-first HR knowledge agent instead of parallel duplicates.',
  },
  xh4zjeeb: {
    title: 'Personalized onboarding plans',
    description:
      'Generate onboarding plans tuned to role, learning style, and pace so new hires are not stuck on a one-size-fits-all path.',
  },
  f7x2rz3z: {
    title: 'HR celebration workflow automation',
    description:
      'Trigger workflows for birthdays, anniversaries, and events (e.g. Slack/Personio) so celebrations and reminders run without manual chasing.',
  },

  // ── API Growth Hub ───────────────────────────────────────────────────────
  '3ylknke6': {
    title: 'API funnel performance monitor',
    description:
      'Unify Everflow / FlirtMachine / Track Insight signals into one funnel monitor with alerts for latency, routing breaks, and submit-rate drops.',
  },
  '80h0qak5': {
    title: 'API growth insights dashboard',
    description:
      'Decision-ready insights pack for the API Growth project — what is working, what to launch next, and where funnel leaks are.',
  },
  '3mtuqw72': {
    title: 'API partner onboarding bot',
    description:
      'Collect standardised partner intake (KYC, flows, FAQ, volume, rates, companies) via a bot to cut onboarding back-and-forth.',
  },
  uexqvvwe: {
    title: 'Traffic start/scale radar',
    description:
      'Track agreed geo/source/offer launches and scales and flag when promised starts have not happened yet.',
  },
  '89rj00th': {
    title: 'Everflow offer add automation',
    description:
      'Semi-automate Everflow offer creation with validation guards so speed goes up without silent error risk.',
  },

  // ── Client CRM Platform ──────────────────────────────────────────────────
  '9qpxrbua': {
    title: 'Unified client CRM program',
    description:
      'Phased program for one client database spanning knowledge base, meeting notes, Everflow, and CRM — retrieve updates and generate briefs from a single source.',
  },

  // ── Idea Intake Desk ─────────────────────────────────────────────────────
  '3qylko3t': {
    title: 'Idea intake triage assist',
    description:
      'Triage the idea box: flag unclear or duplicate entries and draft push-backs so expectations stay clear with submitters.',
  },
  vv8diyde: {
    title: 'Idea validation workflow',
    description:
      'Lightweight validation path from idea box to backlog so promising ideas get scored before they drown in other priorities.',
  },

  // ── Meeting Assistant ────────────────────────────────────────────────────
  jtzx6rw7: {
    title: 'Meeting notes & action tracker',
    description:
      'Capture meeting notes consistently, extract action items, and drive follow-up so decisions and owners do not get lost after the call.',
  },
};

export function getFeatureTransform(caseId: string): FeatureTransform | undefined {
  return FEATURE_TRANSFORMS[caseId];
}
