export const WORKSHOP_COLUMNS = [
  {
    id: "goal",
    title: "Doel",
    hint: "Samenwerkingsdoel, scope, out-of-scope",
  },
  {
    id: "incoming",
    title: "Inkomend",
    hint: "Bronnen, triggers, data die binnenkomt",
  },
  {
    id: "process",
    title: "Verwerking & analyse",
    hint: "Stappen, rollen, systemen, pijnpunten",
  },
  {
    id: "report",
    title: "Rapport",
    hint: "Wat het gestandaardiseerde rapport moet bevatten",
  },
  {
    id: "solutions",
    title: "Oplossingsrichtingen",
    hint: "Ideeën en AI-/automatiseringskansen",
  },
  {
    id: "tech",
    title: "Tech-contouren",
    hint: "Eerste bouwblokken en technische keuzes",
  },
  {
    id: "later",
    title: "Later",
    hint: "Vervolgstappen in het bedrijfsverkoopproces",
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

export type WorkshopMeta = {
  title: string;
  company: string;
  goal: string;
  createdAt: string;
  updatedAt: string;
  passwordProtected: boolean;
  passwordHash?: string;
};

export type WorkshopSession = {
  meta: WorkshopMeta;
  cards: WorkshopCard[];
  /** tldraw document snapshot (JSON-serializable) */
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

export function createEmptyMeta(partial?: Partial<WorkshopMeta>): WorkshopMeta {
  const now = new Date().toISOString();
  return {
    title: partial?.title ?? "Process workshop",
    company: partial?.company ?? "",
    goal:
      partial?.goal ??
      "Van binnenkomende informatie → verwerking & analyse → eerste gestandaardiseerde rapport",
    createdAt: partial?.createdAt ?? now,
    updatedAt: partial?.updatedAt ?? now,
    passwordProtected: Boolean(partial?.passwordProtected),
    passwordHash: partial?.passwordHash,
  };
}

export function publicMeta(meta: WorkshopMeta): Omit<WorkshopMeta, "passwordHash"> {
  const { passwordHash, ...rest } = meta;
  void passwordHash;
  return rest;
}
