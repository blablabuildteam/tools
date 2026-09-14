/**
 * Reset Sophista schets to the Voorbereidingsfase milestone board.
 * Source docs: docs/sophista/ (company deck, AI-toepassingen, IM-prompt).
 * Run: node scripts/seed-sophista-workshop.mjs
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");
for (const line of readFileSync(envPath, "utf8").split("\n")) {
  if (!line || line.startsWith("#")) continue;
  const i = line.indexOf("=");
  if (i < 0) continue;
  const k = line.slice(0, i).trim();
  let v = line.slice(i + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  if (!process.env[k]) process.env[k] = v;
}

const SESSION_ID = "sophista-workshop";
const KEY = `workshop:${SESSION_ID}`;
const TTL = 60 * 60 * 24 * 90;
const now = new Date().toISOString();

function card(partial, order) {
  return {
    id: partial.id,
    columnId: partial.columnId,
    title: partial.title,
    body: partial.body,
    author: "facilitator",
    votes: [],
    color: partial.color || "#CEFF00",
    order,
    createdAt: now,
    updatedAt: now,
  };
}

async function redis(...args) {
  const res = await fetch(process.env.KV_REST_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.result;
}

const existingRaw = await redis("GET", KEY);
let existing = null;
if (typeof existingRaw === "string") {
  try {
    existing = JSON.parse(existingRaw);
  } catch {
    existing = null;
  }
}

// Never clobber the live Vercel flowchart unless explicitly requested.
const resetSketch = process.argv.includes("--reset-sketch");
const keepSketch = !resetSketch && Boolean(existing?.sketch);

const attendees = [
  {
    id: "a1",
    name: "Kevin Roos van Raadshooven",
    org: "BlaBlaBuild",
    photo: "/workshop/attendees/kevin-roos.png",
    joinedAt: now,
  },
  {
    id: "a2",
    name: "Xennith Oosterveer",
    org: "BlaBlaBuild",
    photo: "/workshop/attendees/xennith-oosterveer.webp",
    joinedAt: now,
  },
  {
    id: "a3",
    name: "André Scheirlinck",
    org: "Sophista",
    photo: "/workshop/attendees/andre-scheirlinck.jpg",
    joinedAt: now,
  },
  {
    id: "a4",
    name: "Dave Nijhuis",
    org: "Sophista",
    photo: "/workshop/attendees/dave-nijhuis.jpg",
    joinedAt: now,
  },
  {
    id: "a5",
    name: "Joost van den Bos",
    org: "Sophista",
    role: "IT manager",
    photo: "/workshop/attendees/joost-van-den-bos.jpg",
    joinedAt: now,
  },
];

const defaultIntro = {
  todayGoal:
    "Het begin van Sophista’s bedrijfsverkoopproces scherp krijgen — informatie verzamelen versnellen → gestandaardiseerd rapport — plus oplossingsrichtingen + tech-contour.",
  discover: [
    "Hoe loopt ‘informatie verzamelen → rapport’ nu precies?",
    "Waar zit de meeste tijd / frictie / kwaliteitsverlies?",
    "Wat is een realistische eerste gestandaardiseerde output?",
    "Welke AI-richting eerst?",
    "Waar moeten we technisch rekening mee houden voor latere uitbreidingen?",
  ],
  agenda: [
    "Focus op het huidige proces",
    "AI-kansen identificeren",
    "Eerste technische aanpak van een oplossing vormgeven",
    "Recap en vervolgstappen",
  ],
  nextSteps: [
    "Succes vandaag: gevalideerd proces + prioriteit #1 + tech-contour",
    "Open vragen vastleggen",
    "Vervolg: bouwvoorstel (B) later",
  ],
  attendees,
};

const session = {
  meta: {
    title: "Sophista × blablabuild",
    company: "Sophista",
    goal: "Informatie-verzameling versnellen → gestandaardiseerd rapport",
    createdAt: existing?.meta?.createdAt || now,
    updatedAt: now,
    passwordProtected: false,
    intro: existing?.meta?.intro
      ? { ...existing.meta.intro, attendees, agenda: defaultIntro.agenda }
      : defaultIntro,
    summary: existing?.meta?.summary || {
      validatedProcess: "",
      priorityOne: "",
      techContour: "",
      openQuestions: "",
      nextStepsOut: "",
    },
  },
  cards: existing?.cards?.length
    ? existing.cards
    : [
        card(
          {
            id: "n1",
            columnId: "notes",
            title: "Wat anders loopt",
            body: "Correcties op de flowchart.",
            color: "#A78BFA",
          },
          0
        ),
        card(
          {
            id: "d1",
            columnId: "directions",
            title: "Prioriteit #1",
            body: "Welke richting eerst?",
            color: "#FCD34D",
          },
          0
        ),
        card(
          {
            id: "t1",
            columnId: "tech",
            title: "Tech-contour",
            body: "Bronnen · templates · review · output",
            color: "#CEFF00",
          },
          0
        ),
      ],
  sketch: keepSketch
    ? existing.sketch
    : {
        type: "prep-phase-v1",
        steps: [],
        connections: [],
        aiIdeas: [
          {
            id: "uc1",
            milestoneId: "strategie",
            title: "Bedrijfsverkenning",
            body: "Met één druk een uitgebreide analyse van een onderneming: omschrijving, historie, producten, geografie, klanten, USP’s, ketenpositie, eigenaars, financiële kengetallen, overnamegeschiedenis.",
            sources: "Company.info · Gain.pro · LongListMaker · publieke bronnen",
            known: true,
            order: 0,
          },
          {
            id: "uc2",
            milestoneId: "strategie",
            title: "Marktanalyse",
            body: "Marktbeeld op knop: trends, regelgeving, groei & drijvers, ketenvisual, concurrenten, marktaandeel, fragmentatie vs. consolidatie.",
            sources: "Publieke + gelicentieerde marktdata",
            known: true,
            order: 1,
          },
          {
            id: "uc3",
            milestoneId: "im",
            title: "Informatiememorandum (IM)",
            body: "Map met klantgegevens + notulen woord-voor-woord analyseren, aanvullen met eigen analyse en eerdere IMs, stap-voor-stap met controle → investeerdergericht deck.",
            sources: "Klantdossier · notulen · kennisbank / eerdere IMs",
            known: true,
            order: 0,
          },
          {
            id: "uc4",
            milestoneId: "nda",
            title: "NDA personaliseren",
            body: "Standaard NDA automatisch personaliseren (aanhef) op basis van Company.info; tekeningsbevoegde moet tekenen.",
            sources: "Company.info · NDA-template",
            known: true,
            order: 0,
          },
          {
            id: "uc5",
            milestoneId: "teaser",
            title: "Teaser / anoniem profiel",
            body: "Op basis van het IM automatisch een teaser of anoniem profiel genereren.",
            sources: "IM-output",
            known: true,
            order: 0,
          },
          {
            id: "uc6",
            milestoneId: "longlist",
            title: "Longlist kopers",
            body: "Longlist met categorieën (NL/Benelux/EU/wereld), koppeling Gain.pro / Longlistmaker / Company.info + bedrijfsverkenning-agent → dashboard + Excel.",
            sources: "Gain.pro · Longlistmaker · Company.info",
            known: true,
            order: 0,
          },
        ],
        stickies: [],
      },
  rev: (existing?.rev ?? 0) + 1,
  columns: existing?.columns,
};

await redis("SET", KEY, JSON.stringify(session));
await redis("EXPIRE", KEY, String(TTL));

const names = attendees.map((a) => (a.role ? `${a.name} · ${a.role}` : a.name)).join(", ");
console.log(
  keepSketch
    ? `Kept existing schets (${existing.sketch?.type || "unknown"})`
    : "Reset schets → empty Voorbereidingsfase milestones"
);
console.log(`Attendees: ${names}`);
console.log("URL: https://tools.blablabuild.com/tools/workshop?s=sophista-workshop");
console.log("Local: http://localhost:3000/tools/workshop?s=sophista-workshop");
