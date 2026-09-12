/**
 * Seed Sophista workshop with stable HTML process-flow (no tldraw).
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

const sketch = {
  type: "process-flow",
  version: 1,
  title: "Sophista — aanname proces (ter validatie)",
  subtitle: "Scope: informatie verzamelen → analyse → eerste gestandaardiseerde rapport",
  nodes: [
    {
      id: "b1",
      lane: "main",
      title: "1. Intake / trigger",
      body: "Nieuwe deal of verkooptraject start",
      tone: "yellow",
    },
    {
      id: "b2",
      lane: "main",
      title: "2. Informatie verzamelen",
      body: "Klant + intern + extern\n(nu: handmatig / traag)",
      tone: "blue",
    },
    {
      id: "b3",
      lane: "main",
      title: "3. Verwerken & analyseren",
      body: "Structureren, checken, aanvullen, interpreteren",
      tone: "violet",
    },
    {
      id: "b4",
      lane: "main",
      title: "4. Eerste standaardrapport",
      body: "Gestandaardiseerde output (fase-1 doel)",
      tone: "green",
    },
    { id: "in1", lane: "inputs", title: "Klantinput", body: "Dossier / gesprekken", tone: "grey" },
    {
      id: "in2",
      lane: "inputs",
      title: "Intern",
      body: "IMs, templates, kennisbank",
      tone: "grey",
    },
    {
      id: "in3",
      lane: "inputs",
      title: "Extern",
      body: "Company.info / Gain.pro / publiek",
      tone: "grey",
    },
    {
      id: "pain",
      lane: "side",
      title: "Hypothese pijn",
      body: "Tijd & inconsistentie in verzamelen + schrijven → te valideren",
      tone: "orange",
    },
    {
      id: "ask",
      lane: "side",
      title: "Workshop-vraag",
      body: "Klopt deze flow?\nWat mist / anders?\nWaar AI eerst helpen?",
      tone: "yellow",
    },
    { id: "l1", lane: "later", title: "Marketing", body: "Teaser / shortlist / NDA", tone: "grey" },
    { id: "l2", lane: "later", title: "Due diligence", body: "VDR / Q&A", tone: "grey" },
    { id: "l3", lane: "later", title: "Signing & closing", body: "SPA / notaris", tone: "grey" },
  ],
};

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
    { id: "a1", name: "Kevin Roos van Raadshooven", org: "BlaBlaBuild", joinedAt: now },
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

const keepFlow =
  existing?.sketch?.type === "process-flow" &&
  Array.isArray(existing.sketch.nodes) &&
  existing.sketch.nodes.length > 0;

const session = {
  meta: {
    title: "Sophista × blablabuild",
    company: "Sophista",
    goal: "Informatie-verzameling versnellen → gestandaardiseerd rapport (begin bedrijfsverkoopproces)",
    createdAt: existing?.meta?.createdAt || now,
    updatedAt: now,
    passwordProtected: false,
    intro,
    summary: existing?.meta?.summary || {
      validatedProcess: "",
      priorityOne: "",
      techContour: "",
      openQuestions: "",
      nextStepsOut: "",
    },
  },
  cards,
  sketch: keepFlow ? existing.sketch : sketch,
};

await redis("SET", KEY, JSON.stringify(session));
await redis("EXPIRE", KEY, String(TTL));

console.log("Seeded process-flow schets:", keepFlow ? "kept edits" : "fresh default");
console.log("URL: https://tools.blablabuild.com/tools/workshop?s=sophista-workshop");
