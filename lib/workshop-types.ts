export const WORKSHOP_COLUMNS = [
  {
    id: "notes",
    title: "Pijn & notities",
    hint: "Correcties op de schets, frictie, wie doet wat",
  },
  {
    id: "directions",
    title: "Richting #1",
    hint: "Gekozen AI-richting + waarom die eerst",
  },
  {
    id: "tech",
    title: "Tech-contour",
    hint: "Bronnen, templates, review, output-formaat",
  },
] as const;

export type WorkshopColumnId = (typeof WORKSHOP_COLUMNS)[number]["id"];

export type WorkshopCard = {
  id: string;
  columnId: WorkshopColumnId;
  title: string;
  body: string;
  author: string;
  votes: string[];
  color: string;
  order: number;
  createdAt: string;
  updatedAt: string;
};

export type WorkshopAttendee = {
  id: string;
  name: string;
  org?: string;
  role?: string;
  joinedAt: string;
};

export type WorkshopIntro = {
  todayGoal: string;
  discover: string[];
  nextSteps: string[];
  agenda: string[];
  attendees: WorkshopAttendee[];
};

/** End-of-session capture — success criteria A */
export type WorkshopSummary = {
  validatedProcess: string;
  priorityOne: string;
  techContour: string;
  openQuestions: string;
  nextStepsOut: string;
};

export type WorkshopMeta = {
  title: string;
  company: string;
  goal: string;
  createdAt: string;
  updatedAt: string;
  passwordProtected: boolean;
  passwordHash?: string;
  intro?: WorkshopIntro;
  summary?: WorkshopSummary;
};

export type WorkshopSession = {
  meta: WorkshopMeta;
  cards: WorkshopCard[];
  sketch: unknown | null;
};

export const CARD_COLORS = [
  "#CEFF00",
  "#7DD3FC",
  "#F9A8D4",
  "#FCD34D",
  "#A78BFA",
  "#86EFAC",
  "#FDBA74",
] as const;

export const STICKY_COLORS = [
  "#FDE047",
  "#F9A8D4",
  "#7DD3FC",
  "#86EFAC",
  "#FDBA74",
] as const;

export type StickyColor = (typeof STICKY_COLORS)[number];

export type PrepSticky = {
  id: string;
  text: string;
  color: StickyColor;
  x: number;
  y: number;
};

export function isStickyColor(value: unknown): value is StickyColor {
  return STICKY_COLORS.some((c) => c === value);
}

export function normalizeSticky(raw: unknown): PrepSticky | null {
  if (!raw || typeof raw !== "object") return null;
  const item = raw as Partial<PrepSticky>;
  const id = typeof item.id === "string" ? item.id : "";
  if (!id) return null;
  return {
    id,
    text: typeof item.text === "string" ? item.text : "",
    color: isStickyColor(item.color) ? item.color : STICKY_COLORS[0],
    x: typeof item.x === "number" && Number.isFinite(item.x) ? item.x : 48,
    y: typeof item.y === "number" && Number.isFinite(item.y) ? item.y : 48,
  };
}

export function createEmptyIntro(): WorkshopIntro {
  return {
    todayGoal: "",
    discover: [],
    nextSteps: [],
    agenda: [],
    attendees: [],
  };
}

export function createEmptySummary(): WorkshopSummary {
  return {
    validatedProcess: "",
    priorityOne: "",
    techContour: "",
    openQuestions: "",
    nextStepsOut: "",
  };
}

export function createEmptyMeta(partial?: Partial<WorkshopMeta>): WorkshopMeta {
  const now = new Date().toISOString();
  return {
    title: partial?.title ?? "Process workshop",
    company: partial?.company ?? "",
    goal:
      partial?.goal ??
      "Informatie-verzameling versnellen → gestandaardiseerd rapport",
    createdAt: partial?.createdAt ?? now,
    updatedAt: partial?.updatedAt ?? now,
    passwordProtected: Boolean(partial?.passwordProtected),
    passwordHash: partial?.passwordHash,
    intro: partial?.intro,
    summary: partial?.summary ?? createEmptySummary(),
  };
}

export function publicMeta(meta: WorkshopMeta): Omit<WorkshopMeta, "passwordHash"> {
  const { passwordHash, ...rest } = meta;
  void passwordHash;
  return rest;
}

