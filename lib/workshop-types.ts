export const WORKSHOP_COLUMNS = [
  {
    id: "goal",
    title: "1. Doel",
    hint: "Waarom zitten we hier? Scope bevestigen.",
  },
  {
    id: "incoming",
    title: "2. Inkomend",
    hint: "Wat komt er binnen bij een deal?",
  },
  {
    id: "process",
    title: "3. Proces nu",
    hint: "Wat gebeurt er daarna handmatig?",
  },
  {
    id: "report",
    title: "4. Eerste output",
    hint: "Wat moet het eerste standaard-rapport zijn?",
  },
  {
    id: "solutions",
    title: "5. Richtingen",
    hint: "Welke AI-opties? Stem & prioriteer.",
  },
  {
    id: "tech",
    title: "6. Tech",
    hint: "Eerste bouwblokken voor de gekozen richting.",
  },
  {
    id: "later",
    title: "7. Later",
    hint: "Vervolg in het verkoopproces — niet vandaag.",
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
      "Van binnenkomende informatie → verwerking & analyse → eerste gestandaardiseerde rapport",
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
