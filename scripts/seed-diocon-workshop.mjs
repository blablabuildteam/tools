/**
 * Seed dioCON process workshop from docs/diocon/Diocon_prepdoc.pdf
 * Run: node scripts/seed-diocon-workshop.mjs
 * Optional: --reset-sketch to replace an existing schets
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

const SESSION_IDS = ["diocon-workshop"];
const TTL = 60 * 60 * 24 * 90;
const now = new Date().toISOString();
const resetSketch = process.argv.includes("--reset-sketch");

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

function step(partial, order) {
  return {
    id: partial.id,
    milestoneId: partial.milestoneId,
    title: partial.title,
    description: partial.description || "",
    duration: partial.duration || "",
    people: partial.people || [],
    parties: partial.parties || [],
    tools: partial.tools || [],
    formats: partial.formats || [],
    painPoint: Boolean(partial.painPoint),
    order,
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

const attendees = [
  {
    id: "d1",
    name: "Linda",
    org: "dioCON",
    role: "Exact / finance (open vraag)",
    joinedAt: now,
  },
  {
    id: "d2",
    name: "Bob",
    org: "dioCON",
    role: "Mail archiveren",
    joinedAt: now,
  },
  {
    id: "a1",
    name: "Kevin Roos van Raadshooven",
    org: "BlaBlaBuild",
    photo: "/workshop/attendees/kevin-roos.png",
    joinedAt: now,
  },
];

const defaultIntro = {
  todayGoal:
    "dioCON’s kerprocessen in kaart brengen — project setup, uren, berekeningen en modelleren/tekenen — zodat we frictie, tijd en eerste automatiseringskansen scherp krijgen.",
  discover: [
    "Hoe loopt project setup nu precies (CRM → mappen → planning → Exact → TSR)?",
    "Waar zit de meeste tijd / frictie / dubbel werk?",
    "Welke stappen zijn al deels geautomatiseerd (TSR-plugin, Exact)?",
    "Welk proces eerst aanpakken voor de grootste winst?",
    "Wat moet Linda nog aanvullen over Exact?",
  ],
  agenda: [
    "Project setup flow doorlopen en corrigeren",
    "Urenregistratie & controle",
    "Berekeningen (invoer/uitvoer, belastingen)",
    "Modeleren / tekenen (hoog over)",
    "AI-kansen + prioriteit #1",
    "Recap en vervolgstappen",
  ],
  nextSteps: [
    "Succes: vier processen gevalideerd + prioriteit #1 + tech-contour",
    "Open vragen (Exact-stappen Linda) vastleggen",
    "Vervolg: voorstel / bouwcontour",
  ],
  attendees,
};

const milestones = [
  {
    id: "project-setup",
    short: "Project setup",
    title: "Nieuw project / CRM aanmaken en uitzetten in systemen",
    order: 0,
  },
  {
    id: "uren",
    short: "Urenregistratie",
    title: "Uren boeken, controleren en facturabel maken",
    order: 1,
  },
  {
    id: "berekeningen",
    short: "Berekeningen",
    title: "Belastingen, invoer/uitvoer en archiefvergelijking",
    order: 2,
  },
  {
    id: "modelleren",
    short: "Modeleren / tekenen",
    title: "Constructief model uit bouwkundig overnemen (projectafhankelijk)",
    order: 3,
  },
];

const seedSteps = [
  step(
    {
      id: "ps1",
      milestoneId: "project-setup",
      title: "Nieuw project / CRM aanmaken",
      duration: "3",
      description: "2–3 minuten per keer",
      tools: ["CRM"],
      painPoint: false,
    },
    0
  ),
  step(
    {
      id: "ps2",
      milestoneId: "project-setup",
      title: "Map in Verkenner aanmaken",
      tools: ["Windows"],
      formats: ["Map"],
    },
    1
  ),
  step(
    {
      id: "ps3",
      milestoneId: "project-setup",
      title: "Mailmap aanmaken",
      tools: ["Outlook"],
    },
    2
  ),
  step(
    {
      id: "ps4",
      milestoneId: "project-setup",
      title: "Regel in planning aanmaken",
      tools: ["Excel"],
      formats: ["Excel"],
      painPoint: true,
    },
    3
  ),
  step(
    {
      id: "ps5",
      milestoneId: "project-setup",
      title: "Contact aanmaken in financieel overzicht",
      tools: ["Excel"],
      formats: ["Excel"],
      painPoint: true,
    },
    4
  ),
  step(
    {
      id: "ps6",
      milestoneId: "project-setup",
      title: "Project aanmaken in financieel overzicht",
      tools: ["Excel"],
      formats: ["Excel"],
      painPoint: true,
    },
    5
  ),
  step(
    {
      id: "ps7",
      milestoneId: "project-setup",
      title: "Factuurregel / factuur aanmaken in financieel overzicht",
      tools: ["Excel"],
      formats: ["Excel"],
    },
    6
  ),
  step(
    {
      id: "ps8",
      milestoneId: "project-setup",
      title: "Project aanmaken in TimeSheetReport",
      tools: ["TSR", "Browser"],
    },
    7
  ),
  step(
    {
      id: "ps9",
      milestoneId: "project-setup",
      title: "Stappen in Exact",
      description: "Open: @Linda — wat zijn de Exact-stappen en hoeveel tijd kost het?",
      people: ["Linda"],
      tools: ["Exact"],
      painPoint: true,
    },
    8
  ),
  step(
    {
      id: "u1",
      milestoneId: "uren",
      title: "Uren invoeren via TSR-plugin in Outlook",
      duration: "10",
      description: "~10 minuten per week",
      tools: ["TSR", "Outlook"],
    },
    0
  ),
  step(
    {
      id: "u2",
      milestoneId: "uren",
      title: "Controle gemaakte uren / facturabel",
      description: "Volgende stap: eenvoudige controle",
      tools: ["TSR"],
      painPoint: true,
    },
    1
  ),
  step(
    {
      id: "u3",
      milestoneId: "uren",
      title: "Controle verkoopfacturen in Exact",
      duration: "1",
      description: "~1 minuut per factuur",
      tools: ["Exact"],
    },
    2
  ),
  step(
    {
      id: "u4",
      milestoneId: "uren",
      title: "Algemene mail archiveren",
      description: "PST opslaan in map correspondentie — tijd XX per project",
      tools: ["Outlook", "Verkenner"],
      formats: ["PST"],
      painPoint: true,
    },
    3
  ),
  step(
    {
      id: "u5",
      milestoneId: "uren",
      title: "Persoonlijke mail archiveren",
      description: "Verschilt per persoon — mails verslepen naar algemene map",
      tools: ["Outlook"],
      painPoint: true,
    },
    4
  ),
  step(
    {
      id: "u6",
      milestoneId: "uren",
      title: "Wekelijks mails archiveren (Bob)",
      duration: "20",
      description: "15–30 min per week",
      people: ["Bob"],
      tools: ["Outlook"],
    },
    5
  ),
  step(
    {
      id: "u7",
      milestoneId: "uren",
      title: "Renders maken voor website",
      description: "Aan de hand van constructieve modellen — XX min per render",
      tools: ["Revit", "Twinmotion"],
      formats: ["Render"],
    },
    6
  ),
  step(
    {
      id: "b1",
      milestoneId: "berekeningen",
      title: "Invoer / uitvoer knippen-plakken",
      duration: "30",
      description: "Gem. 30 minuten",
      tools: ["Excel", "Word", "PDF"],
      formats: ["Excel", "Word", "PDF"],
      painPoint: true,
    },
    0
  ),
  step(
    {
      id: "b2",
      milestoneId: "berekeningen",
      title: "Gehanteerde belastingen vaststellen",
      duration: "8",
      description: "Gem. 5–10 minuten",
      tools: ["Excel"],
    },
    1
  ),
  step(
    {
      id: "b3",
      milestoneId: "berekeningen",
      title: "Belastingen bepalen uit bouwkundige tekeningen",
      tools: ["PDF", "Excel"],
      formats: ["PDF", "Excel"],
    },
    2
  ),
  step(
    {
      id: "b4",
      milestoneId: "berekeningen",
      title: "Windbelasting op projectlocatie",
      tools: ["Excel", "Browser"],
    },
    3
  ),
  step(
    {
      id: "b5",
      milestoneId: "berekeningen",
      title: "Vergelijkbare projecten opzoeken uit archief",
      description: "Mogelijk doel / kans",
      painPoint: true,
    },
    4
  ),
  step(
    {
      id: "m1",
      milestoneId: "modelleren",
      title: "Stramienen overnemen",
      tools: ["Revit"],
    },
    0
  ),
  step(
    {
      id: "m2",
      milestoneId: "modelleren",
      title: "Levels overnemen",
      tools: ["Revit"],
    },
    1
  ),
  step(
    {
      id: "m3",
      milestoneId: "modelleren",
      title: "Constructieve vloeren en wanden overnemen",
      tools: ["Revit"],
    },
    2
  ),
  step(
    {
      id: "m4",
      milestoneId: "modelleren",
      title: "Maatvoering",
      tools: ["Revit"],
    },
    3
  ),
  step(
    {
      id: "m5",
      milestoneId: "modelleren",
      title: "Tags aan constructieve elementen",
      tools: ["Revit"],
    },
    4
  ),
  step(
    {
      id: "m6",
      milestoneId: "modelleren",
      title: "Overzichten constructieve elementen",
      description: "Hoeveelheden, volumes, lengtes, afmetingen, gewichten",
      tools: ["Revit"],
      formats: ["Schedule"],
    },
    5
  ),
];

const seedAiIdeas = [
  {
    id: "ai-ps",
    milestoneId: "project-setup",
    title: "Project-aanmaak in één flow",
    body: "Eén intake → automatisch mappen, Outlook-map, planning-regel, Excel-regels, TSR-project (en Exact zodra stappen bekend).",
    sources: "CRM · Windows · Outlook · Excel · TSR · Exact",
    known: false,
    order: 0,
  },
  {
    id: "ai-uren",
    milestoneId: "uren",
    title: "Uren-controle + archivering assistent",
    body: "Signalen op niet-facturabele uren; hulp bij mail → projectmap / PST-archief.",
    sources: "TSR · Outlook · Exact",
    known: false,
    order: 0,
  },
  {
    id: "ai-calc",
    milestoneId: "berekeningen",
    title: "Belasting & archief-lookup",
    body: "Van tekening/PDF naar belastingen; vergelijkbare projecten uit archief voorstellen.",
    sources: "PDF · Excel · archief",
    known: false,
    order: 0,
  },
  {
    id: "ai-model",
    milestoneId: "modelleren",
    title: "Model-overname assistent",
    body: "Stramienen/levels/vloeren sneller overnemen; schedules/hoeveelheden voorstellen.",
    sources: "Revit",
    known: false,
    order: 0,
  },
];

async function seedOne(sessionId) {
  const key = `workshop:${sessionId}`;
  const existingRaw = await redis("GET", key);
  let existing = null;
  if (typeof existingRaw === "string") {
    try {
      existing = JSON.parse(existingRaw);
    } catch {
      existing = null;
    }
  }

  const keepSketch = !resetSketch && Boolean(existing?.sketch);

  let sketch;
  if (keepSketch) {
    const prev = existing.sketch;
    if (prev?.durationUnit === "minutes" || prev?.durationUnit === "hours") {
      sketch = prev;
    } else {
      // Migrate older hour-based durations → minutes once.
      const steps = Array.isArray(prev.steps)
        ? prev.steps.map((s) => {
            const n = Number(String(s.duration ?? "").trim().replace(",", "."));
            if (!Number.isFinite(n) || n <= 0) return { ...s, painPoint: false };
            const mins = Math.round(n * 60);
            return { ...s, duration: mins > 0 ? String(mins) : "", painPoint: false };
          })
        : [];
      sketch = { ...prev, steps, durationUnit: "minutes" };
    }
  } else {
    sketch = {
      type: "prep-phase-v1",
      milestones,
      steps: seedSteps.map((s) => ({ ...s, painPoint: false })),
      connections: [],
      aiIdeas: seedAiIdeas,
      stickies: [],
      showAiKansen: false,
      revealedAiMilestoneIds: [],
      durationUnit: "minutes",
    };
  }

  const session = {
    meta: {
      title: "dioCON × blablabuild",
      company: "dioCON",
      logo: "/workshop/diocon/logo.png",
      schedule: "Process workshop · project setup · uren · berekeningen · modelleren",
      goal: "Kerprocessen in kaart → frictie & tijd → prioriteit #1 automatisering",
      tabs: ["sketch"],
      sketchLabel: "dioCON processen",
      hidePainPoints: true,
      sketchHelp: {
        title: "Wat gebeurt hier?",
        body: [
          "Dit bord is jullie procesplaat. De kolommen bovenaan zijn de kerprocessen (Project setup, Uren, Berekeningen, Modeleren).",
          "Per kolom staan de stappen zoals we die nu kennen uit jullie prep — corrigeer, schrap of voeg toe wat klopt.",
          "Vul tijd in (minuten of uren — schakel bovenaan), plus wie en welk systeem.",
        ],
        expect: ["Titel", "Wat gebeurt er", "Tijd", "Wie", "Tools / systeem"],
      },
      createdAt: existing?.meta?.createdAt || now,
      updatedAt: now,
      passwordProtected: false,
      intro: existing?.meta?.intro
        ? { ...defaultIntro, ...existing.meta.intro, attendees, agenda: defaultIntro.agenda }
        : defaultIntro,
      summary: existing?.meta?.summary || {
        validatedProcess: "",
        priorityOne: "",
        techContour: "",
        openQuestions: "",
        nextStepsOut: "",
      },
    },
    columns: existing?.columns?.length
      ? existing.columns
      : [
          {
            id: "notes",
            title: "Pijn & correcties",
            hint: "Wat anders loopt dan de schets",
            color: "#CEFF00",
            order: 0,
          },
          {
            id: "directions",
            title: "Kans #1",
            hint: "Welk proces eerst automatiseren?",
            color: "#7DD3FC",
            order: 1,
          },
          {
            id: "tech",
            title: "Tech-contour",
            hint: "Systemen, koppelingen, constraints",
            color: "#F9A8D4",
            order: 2,
          },
        ],
    cards: existing?.cards?.length
      ? existing.cards
      : [
          card(
            {
              id: "n1",
              columnId: "notes",
              title: "Exact-stappen Linda",
              body: "Nog open — wat gebeurt er in Exact bij nieuw project, en hoe lang?",
              color: "#A78BFA",
            },
            0
          ),
          card(
            {
              id: "d1",
              columnId: "directions",
              title: "Prioriteit #1",
              body: "Welk van de vier processen eerst?",
              color: "#FCD34D",
            },
            0
          ),
          card(
            {
              id: "t1",
              columnId: "tech",
              title: "Systemen",
              body: "CRM · Windows · Outlook · Excel · TSR · Exact · Revit · Twinmotion",
              color: "#CEFF00",
            },
            0
          ),
        ],
    sketch,
    rev: (existing?.rev ?? 0) + 1,
  };

  await redis("SET", key, JSON.stringify(session));
  await redis("EXPIRE", key, String(TTL));

  console.log(
    keepSketch
      ? `${sessionId}: kept schets (${existing.sketch?.type || "unknown"}), rev ${session.rev}`
      : `${sessionId}: seeded schets with ${milestones.length} milestones / ${seedSteps.length} steps, rev ${session.rev}`
  );
}

console.log("Seeding dioCON workshop…");
for (const id of SESSION_IDS) {
  await seedOne(id);
  console.log(`Live: https://tools.blablabuild.com/tools/workshop?s=${id}`);
  console.log(`Local: http://localhost:3000/tools/workshop?s=${id}`);
}
