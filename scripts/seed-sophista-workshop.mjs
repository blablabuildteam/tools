/**
 * Reset Sophista schets to Excalidraw format (client seeds default flowchart if empty).
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

// Keep existing Excalidraw edits; otherwise empty scene → client builds default flowchart
const keepExcalidraw =
  existing?.sketch?.type === "excalidraw" &&
  Array.isArray(existing.sketch.elements) &&
  existing.sketch.elements.length > 0;

const session = {
  meta: {
    title: "Sophista × blablabuild",
    company: "Sophista",
    goal: "Informatie-verzameling versnellen → gestandaardiseerd rapport",
    createdAt: existing?.meta?.createdAt || now,
    updatedAt: now,
    passwordProtected: false,
    intro: existing?.meta?.intro || {
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
        "15:00–15:15 · Intro & check-in",
        "15:15–16:15 · Schets: proces valideren / bijtekenen",
        "16:15–16:30 · Pauze",
        "16:30–17:15 · Pijn & richtingen prioriteren",
        "17:15–17:45 · Tech-contour #1",
        "17:45–18:00 · Afronding",
      ],
      nextSteps: [
        "Succes vandaag: gevalideerd proces + prioriteit #1 + tech-contour",
        "Open vragen vastleggen",
        "Vervolg: bouwvoorstel (B) later",
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
    },
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
  sketch: keepExcalidraw
    ? existing.sketch
    : {
        type: "excalidraw",
        version: 2,
        elements: [],
        appState: { viewBackgroundColor: "#f7f6f2" },
        files: {},
      },
};

await redis("SET", KEY, JSON.stringify(session));
await redis("EXPIRE", KEY, String(TTL));

console.log(
  keepExcalidraw
    ? "Kept existing Excalidraw scene"
    : "Reset schets → client will seed default flowchart"
);
console.log("URL: https://tools.blablabuild.com/tools/workshop?s=sophista-workshop");
