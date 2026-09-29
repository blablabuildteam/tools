/**
 * Seed StasDock AI use-case matrix.
 * Run: node scripts/seed-stasdock-matrix.mjs
 * Optional: --reset to wipe existing cases first
 *
 * Share: https://tools.blablabuild.com/tools/ai-matrix?s=stasdock-matrix
 *
 * Intro copy lives in app/tools/ai-matrix/sessionIntros.ts
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

const SESSION_ID = "stasdock-matrix";
const KEY = `ai-matrix:${SESSION_ID}`;
const TTL = 60 * 60 * 24 * 90;
const reset = process.argv.includes("--reset");
const now = new Date().toISOString();

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

function uc(partial) {
  const scores = partial.scores;
  const knockout = partial.knockout;
  const record = {
    id: partial.id,
    name: partial.name,
    description: partial.description,
    solution: partial.solution,
    label: partial.label,
    owner: partial.owner || "StasDock + blablabuild",
    addedBy: "blablabuild",
    knockout,
    scores,
    priorityStatus: partial.priorityStatus || "later",
    priorityRank: partial.priorityRank,
    interest: partial.interest || "yes",
    deliveryPartners: partial.deliveryPartners || ["blablabuild"],
    originalInput: {
      name: partial.name,
      description: partial.description,
      solution: partial.solution,
      label: partial.label,
      knockout,
      scores,
      savedAt: now,
    },
  };
  return record;
}

/**
 * Goals from intake: kosten omlaag · meer omzet · efficiency · snelheid
 * Stack: Shopify
 * Agencies today: TaskForce (Google), VetSocial (Social Ads), NewFive (Klaviyo), marketplace agency
 * ~75% own site · Tess = human support · TripleWhale / ProfitMetrics in play
 * API keys: blablabuild can get them — but ask who owns access (Shopify / Klaviyo / TW / PM) and how agencies share
 *
 * Scores 1–5. High implementation = faster to build (axis inverted for effort).
 */
