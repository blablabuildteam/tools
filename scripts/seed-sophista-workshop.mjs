/**
 * Seed / reset Sophista workshop as a FACILITATION board (not a doc dump).
 * Run: node scripts/seed-sophista-workshop.mjs
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { randomBytes, createHash } from "crypto";

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

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = createHash("sha256").update(`${salt}:${password}`).digest("hex");
  return `${salt}.${hash}`;
}

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

/**
 * Sparse prompt cards — the group fills the board live.
 * Sophista AI-use cases only as short options to prioritize in column 5.
 */
const cards = [
  card(
    {
      id: "g1",
      columnId: "goal",
      title: "Startpunt samenwerking",
      body: "Onderzoeken hoe AI/automatisering het bedrijfsverkoopproces van Sophista kan ondersteunen — beginnend bij de voorbereidingsfase.",
      color: "#CEFF00",
    },
    0
  ),
  card(
    {
      id: "g2",
      columnId: "goal",
      title: "Scope vandaag",
      body: "Alleen: inkomende info → verwerking/analyse → eerste gestandaardiseerde rapport.\n\nVraag aan de groep: klopt deze afbakening?",
      color: "#CEFF00",
    },
    1
  ),

  card(
    {
      id: "i1",
      columnId: "incoming",
      title: "Vragen om samen te beantwoorden",
      body: "• Welke documenten/bronnen komen binnen bij een nieuwe deal?\n• Wat komt van de klant vs. wat zoeken jullie zelf?\n• Wat mist er vaak?",
      color: "#7DD3FC",
    },
    0
  ),

  card(
    {
      id: "p1",
      columnId: "process",
      title: "Vragen om samen te beantwoorden",
      body: "• Wie doet wat, in welke volgorde?\n• Welke stappen kosten de meeste tijd?\n• Waar gaan kwaliteit of consistentie mis?",
      color: "#A78BFA",
    },
    0
  ),

  card(
    {
      id: "r1",
      columnId: "report",
      title: "Vragen om samen te beantwoorden",
      body: "• Wat is de eerste bruikbare ‘standaard output’ (niet meteen een volledig IM)?\n• Voor wie is die output?\n• Wanneer is die ‘goed genoeg’?",
      color: "#86EFAC",
    },
    0
  ),

  card(
    {
      id: "s1",
      columnId: "solutions",
      title: "Opties uit Sophista-inventarisatie",
      body: "Kort stemmen / rangschikken (niet uitwerken):\n1 Bedrijfsverkenning\n2 Marktanalyse\n3 IM-generator\n4 NDA personaliseren\n5 Teaser uit IM\n6 Longlist / buyer dashboard\n\nVoeg eigen kaarten toe voor nieuwe ideeën.",
      color: "#FCD34D",
    },
    0
  ),

  card(
    {
      id: "t1",
      columnId: "tech",
      title: "Na prioritering invullen",
      body: "Voor de #1 richting: welke bouwblokken zijn nodig (bronnen, templates, review-stap, output-format)?",
      color: "#CEFF00",
    },
    0
  ),

  card(
    {
      id: "l1",
      columnId: "later",
      title: "Even parkeren",
      body: "Marketingfase, DD, signing — kort noemen zodat fase 1 niet losstaat, niet uitwerken vandaag.",
      color: "#FDBA74",
    },
    0
  ),
];

const now = new Date().toISOString();
const session = {
  meta: {
    title: "Sophista × blablabuild",
    company: "Sophista",
    goal: "Proces begrijpen → oplossingsrichtingen → eerste tech-contouren (fase 1: info → analyse → eerste rapport)",
    createdAt: now,
    updatedAt: now,
    passwordProtected: true,
    passwordHash: hashPassword("sophista-dinsdag"),
    intro: {
      todayGoal:
        "Het voorbereidingsproces van Sophista voldoende begrijpen om tot concrete AI-oplossingsrichtingen te komen — en voor de gekozen richting een eerste technische contour te schetsen.",
      discover: [
        "Hoe loopt het proces nu van inkomende informatie naar bruikbare output?",
        "Waar zit de meeste tijd, frictie of kwaliteitsverlies?",
        "Wat is een realistische eerste gestandaardiseerde output (fase 1)?",
        "Welke AI-richting(en) verdienen prioriteit — en waarom?",
        "Welke bouwblokken zijn nodig voor die eerste richting?",
      ],
      agenda: [
        "Intro & check-in (wie is er, doel vandaag)",
        "Doel & scope bevestigen",
        "Huidig proces: inkomend → verwerking (op het bord)",
        "Eerste output: wat moet eruit komen?",
        "Richtingen prioriteren (o.a. Sophista-inventarisatie)",
        "Tech-contour voor #1",
        "Later / next steps afspreken",
      ],
      nextSteps: [
        "Gekozen richting + contour samenvatten",
        "Open vragen & benodigde input van Sophista",
        "Vervolgafspraak / bouwvoorstel",
      ],
      attendees: [],
    },
  },
  cards,
  sketch: null,
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

await redis("SET", KEY, JSON.stringify(session));
await redis("EXPIRE", KEY, String(TTL));

console.log("Reset Sophista facilitation board");
console.log("Cards:", cards.length);
console.log("URL: https://tools.blablabuild.com/tools/workshop?s=sophista-workshop");
console.log("Password: sophista-dinsdag");
