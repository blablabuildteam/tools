export const WORKSHOP_COLUMNS = [
  {
    id: "goal",
    title: "Doel",
    hint: "Optioneel — scope-notities",
  },
  {
    id: "incoming",
    title: "Inkomend",
    hint: "Correcties op bronnen",
  },
  {
    id: "process",
    title: "Proces-notities",
    hint: "Wat anders loopt dan de schets",
  },
  {
    id: "report",
    title: "Eerste output",
    hint: "Wat het rapport moet zijn",
  },
  {
    id: "solutions",
    title: "Richtingen",
    hint: "AI-opties om te prioriteren",
  },
  {
    id: "tech",
    title: "Tech",
    hint: "Bouwblokken voor #1",
  },
  {
    id: "later",
    title: "Later",
    hint: "Uitbreidingen meenemen",
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

export type WorkshopMeta = {
  title: string;
  company: string;
  goal: string;
  createdAt: string;
  updatedAt: string;
  passwordProtected: boolean;
  passwordHash?: string;
  intro?: WorkshopIntro;
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
  };
}

export function publicMeta(meta: WorkshopMeta): Omit<WorkshopMeta, "passwordHash"> {
  const { passwordHash, ...rest } = meta;
  void passwordHash;
  return rest;
}
