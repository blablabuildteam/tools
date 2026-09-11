/**
 * Reset Sophista workshop: facilitation intro + process flowchart in Schets.
 * Run: node scripts/seed-sophista-workshop.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { randomBytes, createHash } from "crypto";
import { createTLStore, createShapeId, toRichText, loadSnapshot, getIndices } from "tldraw";

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

let indices = [];
let indexPos = 0;
function nextIndex() {
  if (!indices.length) indices = getIndices(40);
  return indices[indexPos++];
}

function box(id, x, y, w, h, text, color = "light-blue") {
  return {
    id: createShapeId(id),
    typeName: "shape",
    type: "geo",
    x,
    y,
    rotation: 0,
    index: nextIndex(),
    parentId: "page:page",
    isLocked: false,
    opacity: 1,
    props: {
      geo: "rectangle",
      url: "",
      w,
      h,
      growY: 0,
      scale: 1,
      flipX: false,
      flipY: false,
      labelColor: "black",
      color,
      fill: "semi",
      dash: "solid",
      size: "s",
      font: "sans",
      align: "middle",
      verticalAlign: "middle",
      richText: toRichText(text),
    },
    meta: {},
  };
}

function arrowGeo(id, x, y) {
  return {
    id: createShapeId(id),
    typeName: "shape",
    type: "geo",
    x,
    y,
    rotation: 0,
    index: nextIndex(),
    parentId: "page:page",
    isLocked: false,
    opacity: 1,
    props: {
      geo: "arrow-right",
      url: "",
      w: 48,
      h: 36,
      growY: 0,
      scale: 1,
      flipX: false,
      flipY: false,
      labelColor: "black",
      color: "grey",
      fill: "solid",
      dash: "solid",
      size: "s",
      font: "sans",
      align: "middle",
      verticalAlign: "middle",
      richText: toRichText(""),
    },
    meta: {},
  };
}

function label(id, x, y, w, h, text, color = "black") {
  return {
    id: createShapeId(id),
    typeName: "shape",
    type: "text",
    x,
    y,
    rotation: 0,
    index: nextIndex(),
    parentId: "page:page",
    isLocked: false,
    opacity: 1,
    props: {
      color,
      size: "l",
      w,
      font: "sans",
      textAlign: "start",
      autoSize: false,
      scale: 1,
      richText: toRichText(text),
    },
    meta: {},
  };
}

function buildFlowchartSnapshot() {
  const store = createTLStore();
  // Ensure page exists via empty load, then put shapes
  const empty = store.getStoreSnapshot();
  loadSnapshot(store, { document: { store: empty.store, schema: empty.schema } });

  const shapes = [
    label("title", 40, 30, 900, 40, "Sophista — aanname proces (ter validatie)", "black"),
    label(
      "subtitle",
      40,
      80,
      980,
      40,
      "Scope workshop: informatie verzamelen → analyse → eerste gestandaardiseerde rapport",
      "blue"
    ),

    // Main phase 1 flow
    box("b1", 40, 200, 200, 110, "1. Intake / trigger\nNieuwe deal of\nverkooptraject start", "yellow"),
    arrowGeo("a1", 260, 237),
    box(
      "b2",
      330,
      200,
      220,
      110,
      "2. Informatie verzamelen\nKlant + intern + extern\n(nu: handmatig / traag)",
      "light-blue"
    ),
    arrowGeo("a2", 570, 237),
    box(
      "b3",
      640,
      200,
      220,
      110,
      "3. Verwerken & analyseren\nStructureren, checken,\naanvullen, interpreteren",
      "violet"
    ),
    arrowGeo("a3", 880, 237),
    box(
      "b4",
      950,
      200,
      230,
      110,
      "4. Eerste standaard-\nrapport / output\n(fase-1 doel)",
      "light-green"
    ),

    // Inputs under step 2
    label("in-label", 330, 350, 280, 30, "Wat komt er typisch binnen?", "grey"),
    box("in1", 330, 390, 160, 70, "Klantinput\ndossier / gesprekken", "grey"),
    box("in2", 505, 390, 160, 70, "Intern\nIMs, templates,\nkennisbank", "grey"),
    box("in3", 680, 390, 180, 70, "Extern\nCompany.info /\nGain.pro / publiek", "grey"),

    // Pain / opportunity
    box(
      "pain",
      40,
      390,
      250,
      100,
      "Hypothese pijn\nTijd & inconsistentie\nin verzamelen + schrijven\n→ te valideren",
      "orange"
    ),

    // Later phases
    label("later-label", 40, 540, 700, 30, "Later in het verkoopproces (kort meenemen, niet bouwen vandaag)", "grey"),
    box("l1", 40, 590, 180, 70, "Marketing\nteaser / shortlist / NDA", "grey"),
    arrowGeo("la1", 240, 607),
    box("l2", 310, 590, 180, 70, "Due diligence\nVDR / Q&A", "grey"),
    arrowGeo("la2", 510, 607),
    box("l3", 580, 590, 200, 70, "Signing & closing\nSPA / notaris", "grey"),

    box(
      "note",
      950,
      390,
      230,
      120,
      "Workshop-vraag\nKlopt deze flow?\nWat mist / anders?\nWaar AI eerst helpen?",
      "yellow"
    ),
  ];

  store.put(shapes);
  const raw = store.getStoreSnapshot();
  // Format compatible with client loadSnapshot / getSnapshot.document
  return {
    document: {
      store: raw.store,
      schema: raw.schema,
    },
  };
}

// Board: only capture notes during workshop — flowchart is the main artifact
const cards = [
  card(
    {
      id: "cap1",
      columnId: "process",
      title: "Validatie-notities",
      body: "Gebruik dit bord voor correcties op de flowchart: wat anders loopt, wie doet wat, waar zit de echte pijn.",
      color: "#A78BFA",
    },
    0
  ),
  card(
    {
      id: "cap2",
      columnId: "solutions",
      title: "Oplossingsideeën",
      body: "Na validatie: hier landen de AI-richtingen die we willen prioriteren (bijv. info-verzameling → standaardrapport).",
      color: "#FCD34D",
    },
    0
  ),
  card(
    {
      id: "cap3",
      columnId: "tech",
      title: "Tech-contour #1",
      body: "Voor de gekozen richting: bronnen, templates, review-stap, output-formaat.",
      color: "#CEFF00",
    },
    0
  ),
  card(
    {
      id: "cap4",
      columnId: "later",
      title: "Toekomstige agents",
      body: "Wat we meenemen zodat de eerste oplossing uitbreidbaar blijft (marketing / DD / …).",
      color: "#FDBA74",
    },
    0
  ),
];

const sketch = buildFlowchartSnapshot();
// sanity: ensure reload works
{
  const test = createTLStore();
  loadSnapshot(test, sketch);
  const n = [...test.allRecords()].filter((r) => r.typeName === "shape").length;
  console.log("Flowchart shapes:", n);
  writeFileSync(resolve(__dirname, "../exports/sophista-flowchart-snapshot.json"), JSON.stringify(sketch));
}

const now = new Date().toISOString();
const session = {
  meta: {
    title: "Sophista × blablabuild",
    company: "Sophista",
    goal: "Informatie-verzameling versnellen → gestandaardiseerd rapport (begin bedrijfsverkoopproces)",
    createdAt: now,
    updatedAt: now,
    passwordProtected: true,
    passwordHash: hashPassword("sophista-dinsdag"),
    intro: {
      todayGoal:
        "Het begin van Sophista’s bedrijfsverkoopproces scherp krijgen — specifiek: informatie verzamelen automatiseren/versnellen om daarna een gestandaardiseerd rapport uit te draaien — en daaruit tot oplossingsrichtingen + eerste tech-contouren komen.",
      discover: [
        "Hoe loopt ‘informatie verzamelen → rapport’ nu precies (stappen, rollen, systemen)?",
        "Waar zit de meeste tijd / frictie / kwaliteitsverlies?",
        "Wat is een realistische eerste gestandaardiseerde output?",
        "Welke AI-richting eerst — zodat we snel in oplossingsmodus kunnen?",
        "Waar moeten we technisch rekening mee houden voor latere uitbreidingen in het verkoopproces?",
      ],
      agenda: [
        "Intro & check-in",
        "Schets: aanname-proces valideren / bijtekenen (hoofdactiviteit)",
        "Pijn & eerste output scherp zetten",
        "Oplossingsrichtingen prioriteren",
        "Eerste tech-contour + next steps",
      ],
      nextSteps: [
        "Gekozen richting + gevalideerd proces samenvatten",
        "Open vragen / benodigde input van Sophista",
        "Vervolg: bouwvoorstel / volgende sessie",
      ],
      attendees: [],
    },
  },
  cards,
  sketch,
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

console.log("Seeded facilitation session + flowchart sketch");
console.log("URL: https://tools.blablabuild.com/tools/workshop?s=sophista-workshop");
console.log("Password: sophista-dinsdag");
console.log("Open tab Schets for the process flowchart");
