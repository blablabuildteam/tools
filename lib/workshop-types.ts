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

/** Static reference from Sophista AI-toepassingen + IM-prompt (facilitation aid) */
export const SOPHISTA_AI_DIRECTIONS = [
  {
    id: "uc1",
    phase: "Voorbereiding",
    title: "Bedrijfsverkenning",
    blurb:
      "Met één druk een uitgebreide analyse van een onderneming: omschrijving, historie, producten, geografie, klanten, USP’s, ketenpositie, eigenaars, financiële kengetallen, overnamegeschiedenis.",
    sources: "Company.info · Gain.pro · LongListMaker · publieke bronnen",
    inScopeToday: true,
  },
  {
    id: "uc2",
    phase: "Voorbereiding",
    title: "Marktanalyse",
    blurb:
      "Marktbeeld op knop: trends, regelgeving, groei & drijvers, ketenvisual, concurrenten, marktaandeel, fragmentatie vs. consolidatie.",
    sources: "Publieke + gelicentieerde marktdata",
    inScopeToday: true,
  },
  {
    id: "uc3",
    phase: "Voorbereiding",
    title: "Informatiememorandum (IM)",
    blurb:
      "Map met klantgegevens + notulen woord-voor-woord analyseren, aanvullen met eigen analyse en eerdere IMs, stap-voor-stap met controle → investeerdergericht deck.",
    sources: "Klantdossier · notulen · kennisbank / eerdere IMs",
    inScopeToday: true,
  },
  {
    id: "uc4",
    phase: "Voorbereiding",
    title: "NDA personaliseren",
    blurb:
      "Standaard NDA automatisch personaliseren (aanhef) op basis van Company.info; tekeningsbevoegde moet tekenen.",
    sources: "Company.info · NDA-template",
    inScopeToday: false,
  },
  {
    id: "uc5",
    phase: "Voorbereiding",
    title: "Teaser / anoniem profiel",
    blurb: "Op basis van het IM automatisch een teaser of anoniem profiel genereren.",
    sources: "IM-output",
    inScopeToday: false,
  },
  {
    id: "uc6",
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
