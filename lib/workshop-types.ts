export const CARD_COLORS = [
  "#CEFF00",
  "#7DD3FC",
  "#F9A8D4",
  "#FCD34D",
  "#A78BFA",
  "#86EFAC",
  "#FDBA74",
] as const;

export type WorkshopColumn = {
  id: string;
  title: string;
  hint: string;
  color: string;
  order: number;
};

export const WORKSHOP_COLUMNS: readonly Omit<WorkshopColumn, "order">[] = [
  {
    id: "notes",
    title: "Pijn & notities",
    hint: "Correcties op de schets, frictie, wie doet wat",
    color: CARD_COLORS[0],
  },
  {
    id: "directions",
    title: "Kans #1",
    hint: "Gekozen AI-kans + waarom die eerst",
    color: CARD_COLORS[1],
  },
  {
    id: "tech",
    title: "Tech-contour",
    hint: "Bronnen, templates, review, output-formaat",
    color: CARD_COLORS[2],
  },
];

export type WorkshopColumnId = string;

export function createDefaultColumns(): WorkshopColumn[] {
  return WORKSHOP_COLUMNS.map((col, i) => ({ ...col, order: i }));
}

export function normalizeColumns(raw: unknown): WorkshopColumn[] {
  if (raw === undefined || raw === null || !Array.isArray(raw)) {
    return createDefaultColumns();
  }
  return raw
    .map((item, i) => {
      if (!item || typeof item !== "object") return null;
      const col = item as Partial<WorkshopColumn>;
      const id = typeof col.id === "string" ? col.id.trim() : "";
      if (!id) return null;
      return {
        id,
        title: typeof col.title === "string" ? col.title : "",
        hint: typeof col.hint === "string" ? col.hint : "",
        color:
          typeof col.color === "string" && col.color
            ? col.color
            : CARD_COLORS[i % CARD_COLORS.length],
        order: typeof col.order === "number" && Number.isFinite(col.order) ? col.order : i,
      };
    })
    .filter((c): c is WorkshopColumn => Boolean(c))
    .sort((a, b) => a.order - b.order)
    .map((c, i) => ({ ...c, order: i }));
}

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
  photo?: string;
  joinedAt: string;
};

export const ATTENDEE_PHOTO_BY_ID: Record<string, string> = {
  a1: "/workshop/attendees/kevin-roos.png",
  a2: "/workshop/attendees/xennith-oosterveer.webp",
  a3: "/workshop/attendees/andre-scheirlinck.jpg",
  a4: "/workshop/attendees/dave-nijhuis.jpg",
  a5: "/workshop/attendees/joost-van-den-bos.jpg",
};

export function attendeePhotoUrl(attendee: {
  id: string;
  photo?: string;
}): string | undefined {
  return attendee.photo || ATTENDEE_PHOTO_BY_ID[attendee.id];
}

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

export type WorkshopTab = "intro" | "sketch" | "board" | "reference" | "wrap";

export const ALL_WORKSHOP_TABS: WorkshopTab[] = [
  "intro",
  "sketch",
  "board",
  "reference",
  "wrap",
];

export type WorkshopSketchHelp = {
  title: string;
  body: string[];
  expect?: string[];
};

export type WorkshopMeta = {
  title: string;
  company: string;
  goal: string;
  /** Optional client wordmark, e.g. `/workshop/diocon/logo.png` */
  logo?: string;
  /** Optional schedule line on intro, e.g. `Workshop · processen in kaart` */
  schedule?: string;
  /** Visible tabs; omit for full workshop. e.g. `["sketch"]` for process-fill sessions */
  tabs?: WorkshopTab[];
  /** Chrome label on Schets, default “Voorbereidingsfase” */
  sketchLabel?: string;
  /** Left infobox on Schets */
  sketchHelp?: WorkshopSketchHelp;
  /** Hide friction/pain toggle on steps (process-capture sessions) */
  hidePainPoints?: boolean;
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
  columns?: WorkshopColumn[];
  sketch: unknown | null;
  /** Monotonic write counter for cheap poll short-circuit. */
  rev?: number;
};

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
    logo: partial?.logo,
    schedule: partial?.schedule,
    tabs: partial?.tabs,
    sketchLabel: partial?.sketchLabel,
    sketchHelp: partial?.sketchHelp,
    hidePainPoints: partial?.hidePainPoints,
    createdAt: partial?.createdAt ?? now,
    updatedAt: partial?.updatedAt ?? now,
    passwordProtected: Boolean(partial?.passwordProtected),
    passwordHash: partial?.passwordHash,
    intro: partial?.intro,
    summary: partial?.summary ?? createEmptySummary(),
  };
}

