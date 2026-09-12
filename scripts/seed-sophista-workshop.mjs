/**
 * Seed / refresh Sophista workshop session without wiping the flowchart.
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

function card(partial, order) {
  const now = new Date().toISOString();
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

const now = new Date().toISOString();

const cards = [
  card(
    {
      id: "n1",
      columnId: "notes",
      title: "Wat anders loopt",
      body: "Correcties op de flowchart: stappen, rollen, systemen, echte pijn.",
      color: "#A78BFA",
    },
    0
  ),
  card(
    {
      id: "d1",
      columnId: "directions",
      title: "Prioriteit #1",
      body: "Na validatie: welke richting eerst? (zie tab Richtingen voor UC’s)",
      color: "#FCD34D",
    },
    0
  ),
  card(
    {
      id: "t1",
      columnId: "tech",
      title: "Tech-contour",
      body: "Bronnen · templates · review-stap · output-formaat · uitbreidbaarheid",
      color: "#CEFF00",
    },
    0
  ),
];

const intro = {
  todayGoal:
    "Het begin van Sophista’s bedrijfsverkoopproces scherp krijgen — specifiek: informatie verzamelen automatiseren/versnellen om daarna een gestandaardiseerd rapport uit te draaien — en daaruit tot oplossingsrichtingen + een eerste tech-contour komen.",
  discover: [
    "Hoe loopt ‘informatie verzamelen → rapport’ nu precies (stappen, rollen, systemen)?",
    "Waar zit de meeste tijd / frictie / kwaliteitsverlies?",
    "Wat is een realistische eerste gestandaardiseerde output?",
    "Welke AI-richting eerst — zodat we snel in oplossingsmodus kunnen?",
    "Waar moeten we technisch rekening mee houden voor latere uitbreidingen in het verkoopproces?",
  ],
  agenda: [
    "15:00–15:15 · Intro & check-in (doel, scope, succes vandaag)",
    "15:15–16:15 · Schets: aanname-proces valideren / bijtekenen (hoofdactiviteit)",
    "16:15–16:30 · Korte pauze",
    "16:30–17:15 · Pijn & eerste output scherp zetten → richtingen prioriteren",
    "17:15–17:45 · Tech-contour voor #1 (bouwblokken, constraints, uitbreidbaarheid)",
    "17:45–18:00 · Afronding: samenvatting + next steps",
  ],
  nextSteps: [
    "Succes vandaag: gevalideerd proces + prioriteit #1 + eerste tech-contour",
    "Open vragen / benodigde input van Sophista vastleggen",
    "Vervolg (later): concreet bouw-/vervolgvoorstel (onderdeel B)",
  ],
  attendees: [
    {
      id: "a1",
      name: "Kevin Roos van Raadshooven",
      org: "BlaBlaBuild",
      joinedAt: now,
    },
    { id: "a2", name: "Xennith Oosterveer", org: "BlaBlaBuild", joinedAt: now },
    { id: "a3", name: "André Scheirlinck", org: "Sophista", joinedAt: now },
    { id: "a4", name: "Dave Nijhuis", org: "Sophista", joinedAt: now },
    {
      id: "a5",
      name: "IT manager",
      org: "Sophista",
      role: "IT (naam nog invullen)",
      joinedAt: now,
    },
  ],
};

const summary = {
  validatedProcess: "",
  priorityOne: "",
  techContour: "",
  openQuestions: "",
  nextStepsOut: "",
};

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

const session = {
  meta: {
    title: "Sophista × blablabuild",
    company: "Sophista",
    goal: "Informatie-verzameling versnellen → gestandaardiseerd rapport (begin bedrijfsverkoopproces)",
    createdAt: existing?.meta?.createdAt || now,
    updatedAt: now,
    passwordProtected: false,
    intro,
    summary: existing?.meta?.summary?.validatedProcess
      ? existing.meta.summary
      : summary,
  },
  cards,
  // Keep live flowchart if present
  sketch: existing?.sketch ?? null,
};

if (!session.sketch) {
  console.warn("No existing sketch found — Schets tab will be empty until redrawn.");
}

await redis("SET", KEY, JSON.stringify(session));
await redis("EXPIRE", KEY, String(TTL));

console.log("Updated Sophista session");
console.log("Cards:", cards.length, "| sketch:", session.sketch ? "kept" : "missing");
console.log("URL: https://tools.blablabuild.com/tools/workshop?s=sophista-workshop");