/** Static reference from docs/sophista (AI_toepassingen.pdf + Prompt_IM.pdf). Facilitation aid, not a doc dump. */
export const SOPHISTA_AI_DIRECTIONS = [
  {
    id: "uc1",
    milestoneId: "strategie",
    phase: "Voorbereiding",
    title: "Bedrijfsverkenning",
    blurb:
      "Met één druk een uitgebreide analyse van een onderneming: omschrijving, historie, producten, geografie, klanten, USP’s, ketenpositie, eigenaars, financiële kengetallen, overnamegeschiedenis.",
    sources: "Company.info · Gain.pro · LongListMaker · publieke bronnen",
    inScopeToday: true,
  },
  {
    id: "uc2",
    milestoneId: "strategie",
    phase: "Voorbereiding",
    title: "Marktanalyse",
    blurb:
      "Marktbeeld op knop: trends, regelgeving, groei & drijvers, ketenvisual, concurrenten, marktaandeel, fragmentatie vs. consolidatie.",
    sources: "Publieke + gelicentieerde marktdata",
    inScopeToday: true,
  },
  {
    id: "uc3",
    milestoneId: "im",
    phase: "Voorbereiding",
    title: "Informatiememorandum (IM)",
    blurb:
      "Map met klantgegevens + notulen woord-voor-woord analyseren, aanvullen met eigen analyse en eerdere IMs, stap-voor-stap met controle → investeerdergericht deck.",
    sources: "Klantdossier · notulen · kennisbank / eerdere IMs",
    inScopeToday: true,
  },
  {
    id: "uc4",
    milestoneId: "nda",
    phase: "Voorbereiding",
    title: "NDA personaliseren",
    blurb:
      "Standaard NDA automatisch personaliseren (aanhef) op basis van Company.info; tekeningsbevoegde moet tekenen.",
    sources: "Company.info · NDA-template",
    inScopeToday: false,
  },
  {
    id: "uc5",
    milestoneId: "teaser",
    phase: "Voorbereiding",
    title: "Teaser / anoniem profiel",
    blurb: "Op basis van het IM automatisch een teaser of anoniem profiel genereren.",
    sources: "IM-output",
    inScopeToday: false,
  },
  {
    id: "uc6",
    milestoneId: "longlist",
    phase: "Voorbereiding",
    title: "Longlist kopers",
    blurb:
      "Longlist met categorieën (NL/Benelux/EU/wereld), koppeling Gain.pro / Longlistmaker / Company.info + bedrijfsverkenning-agent → dashboard + Excel.",
    sources: "Gain.pro · Longlistmaker · Company.info",
    inScopeToday: false,
  },
] as const;

export const SOPHISTA_IM_STRUCTURE = [
  "Executive summary",
  "Investment highlights",
  "Legal structure & transaction motivation",
  "Producten en diensten",
  "Marktanalyse",
  "Klanten en omzetstructuur",
  "Businessmodel & operaties",
  "Managementteam",
  "Financiële prestaties (beperkt zonder data)",
  "Financiële projecties",
] as const;

export const SOPHISTA_LATER_PHASES = [
  { title: "Marketing", items: "Teaser → NDA → IM verstrekken → gesprekken → biedingen → LOI" },
  { title: "Due diligence", items: "VDR · Q&A · bedrijfsbezoek · bevindingen · heronderhandeling" },
  { title: "Signing & closing", items: "SPA · documentatie · notaris · persbericht" },
] as const;

/** Voorbereidingsfase milestones — Schets columns (from AI_toepassingen / company deck). */
export const PREP_MILESTONES = [
  {
    id: "strategie",
    n: 1,
    short: "Strategie & analyse",
    title: "Strategieformulering, bedrijfsverkenning en marktanalyse",
  },
  {
    id: "kpis",
    n: 2,
    short: "KPI’s & waarde",
    title: "Vaststellen KPI’s en waarde drijvers",
  },
  {
    id: "prognoses",
    n: 3,
    short: "Financiële prognoses",
    title: "Financiële prognoses",
  },
  {
    id: "waarde",
    n: 4,
    short: "Indicatieve waarde",
    title: "Opstellen indicatieve waardebepaling",
  },
  {
    id: "im",
    n: 5,
    short: "Informatiememorandum",
    title: "Opstellen informatiememorandum",
  },
  {
    id: "nda",
    n: 6,
    short: "Procesbrieven & NDA",
    title: "Procesbrieven en geheimhoudingsverklaring",
  },
  {
    id: "teaser",
    n: 7,
    short: "Teaser / anoniem profiel",
    title: "Teaser/anoniem profiel opstellen",
  },
  {
    id: "longlist",
    n: 8,
    short: "Longlist kopers",
    title: "Longlist opstellen van potentiële kopers",
  },
  {
    id: "shortlist",
    n: 9,
    short: "Shortlist",
    title: "Samenstellen shortlist",
  },
] as const;