export function normalizeWorkshopTabs(raw: unknown): WorkshopTab[] {
  const allowed = new Set<WorkshopTab>(ALL_WORKSHOP_TABS);
  if (!Array.isArray(raw) || raw.length === 0) return [...ALL_WORKSHOP_TABS];
  const next = raw
    .map((t) => String(t) as WorkshopTab)
    .filter((t) => allowed.has(t));
  return next.length ? Array.from(new Set(next)) : [...ALL_WORKSHOP_TABS];
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
  /** Output format, e.g. Excel, PDF. */
  formats: string[];
  /** Marked as a friction / pain point in the process. */
  painPoint: boolean;
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

export type DurationUnit = "hours" | "minutes";

export type PrepPhaseSketch = {
  type: "prep-phase-v1";
  steps: PrepStep[];
  connections: PrepConnection[];
  aiIdeas: PrepAiIdea[];
  milestones: PrepMilestone[];
  stickies: PrepSticky[];
  showAiKansen?: boolean;
  revealedAiMilestoneIds?: string[];
  /** How `PrepStep.duration` is interpreted. Default hours. */
  durationUnit?: DurationUnit;
};

export const SKETCH_PATCH_KEYS = [
  "steps",
  "connections",
  "aiIdeas",
  "milestones",
  "stickies",
  "showAiKansen",
  "revealedAiMilestoneIds",
  "durationUnit",
] as const;

export type SketchPatchKey = (typeof SKETCH_PATCH_KEYS)[number];

export function isSketchPatchKey(value: unknown): value is SketchPatchKey {
  return typeof value === "string" && (SKETCH_PATCH_KEYS as readonly string[]).includes(value);
}

export function sketchKeysPresent(raw: unknown): SketchPatchKey[] {
  if (!raw || typeof raw !== "object") return [];
  const obj = raw as Record<string, unknown>;
  return SKETCH_PATCH_KEYS.filter((key) => Object.prototype.hasOwnProperty.call(obj, key));
}

export function sketchFingerprint(doc: PrepPhaseSketch): string {
  return JSON.stringify({
    steps: doc.steps,
    connections: doc.connections,
    aiIdeas: doc.aiIdeas,
    milestones: doc.milestones,
    stickies: doc.stickies,
    showAiKansen: doc.showAiKansen === true,
    revealedAiMilestoneIds: doc.revealedAiMilestoneIds ?? [],
    durationUnit: doc.durationUnit === "minutes" ? "minutes" : "hours",
  });
}

export function applySketchPatch(
  stored: unknown,
  incoming: unknown,
  touched: SketchPatchKey[]
): PrepPhaseSketch {
  const current = normalizePrepPhase(stored) ?? createEmptyPrepPhase();
  const patch =
    incoming && typeof incoming === "object" ? (incoming as Partial<PrepPhaseSketch>) : {};
  const next: PrepPhaseSketch = { ...current };
  for (const key of touched) {
    if (key === "showAiKansen") {
      next.showAiKansen = patch.showAiKansen === true;
    } else if (key === "revealedAiMilestoneIds") {
      next.revealedAiMilestoneIds = Array.isArray(patch.revealedAiMilestoneIds)
        ? patch.revealedAiMilestoneIds.map(String).filter(Boolean)
        : [];
    } else if (key === "durationUnit") {
      next.durationUnit = patch.durationUnit === "minutes" ? "minutes" : "hours";
    } else if (key === "steps" && Array.isArray(patch.steps)) {
      next.steps = patch.steps.map(normalizePrepStep);
    } else if (key === "connections" && Array.isArray(patch.connections)) {
      next.connections = patch.connections;
    } else if (key === "aiIdeas" && Array.isArray(patch.aiIdeas)) {
      next.aiIdeas = patch.aiIdeas;
    } else if (key === "milestones" && Array.isArray(patch.milestones)) {
      next.milestones = patch.milestones.map((m, i) => ({
        id: String(m.id),
        short: m.short || "Milestone",
        title: m.title || "",
        order: typeof m.order === "number" ? m.order : i,
      }));
    } else if (key === "stickies" && Array.isArray(patch.stickies)) {
      next.stickies = patch.stickies
        .map(normalizeSticky)
        .filter((s): s is PrepSticky => Boolean(s));
    }
  }
  return next;
}

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
    formats: asChipList((step as PrepStep & { formats?: unknown }).formats),
    painPoint: step.painPoint === true,
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
    showAiKansen: false,
    revealedAiMilestoneIds: [],
    durationUnit: "hours",
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
    showAiKansen?: unknown;
    revealedAiMilestoneIds?: unknown;
    durationUnit?: unknown;
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
    showAiKansen: doc.showAiKansen === true,
    revealedAiMilestoneIds: Array.isArray(doc.revealedAiMilestoneIds)
      ? doc.revealedAiMilestoneIds.map(String).filter(Boolean)
      : [],
    durationUnit: doc.durationUnit === "minutes" ? "minutes" : "hours",
  };
}