const CASES = [
  uc({
    id: "sd-support-assist",
    name: "Support assist voor Tess",
    description:
      "Tess doet menselijke support. Veel vragen herhalen zich (montage, passende fiets, verzending, retour). Antwoorden kosten tijd en wisselen in kwaliteit.",
    solution:
      "AI-assistent die concept-antwoorden maakt in StasDock-tone, FAQ’s voorstelt en tickets triaget — idealiter met Shopify-ordercontext. Tess blijft eindverantwoordelijk. Eerst kort prüfen waar tickets nu binnenkomen (mail, Shopify Inbox, of helpdesk-tool), zodat we op de juiste plek aanhaken.",
    label: "Account Management",
    owner: "Tess",
    priorityStatus: "now",
    priorityRank: 1,
    knockout: { recurring: true, costly: true, dataAvailable: true, standardized: true },
    scores: {
      businessImpact: 4,
      frequency: 5,
      aiSuitability: 5,
      implementation: 4,
      risk: 3,
      adoption: 5,
    },
  }),
  uc({
    id: "sd-weekstart-briefing",
    name: "Weekstart AI-briefing",
    description:
      "Data zit verspreid (Shopify, ads, e-mail, attributie). Weekstart is handmatig en traag — weinig ownership-gevoel over digital performance. Open: wie heeft Shopify Admin / API-toegang, en mogen wij een dedicated app/token?",
    solution:
      "Automatische weekbrief vanuit Shopify + ads/e-mail signalen: omzet, MER/ROAS, top SKUs, campagne-alerts, open acties. Eén link / Slack / mail vóór de weekstart.",
    label: "BI / Pricing",
    owner: "StasDock intern",
    priorityStatus: "now",
    priorityRank: 2,
    knockout: { recurring: true, costly: true, dataAvailable: true, standardized: true },
    scores: {
      businessImpact: 4,
      frequency: 4,
      aiSuitability: 4,
      implementation: 3,
      risk: 4,
      adoption: 5,
    },
  }),
  uc({
    id: "sd-klaviyo-deals",
    name: "Klaviyo slimmer: flows & deal-mails",
    description:
      "E-mail loopt via NewFive / Klaviyo (Shopify-flow). StasDock wil niet NewFive vervangen, maar er iets naast bouwen: snellere deal-mails, segmenten en varianten zonder op agency-tempo te wachten.",
    solution:
      "Eigen AI/tooling-laag naast NewFive (Klaviyo API + Shopify-data): drafts voor deals, segment-voorstellen, A/B-copy. NewFive blijft campagnes/flows runnen; blablabuild levert snellere input en optioneel geautomatiseerde drafts die zij (of StasDock) publiceren.",
    label: "E-mail Marketing",
    owner: "NewFive + StasDock",
    priorityStatus: "now",
    priorityRank: 3,
    knockout: { recurring: true, costly: true, dataAvailable: true, standardized: true },
    scores: {
      businessImpact: 5,
      frequency: 4,
      aiSuitability: 4,
      implementation: 3,
      risk: 3,
      adoption: 4,
    },
  }),
  uc({
    id: "sd-newsletter-qa",
    name: "Newsletter / campaign QA-gate",
    description:
      "Meer toezicht gewenst op newsletters en statics vóór send — nu weinig grip op kwaliteit, audience en CTA.",
    solution:
      "Pre-send checklist met AI: copy, claim, CTA, audience-fit, merk-tone, risico’s. Output: go / adjust-lijst voor NewFive of intern.",
    label: "E-mail Marketing",
    owner: "StasDock",
    priorityStatus: "near",
    priorityRank: 4,
    knockout: { recurring: true, costly: false, dataAvailable: true, standardized: true },
    scores: {
      businessImpact: 3,
      frequency: 3,
      aiSuitability: 5,
      implementation: 5,
      risk: 4,
      adoption: 4,
    },
  }),
  uc({
    id: "sd-ads-creatives",
    name: "AI creatives / statics voor ads",
    description:
      "Ads via TaskForce (Google) en VetSocial (Social). Creatives zijn bottleneck; agency-kosten ~€2.5k. Meer volume en snellere tests zonder volledig in-house media te kopen.",
    solution:
      "Pipeline: productfoto’s → AI-varianten (hoek, kleur, claim, format). Menselijke selectie → doorzetten naar agencies. Focus op volume + test-snelheid, niet op vervangen van media buying.",
    label: "Media Buying",
    owner: "TaskForce / VetSocial + StasDock",
    priorityStatus: "now",
    priorityRank: 5,
    knockout: { recurring: true, costly: true, dataAvailable: true, standardized: false },
    scores: {
      businessImpact: 5,
      frequency: 5,
      aiSuitability: 4,
      implementation: 3,
      risk: 4,
      adoption: 4,
    },
  }),
  uc({
    id: "sd-ugc-content",
    name: "UGC & reviews → content",
    description:
      "Reviews en klantfoto’s zijn goud voor een visueel product, maar komen nauwelijks systematisch in ads, social of PDP.",
    solution:
      "AI selecteert sterke reviews/UGC, maakt quotes, social-cuts en ad-hooks. Feed voor creatives + organisch.",
    label: "Media Buying",
    owner: "StasDock",
    priorityStatus: "near",
    priorityRank: 6,
    knockout: { recurring: true, costly: false, dataAvailable: true, standardized: true },
    scores: {
      businessImpact: 3,
      frequency: 3,
      aiSuitability: 5,
      implementation: 4,
      risk: 4,
      adoption: 4,
    },
  }),
  uc({
    id: "sd-social-organic",
    name: "Social posts & organische content automatiseren",
    description:
      "Organische content uploaden en social posts kosten tijd. Wil kijken naar planning/tools (o.a. Hootsuite-achtig) + AI-generatie over kanalen.",
    solution:
      "Contentkalender: batch posts uit product, UGC en campagnes; multi-platform drafts; menselijke goedkeuring vóór publish.",
    label: "Media Buying",
    owner: "StasDock / VetSocial",
    priorityStatus: "next",
    priorityRank: 7,
    knockout: { recurring: true, costly: true, dataAvailable: true, standardized: false },
    scores: {
      businessImpact: 3,
      frequency: 4,
      aiSuitability: 4,
      implementation: 3,
      risk: 3,
      adoption: 3,
    },
  }),
  uc({
    id: "sd-attribution-insight",
    name: "Attributie & profit: verbeteren of vervangen",
    description:
      "Nu TripleWhale en/of ProfitMetrics (Shopify-gekoppeld). Inzichten landen slecht in actie. Optie A: AI-laag erop. Optie B: lichter/goedkoper eigen inzicht (Shopify + ads + Klaviyo) en TW/PM uitfaseren als het vooral kost en ruis geeft.",
    solution:
      "Eerst audit: wat gebruiken ze écht uit TW/PM? Daarna óf AI-briefing op bestaande stack, óf vervangend week/maand-inzicht vanuit Shopify + ad platforms — gericht op beslissingen, niet op nóg een dashboard.",
    label: "BI / Pricing",
    owner: "StasDock",
    priorityStatus: "near",
    priorityRank: 8,
    knockout: { recurring: true, costly: true, dataAvailable: true, standardized: false },
    scores: {
      businessImpact: 5,
      frequency: 4,
      aiSuitability: 3,
      implementation: 2,
      risk: 3,
      adoption: 4,
    },
  }),
  uc({
    id: "sd-cro-pdp",
    name: "CRO / PDP assistant (eigen site)",
    description:
      "~75% omzet via eigen Shopify-store. CRO en performance horen bij doorontwikkeling, maar experimenten landen niet in deze matrix-build: die gaan naar een apart dashboard, afhankelijk van de Kopstorm-omgeving (Kopstorm bouwt frontend).",
    solution:
      "AI levert hypotheses, copy-varianten en PDP-checklists. Live experimenten / dashboard: aparte track met Kopstorm. Deze use case blijft op het bord voor impact/prioriteit — delivery volgt hun stack.",
    label: "General",
    owner: "StasDock",
    priorityStatus: "next",
    priorityRank: 9,
    knockout: { recurring: true, costly: true, dataAvailable: true, standardized: false },
    scores: {
      businessImpact: 4,
      frequency: 3,
      aiSuitability: 3,
      implementation: 2,
      risk: 4,
      adoption: 3,
    },
  }),
  uc({
    id: "sd-marketplace-listings",
    name: "Marketplace listings & content (AI-drafts)",
    description:
      "Marketplaces (o.a. Amazon) via aparte agency. Listings en A+ content zijn traag om te itereren; StasDock wil meer grip zonder agency volledig te vervangen.",
    solution:
      "AI-drafts voor bullets, titles, A+ per kanaal/taal. Agency blijft live zetten; StasDock levert sneller briefing + copy.",
    label: "General",
    owner: "Marketplace agency + StasDock",
    priorityStatus: "later",
    priorityRank: 10,
    knockout: { recurring: true, costly: true, dataAvailable: true, standardized: true },
    scores: {
      businessImpact: 3,
      frequency: 3,
      aiSuitability: 4,
      implementation: 3,
      risk: 3,
      adoption: 2,
    },
  }),
];

