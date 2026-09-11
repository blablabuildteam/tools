import type { DeliveryPartner, PriorityStatus } from './types';

/**
 * blablabuild starting suggestions for Adsomnia workshop cases.
 * Sietse / Adsomnia still need to confirm delivery ownership.
 */
export const DELIVERY_SUGGESTIONS: Record<
  string,
  { deliveryPartners: DeliveryPartner[]; priorityStatus?: PriorityStatus; note?: string }
> = {
  // ── Clear kills / demos ───────────────────────────────────────────────────
  'example-monday-digest': {
    deliveryPartners: ['tbd'],
    priorityStatus: 'kill',
    note: 'Workshop example — not a real initiative.',
  },

  // ── Harlem Next involved ──────────────────────────────────────────────────
  '0pk6tzpv': {
    deliveryPartners: ['adsomnia', 'harlem-next', 'blablabuild'],
    note: 'Weekly sync digest — HN + Adsomnia ops, bla shapes the agent.',
  },
  pfnizv8a: {
    deliveryPartners: ['adsomnia', 'harlem-next'],
    note: 'Ad network auto-optimization — media buying + HN stack.',
  },
  px4a19ax: {
    deliveryPartners: ['adsomnia', 'harlem-next'],
    note: 'Campaign management MB — Adsomnia MB with HN tooling.',
  },
  cy7gzjyt: {
    deliveryPartners: ['adsomnia', 'harlem-next', 'blablabuild'],
    note: 'Campaign launch via Claude — enablement with HN/MB context.',
  },

  // ── Email / Ongage → often BtR + Adsomnia ─────────────────────────────────
  zbvbw4s5: {
    deliveryPartners: ['adsomnia', 'bending-the-rules'],
    note: 'Ongage message creation — Email + BtR ESP craft.',
  },
  '0zzpakqt': {
    deliveryPartners: ['adsomnia', 'bending-the-rules', 'blablabuild'],
    note: 'HTML email pages — BtR templates + Claude assist.',
  },
  '6wwxlvke': {
    deliveryPartners: ['adsomnia', 'bending-the-rules', 'blablabuild'],
    note: 'Compliant flirting variants — Claude skill, Email owns.',
  },
  hss1gydb: {
    deliveryPartners: ['adsomnia', 'bending-the-rules'],
    note: 'Delivery-issue Slack alerts — Email ops + ESP monitoring.',
  },
  yax6ipd9: {
    deliveryPartners: ['adsomnia', 'bending-the-rules'],
    note: 'Daily send quota — Ongage ops.',
  },
  q8t5rvsh: {
    deliveryPartners: ['adsomnia', 'bending-the-rules'],
    note: 'Server distribution optimization — Ongage.',
  },

  // ── Claude-ready / bla-led enablement ─────────────────────────────────────
  wt3mt2xj: {
    deliveryPartners: ['adsomnia', 'blablabuild'],
    note: 'HR handbook agent — Claude project, HR owns content.',
  },
  hus4qepz: {
    deliveryPartners: ['adsomnia', 'blablabuild'],
    priorityStatus: 'kill',
    note: 'Near-duplicate of handbook agent — merge into wt3mt2xj.',
  },
  urvwa7mq: {
    deliveryPartners: ['adsomnia', 'blablabuild'],
    priorityStatus: 'kill',
    note: 'Near-duplicate of handbook agent — merge into wt3mt2xj.',
  },
  i6n2lr3x: {
    deliveryPartners: ['adsomnia', 'blablabuild'],
    note: 'KYC dossier builder — Finance + Claude skill.',
  },
  mu3ctc3n: {
    deliveryPartners: ['adsomnia', 'blablabuild'],
    note: 'P&L analysis — Finance exports + Claude.',
  },
  bcutgw41: {
    deliveryPartners: ['adsomnia', 'blablabuild'],
    note: 'Creative strategy system — briefs in Claude; production separate.',
  },
  pnsh385v: {
    deliveryPartners: ['adsomnia', 'blablabuild'],
    note: 'Text-to-SQL investigative — BI schema docs + Claude.',
  },
  s01zg1dt: {
    deliveryPartners: ['adsomnia', 'blablabuild'],
    note: 'Personalised activation messages — Affiliate + Claude skill.',
  },
  '0x7wpyj2': {
    deliveryPartners: ['adsomnia', 'blablabuild'],
    note: 'Weekly HR checks — notes → priorities skill.',
  },
  yluy9f0i: {
    deliveryPartners: ['adsomnia', 'blablabuild'],
    note: 'Recruitment scorecards — Claude on CVs; ATS later.',
  },
  '3qylko3t': {
    deliveryPartners: ['adsomnia', 'blablabuild'],
    note: 'Idea intake triage — PM + Claude.',
  },

  // ── Platform / tracker heavy → Adsomnia (+ bla for agents) ────────────────
  '52k9ejik': {
    deliveryPartners: ['adsomnia', 'blablabuild'],
    note: 'CPM drop alerting — Ad Ops data + alert agent.',
  },
  zvnakelf: {
    deliveryPartners: ['adsomnia', 'blablabuild'],
    note: 'Flow optimization — Voluum/live stack; playbook scope first.',
  },
  fr8ri4kx: {
    deliveryPartners: ['adsomnia'],
    note: 'TSD optimization — Ad Ops core.',
  },
  '0xnq9umd': {
    deliveryPartners: ['adsomnia'],
    note: 'Upload offers to Voluum — Ad Ops.',
  },
  '6nwxxw5m': {
    deliveryPartners: ['adsomnia'],
    note: 'ExAds banners + optimization — Ad Ops.',
  },
  '1gbuvwx4': {
    deliveryPartners: ['adsomnia'],
    priorityStatus: 'kill',
    note: 'Adding CPMs in a doc — low leverage; fold into alerting/reporting.',
  },

  // ── Affiliate ─────────────────────────────────────────────────────────────
  '7oexv73t': {
    deliveryPartners: ['adsomnia', 'blablabuild'],
    note: 'Morning reports — export → brief agent.',
  },
  '89rj00th': {
    deliveryPartners: ['adsomnia'],
    note: 'Automating adding offers — Affiliate ops.',
  },
  nq108m56: {
    deliveryPartners: ['adsomnia', 'blablabuild'],
    note: 'Payout pause messaging — list → Claude drafts; EF write later.',
  },
  uexqvvwe: {
    deliveryPartners: ['adsomnia', 'blablabuild'],
    note: 'Traffic Start/Scale Radar — Affiliate + monitoring.',
  },
  '6xgc2yoh': {
    deliveryPartners: ['adsomnia', 'blablabuild'],
    note: 'Affiliate lead generator — dossiers with caveats.',
  },
  '24lddyfa': {
    deliveryPartners: ['adsomnia', 'blablabuild'],
    note: 'Following up new offers — sheet + reminders.',
  },
  '80h0qak5': {
    deliveryPartners: ['adsomnia', 'blablabuild'],
    note: 'API Growth insights — fixed data pack + brief.',
  },
  qa6wbwif: {
    deliveryPartners: ['adsomnia', 'blablabuild'],
    note: 'Telegram notetaker — chat export → notes (Entergram later).',
  },
  '3z1pgtaa': {
    deliveryPartners: ['adsomnia'],
    note: 'Payment cycle updates — Affiliate/Finance ops.',
  },
  nuftl8dc: {
    deliveryPartners: ['adsomnia', 'blablabuild'],
    note: 'Automatic PO setting request — templates in Claude; EF write blocked.',
  },
  c2tybb1k: {
    deliveryPartners: ['adsomnia', 'blablabuild'],
    note: 'TG bot LP alerts — Everflow scoped access; heavier build.',
  },
  aiqyvin4: {
    deliveryPartners: ['adsomnia', 'blablabuild'],
    note: 'Weekly partner digest — CSV → email draft.',
  },
  '07g9fjmq': {
    deliveryPartners: ['adsomnia', 'blablabuild'],
    note: 'Partner knowledge CRM — profiles from pasted chats first.',
  },

  // ── BI / Pricing ──────────────────────────────────────────────────────────
  '5wq983os': {
    deliveryPartners: ['adsomnia', 'blablabuild'],
    note: 'Data quality triage — live DB later; offline scope first.',
  },
  l32k9os0: {
    deliveryPartners: ['adsomnia'],
    note: 'Automating payout defaults — Everflow write path.',
  },
  ge20ac29: {
    deliveryPartners: ['adsomnia', 'blablabuild'],
    note: 'Payout increases/decreases — analysis + EF; outliers manual.',
  },
  d49ghn33: {
    deliveryPartners: ['adsomnia', 'blablabuild'],
    note: 'Pricing simulation sandbox — BI owns model inputs.',
  },
  yr4x9ymq: {
    deliveryPartners: ['adsomnia', 'blablabuild'],
    note: 'Price experimentation — design + analysis on exports.',
  },

  // ── Media Buying ──────────────────────────────────────────────────────────
  '1y16z6b7': {
    deliveryPartners: ['adsomnia', 'blablabuild'],
    note: 'MB performance alarming — monitoring + alerts.',
  },
  mg6vhvhm: {
    deliveryPartners: ['adsomnia', 'blablabuild'],
    note: 'Autofill daily MB stats — tracker export assist.',
  },
  ytfkqqwj: {
    deliveryPartners: ['adsomnia', 'blablabuild'],
    note: 'MB performance reporting — ScaleWizard/export briefs.',
  },
  jj12rux9: {
    deliveryPartners: ['adsomnia'],
    note: 'Offer auto upload to trackers — MB ops.',
  },
  ldfa53nk: {
    deliveryPartners: ['adsomnia', 'blablabuild'],
    note: 'Financial MB reporting — automation on exports.',
  },

  // ── Finance / HR / General / YP / API / PM ────────────────────────────────
  gbs3hxtt: {
    deliveryPartners: ['adsomnia', 'blablabuild'],
    note: 'Cashflow forecasting — Cos/pricing export → brief.',
  },
  trvcvu9j: {
    deliveryPartners: ['adsomnia', 'blablabuild'],
    note: 'Business modelling — scenario modeller on owned inputs.',
  },
  f7x2rz3z: {
    deliveryPartners: ['adsomnia'],
    note: 'HR workflow integration — Personio/Slack heavy; Adsomnia-led.',
  },
  xh4zjeeb: {
    deliveryPartners: ['adsomnia', 'blablabuild'],
    note: 'Onboarding personalization — plan from profile notes.',
  },
  '9qpxrbua': {
    deliveryPartners: ['tbd', 'adsomnia', 'blablabuild'],
    note: 'Central CRM on steroids — large multi-system; confirm scope first.',
  },
  jtzx6rw7: {
    deliveryPartners: ['adsomnia', 'blablabuild'],
    note: 'Meeting booster — notes/Gemini workflow; confirm stack.',
  },
  id1vevde: {
    deliveryPartners: ['adsomnia'],
    note: 'YP auto-optimization — YP owned.',
  },
  '2e5qnofn': {
    deliveryPartners: ['adsomnia', 'blablabuild'],
    note: 'YP alert system — tech/perf metrics.',
  },
  '3ylknke6': {
    deliveryPartners: ['adsomnia', 'blablabuild'],
    note: 'API funnel monitor — API + alerting agent.',
  },
  '3mtuqw72': {
    deliveryPartners: ['adsomnia'],
    note: 'Onboarding bot API partners — CRM/Finance/EF path.',
  },
  vv8diyde: {
    deliveryPartners: ['adsomnia', 'blablabuild'],
    note: 'Idea box → validation — PM assist.',
  },
};

export function suggestionFor(id: string): {
  deliveryPartners: DeliveryPartner[];
  priorityStatus?: PriorityStatus;
  note?: string;
} {
  return (
    DELIVERY_SUGGESTIONS[id] ?? {
      deliveryPartners: ['tbd'],
      note: 'No specific suggestion yet — confirm with Sietse.',
    }
  );
}