export type PrepMilestoneId = string;

export type PrepMilestone = {
  id: PrepMilestoneId;
  short: string;
  title: string;
  order: number;
};

export function createDefaultPrepMilestones(): PrepMilestone[] {
  return PREP_MILESTONES.map((m, i) => ({
    id: m.id,
    short: m.short,
    title: m.title,
    order: i,
  }));
}

export type PrepStep = {
  id: string;
  milestoneId: PrepMilestoneId;
  title: string;
  description: string;
  duration: string;
  /** Internal people. */
  people: string[];
  /** External parties. */
  parties: string[];
  tools: string[];
  order: number;
};

export type PrepConnection = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
};

/** AI opportunity pinned onto a milestone (AI_toepassingen.pdf + extras added live). */
export type PrepAiIdea = {
  id: string;
  milestoneId: PrepMilestoneId;
  title: string;
  body: string;
  sources: string;
  known: boolean;
  order: number;
};

export type PrepPhaseSketch = {
  type: "prep-phase-v1";
  steps: PrepStep[];
  connections: PrepConnection[];
  aiIdeas: PrepAiIdea[];
  milestones: PrepMilestone[];
  stickies: PrepSticky[];
};

export function asChipList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split(/[,;/]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export function normalizePrepStep(step: PrepStep & {
  involved?: unknown;
  involvedScope?: string;
}): PrepStep {
  let people = asChipList(step.people);
  let parties = asChipList(step.parties);
  const legacy = asChipList(step.involved);
  if (!people.length && !parties.length && legacy.length) {
    if (step.involvedScope === "extern") parties = legacy;
    else people = legacy;
  }
  return {
    id: step.id,
    milestoneId: step.milestoneId,
    title: step.title ?? "",
    description: step.description ?? "",
    duration: step.duration ?? "",
    people,
    parties,
    tools: asChipList(step.tools),
    order: typeof step.order === "number" ? step.order : 0,
  };
}

export function createDefaultSophistaAiIdeas(): PrepAiIdea[] {
  const counts: Partial<Record<PrepMilestoneId, number>> = {};
  return SOPHISTA_AI_DIRECTIONS.map((uc) => {
    const milestoneId = uc.milestoneId as PrepMilestoneId;
    const order = counts[milestoneId] ?? 0;
    counts[milestoneId] = order + 1;
    return {
      id: uc.id,
      milestoneId,
      title: uc.title,
      body: uc.blurb,
      sources: uc.sources,
      known: true,
      order,
    };
  });
}

export function createEmptyPrepPhase(): PrepPhaseSketch {
  return {
    type: "prep-phase-v1",
    steps: [],
    connections: [],
    aiIdeas: [],
    milestones: createDefaultPrepMilestones(),
    stickies: [],
  };
}

export function isPrepPhaseSketch(raw: unknown): raw is PrepPhaseSketch {
  if (!raw || typeof raw !== "object") return false;
  const doc = raw as PrepPhaseSketch;
  return doc.type === "prep-phase-v1" && Array.isArray(doc.steps) && Array.isArray(doc.connections);
}

/** Older sketches omit `aiIdeas` / `milestones` / `stickies`. */
export function normalizePrepPhase(raw: unknown): PrepPhaseSketch | null {
  if (!isPrepPhaseSketch(raw)) return null;
  const doc = raw as PrepPhaseSketch & {
    aiIdeas?: PrepAiIdea[];
    milestones?: PrepMilestone[];
    stickies?: unknown;
  };
  const milestones =
    Array.isArray(doc.milestones) && doc.milestones.length > 0
      ? doc.milestones.map((m, i) => ({
          id: String(m.id),
          short: m.short || "Milestone",
          title: m.title || "",
          order: typeof m.order === "number" ? m.order : i,
        }))
      : createDefaultPrepMilestones();
  return {
    type: "prep-phase-v1",
    steps: doc.steps.map(normalizePrepStep),
    connections: doc.connections,
    aiIdeas: Array.isArray(doc.aiIdeas) ? doc.aiIdeas : createDefaultSophistaAiIdeas(),
    milestones,
    stickies: Array.isArray(doc.stickies)
      ? doc.stickies.map(normalizeSticky).filter((s): s is PrepSticky => Boolean(s))
      : [],
  };
}