async function main() {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    throw new Error("Missing KV_REST_API_URL / KV_REST_API_TOKEN in .env.local");
  }

  if (reset) {
    await redis("DEL", KEY);
    console.log(`Reset ${KEY}`);
  }

  for (const c of CASES) {
    await redis("HSET", KEY, c.id, JSON.stringify(c));
  }

  await redis(
    "HSET",
    KEY,
    "__prioritize_meta__",
    JSON.stringify({
      client: "StasDock",
      stack: "Shopify",
      goals: ["kosten omlaag", "meer omzet", "efficiency", "snelheid"],
      agencies: {
        google: "TaskForce",
        socialAds: "VetSocial",
        klaviyo: "NewFive — build alongside, not replace",
        marketplaces: "(agency TBD)",
        frontend: "Kopstorm",
      },
      people: {
        owner: "Jasper",
        support: "Tess",
      },
      attributionOptions: [
        "AI layer on TripleWhale / ProfitMetrics",
        "Replace TW/PM with lighter Shopify + ads + Klaviyo insight",
      ],
      croNote:
        "CRO experiments live in a separate dashboard — depends on Kopstorm environment; Kopstorm owns frontend.",
      openQuestions: [
        "Shopify Admin / Custom App access for blablabuild (scoped).",
        "Klaviyo API key for the layer beside NewFive (StasDock-owned).",
        "TW / ProfitMetrics: keep + AI, or replace — what do they actually use weekly?",
        "Where does Tess handle support today (email / Shopify Inbox / helpdesk)?",
      ],
      notes:
        "Working board. Jasper owner. Kopstorm frontend. Build next to NewFive. TW/PM replace on the table. ~75% Shopify.",
      seededAt: now,
    })
  );

  await redis("EXPIRE", KEY, String(TTL));
  console.log(`Seeded ${CASES.length} use cases → ${KEY}`);
  console.log(`Share: https://tools.blablabuild.com/tools/ai-matrix?s=${SESSION_ID}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
