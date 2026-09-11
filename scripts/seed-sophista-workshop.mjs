/**
 * Seed Sophista Process Workshop session into Vercel KV.
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
    author: partial.author || "blablabuild",
    votes: [],
    color: partial.color || "#CEFF00",
    order,
    createdAt: now,
    updatedAt: now,
  };
}

const cards = [
  // DOEL
  card(
    {
      id: "goal-1",
      columnId: "goal",
      title: "Doel van de samenwerking",
      body: "Samen met Sophista onderzoeken hoe AI en automatisering het bedrijfsverkoopproces kunnen ondersteunen — van procesanalyse naar concrete oplossingsrichtingen en eerste technische contouren.",
      color: "#CEFF00",
    },
    0
  ),
  card(
    {
      id: "goal-2",
      columnId: "goal",
      title: "Scope fase 1 (afgebakend)",
      body: "Van binnenkomende informatie → verwerking & analyse → eerste gestandaardiseerde rapport.\n\nFocus: voorbereidingsfase van het verkoopproces (niet meteen marketing / DD / signing).",
      color: "#CEFF00",
    },
    1
  ),
  card(
    {
      id: "goal-3",
      columnId: "goal",
      title: "Out of scope (nu)",
      body: "Volledige marketingfase, due diligence dataroom, SPA/onderhandelingen. Wel kort meenemen als ‘Later’, zodat fase 1 niet losstaat van vervolg.",
      color: "#FDBA74",
    },
    2
  ),

  // INKOMEND
  card(
    {
      id: "in-1",
      columnId: "incoming",
      title: "Klant & deal-input",
      body: "Ontvangen klantgegevens, businessplan, notities/notulen van besprekingen, interne transactiedossiers, templates, kennisbank.",
      color: "#7DD3FC",
    },
    0
  ),
  card(
    {
      id: "in-2",
      columnId: "incoming",
      title: "Externe bronnen",
      body: "Company.info (licentie), Gain.pro / LongListMaker, overige publieke bronnen. Agent moet ook zelf analyses kunnen doen naast aangeleverde docs.",
      color: "#7DD3FC",
    },
    1
  ),
  card(
    {
      id: "in-3",
      columnId: "incoming",
      title: "Sophista-standaarden",
      body: "Historische IMs, huisstijl/kleuren, prompts (concept IM-prompt), NDA-template, teaser-format.",
      color: "#7DD3FC",
    },
    2
  ),

  // PROCES
  card(
    {
      id: "proc-1",
      columnId: "process",
      title: "Voorbereidingsfase — stappen Sophista",
      body: "1) Strategie / bedrijfsverkenning / marktanalyse\n2) KPI’s & waardedrijvers\n3) Financiële prognoses\n4) Indicatieve waardebepaling (APV)\n5) Informatiememorandum\n6) Procesbrieven & NDA\n7) Teaser / anoniem profiel\n8) Longlist → shortlist kopers",
      color: "#A78BFA",
    },
    0
  ),
  card(
    {
      id: "proc-2",
      columnId: "process",
      title: "Kernflow fase 1 (workshop-scope)",
      body: "Inkomend dossier + bronnen → structureren & analyseren → gestandaardiseerde output (analyse / eerste rapport / bouwsteen richting IM).",
      color: "#A78BFA",
    },
    1
  ),
  card(
    {
      id: "proc-3",
      columnId: "process",
      title: "Pijnpunten (te valideren dinsdag)",
      body: "Handmatig verzamelen & herschrijven • inconsistentie tussen dossiers • tijd naar eerste bruikbare IM/teaser • koppeling kennisbank/templates • kwaliteit vs. snelheid • ‘lerend vermogen’ van prompts ontbreekt nog.",
      color: "#F9A8D4",
    },
    2
  ),

  // RAPPORT
  card(
    {
      id: "rep-1",
      columnId: "report",
      title: "Bedrijfsanalyse (1-klik)",
      body: "Algemene omschrijving, historie, producten/diensten, geo, klanten, USP’s, ketenpositie, eigenaarsstructuur, financiële kengetallen, overnamegeschiedenis — deels via Company.info.",
      color: "#86EFAC",
    },
    0
  ),
  card(
    {
      id: "rep-2",
      columnId: "report",
      title: "Marktanalyse",
      body: "Marktinrichting, trends, regelgeving, groei/groeidrijvers, ketenoverzicht, concurrentie + marktaandeel-inschatting, gefragmenteerd vs. geconsolideerd.",
      color: "#86EFAC",
    },
    1
  ),
  card(
    {
      id: "rep-3",
      columnId: "report",
      title: "IM als doel-output (richting)",
      body: "PowerPoint-structuur 20–30 slides: exec summary, investment highlights, legal/transactiemotivatie, producten, markt, klanten, operatie, management, finance (beperkt), projecties, case, risico’s.\n\nKwaliteitseis: koper-vragen beantwoordbaar (propositie, model, value drivers, risico’s, schaalbaarheid).",
      color: "#86EFAC",
    },
    2
  ),

  // OPLOSSINGEN
  card(
    {
      id: "sol-1",
      columnId: "solutions",
      title: "UC1 — Bedrijfsverkenning agent",
      body: "Automatische enterprise scan op basis van dossier + publieke bronnen. Relatief startbaar; sterke afhankelijkheid van bron-kwaliteit en licenties.",
      color: "#FCD34D",
    },
    0
  ),
  card(
    {
      id: "sol-2",
      columnId: "solutions",
      title: "UC2 — Marktanalyse agent",
      body: "Markt/trends/concurrentie in gestandaardiseerd format. Bouwt voort op UC1; output voedt IM.",
      color: "#FCD34D",
    },
    1
  ),
  card(
    {
      id: "sol-3",
      columnId: "solutions",
      title: "UC3 — IM generator (kernambition)",
      body: "Map met bronnen woord-voor-woord analyseren + eigen analyses + eerdere IMs. Stap-voor-stap met controle. Concept prompt bestaat al. Belangrijk: templates, kennisbank, transactiedossiers + lerend vermogen.",
      color: "#FCD34D",
    },
    2
  ),
  card(
    {
      id: "sol-4",
      columnId: "solutions",
      title: "UC4 — NDA personaliseren",
      body: "Standaard NDA + aanhef/tekeningsbevoegde uit Company.info. Relatief eenvoudige automatisering.",
      color: "#FCD34D",
    },
    3
  ),
  card(
    {
      id: "sol-5",
      columnId: "solutions",
      title: "UC5 — Teaser uit IM",
      body: "Anoniem profiel / teaser afleiden uit goedgekeurd IM.",
      color: "#FCD34D",
    },
    4
  ),
  card(
    {
      id: "sol-6",
      columnId: "solutions",
      title: "UC6 — Longlist / buyer dashboard",
      body: "Categorieën (NL/Benelux/EU/wereld), Gain.pro / Longlistmaker / Company.info, koppeling bedrijfsverkenning, Excel-onderlaag, klanttoegang met beveiliging.",
      color: "#FCD34D",
    },
    5
  ),

  // TECH
  card(
    {
      id: "tech-1",
      columnId: "tech",
      title: "Bouwblokken (contour)",
      body: "• Document-ingest (map/dossier)\n• Retrieval over kennisbank + historische IMs\n• Prompt/skill-laag met review-stappen\n• Bron-connectors (Company.info e.d.)\n• Output naar PPTX / gestructureerde slides\n• Feedback-loop (‘lerend vermogen’) op edits van adviseurs",
      color: "#CEFF00",
    },
    0
  ),
  card(
    {
      id: "tech-2",
      columnId: "tech",
      title: "Niet-functionele eisen",
      body: "Vertrouwelijkheid dealdata • bronvermelding / aannames markeren • mens-in-de-loop goedkeuring vóór externe output • audit trail wie wat wijzigde.",
      color: "#CEFF00",
    },
    1
  ),
  card(
    {
      id: "tech-3",
      columnId: "tech",
      title: "IM-prompt — aandachtspunten",
      body: "Conceptprompt: M&A-stijl, NL/EN, slide-by-slide, Sophista kleuren/fonts. Workshop: waar faalt dit zonder interne docs? Wat moet retrieval/template-laag toevoegen?",
      color: "#7DD3FC",
    },
    2
  ),

  // LATER
  card(
    {
      id: "lat-1",
      columnId: "later",
      title: "Marketingfase",
      body: "Shortlist benaderen, NDA’s, IM verstrekken, management presentations, indicatieve biedingen, LOI.",
      color: "#FDBA74",
    },
    0
  ),
  card(
    {
      id: "lat-2",
      columnId: "later",
      title: "Due Diligence",
      body: "VDR opzetten, Q&A, bevindingen, onderhandelingen uitkomsten.",
      color: "#FDBA74",
    },
    1
  ),
  card(
    {
      id: "lat-3",
      columnId: "later",
      title: "Signing & Closing",
      body: "SPA & documentatie, notaris, persbericht — vooral juridisch/extern; lagere AI-prioriteit in fase 1.",
      color: "#FDBA74",
    },
    2
  ),
];

const now = new Date().toISOString();
const session = {
  meta: {
    title: "Sophista × blablabuild — Process Workshop",
    company: "Sophista",
    goal: "Van binnenkomende informatie → verwerking & analyse → eerste gestandaardiseerde rapport (voorbereidingsfase verkoopproces)",
    createdAt: now,
    updatedAt: now,
    passwordProtected: true,
    passwordHash: hashPassword("sophista-dinsdag"),
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

const existing = await redis("GET", KEY);
if (existing) {
  console.log("Existing session found — overwriting with prepared Sophista board.");
}

await redis("SET", KEY, JSON.stringify(session));
await redis("EXPIRE", KEY, String(TTL));

console.log("Seeded:", SESSION_ID);
console.log("Cards:", cards.length);
console.log("URL: https://tools.blablabuild.com/tools/workshop?s=sophista-workshop");
console.log("Password: sophista-dinsdag");
