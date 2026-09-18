/** Level 2 Claude cases — stored in session meta. */

import { DEPT_COLORS } from './types';

export type ClaudeLevel2Status = 'shell' | 'drafting' | 'ready';

/** Bump when seed briefs change — refreshes shell/drafting copy, keeps ready cases. */
export const LEVEL2_SEED_VERSION = 19;

export const CROSS_TEAM_OPTIONS = Object.keys(DEPT_COLORS).filter((d) => d !== 'General');

export interface ClaudeLevel2Draft {
  level1CaseId: string;
  title: string;
  recap: string;
  idea: string;
  instructions: string;
  presentationExpect: string;
  crossTeams: string[];
  /** Empty until we attach a prioritized project. */
  prioritizeReuse: string;
  /** Hide the level 2 card + arrow (e.g. pending a team connect). */
  hideLevel2?: boolean;
  /** Team skipped Level 1 presentations — this is their first case, at Level 2. */
  startsAtLevel2?: boolean;
  status: ClaudeLevel2Status;
  seedVersion?: number;
  updatedAt?: string;
}

export interface ClaudeLevel2State {
  drafts: Record<string, ClaudeLevel2Draft>;
}

type Seed = Omit<ClaudeLevel2Draft, 'status'> & { status?: ClaudeLevel2Status };

export const LEVEL2_SEEDS: Record<string, Seed> = {
  s01zg1dt: {
    level1CaseId: 's01zg1dt',
    title: 'BI-injected activation pack',
    recap:
      'The existing skill already drafts personalised partner activation copy in ~5 minutes (MCP). The next gap is better offer/insight data and tracking-link placeholders. A direct BigQuery connection is off the table: Affiliate said the warehouse needs too much business logic to pull and interpret the right slice. That logic sits with the team that owns the dataset — BI / Pricing — not in an Affiliate MCP.',
    idea:
      'Prove the loop, not the platform. Affiliate keeps the activation skill. BI / Pricing (who own the dataset and the business logic) produce one export — a spreadsheet or CSV is enough. Affiliate drops that file into the skill and gets personalised copy plus tracking-link placeholders. Dependent on an export is fine: if the output is good, we have the case. A live BigQuery connection or a smarter injection is the sophisticated follow-up, not this sprint. No Everflow/Telegram send. Stay separate from the weekly partner digest.',
    instructions:
      '1. Package the existing skill if it is still a personal chat: SKILL.md, tone/brand rules, example activation messages that worked, and a must/must-not list.\n\n2. Ask BI / Pricing for one export of the slice Affiliate would actually use (offers, partners, whatever they already know how to pull). A short note of what is in the file is enough — not a warehouse project.\n\n3. Inject that export once. Produce the activation copy + tracking-link placeholders. Tracking links stay as placeholders (or a list already in the export).\n\n4. Confirm the output is something they would send. If yes, the case is proven. Only then do we talk about a more sophisticated data path.',
    presentationExpect:
      'Show that it is possible:\n\n1. The skill folder (or a clear Project) they ran it from.\n2. The export BI provided — file is enough.\n3. The copy + tracking-link placeholders from that same file.\n4. A yes/no: would we send this? If yes, we proved the case. If no, what one change to the export or the skill would make it sendable.\n\nOut of scope this sprint: Affiliate connecting BigQuery, custom APIs, live injection, sending via Everflow/Telegram, merging with the weekly digest. Those are the sophisticated next step after a successful proof.',
    crossTeams: ['BI / Pricing'],
    prioritizeReuse: '',
    status: 'ready',
  },
  '6wwxlvke': {
    level1CaseId: '6wwxlvke',
    title: 'Historic send archive, then thin the skill',
    recap:
      'The existing skill already writes flirting-message variants from a short brief, tone rules, and a compliance checklist. Continuously enriching it cut the feedback a new chat needed. What is still hard: wording can sound unnatural, chats drift and forget what worked, and they still do not know what actually triggers the audience. The presentation already named the counters — a glossary, historic posts, a tighter tone, fewer ambiguous emojis — and left Ongage performance data as a later ambition. More hard-coded rules will not fix quality; the last enrich-the-skill pass already showed that.',
    idea:
      'Prove the archive can carry tone and vocabulary — not that Ongage is connected. Sit with BI / Pricing and copy their knowledge-center pattern. Load thousands of historic sent emails so the project knows what good looks like (tone, vocabulary, variation). Run a real brief against that. Then the interesting test: run the same brief with limited skill instructions, because the written rules may be fighting the artifacts. Keep only the guardrails the archive cannot carry (compliance must-nots). Rebalance after you see which pack you would send. An export of sent mail is enough. Ongage MCP and live performance data are the sophisticated follow-up, not this sprint.',
    instructions:
      '1. Sit with BI / Pricing and copy how their knowledge-center folder is set up. A walkthrough or a copy of the folder structure — not a shared Claude login.\n\n2. Dump a large historic send archive into that folder (thousands if the export exists). Light tags are enough (GEO, platform, “this one was good”). Do not spend the sprint cleaning the corpus.\n\n3. Run one real brief + recipient context through the richer project. Compare it to a run without the archive.\n\n4. Then the test: duplicate the skill with limited instructions — keep compliance must-nots, cut tone / vocabulary / emoji rules the archive should already teach. Same brief, same archive. See which pack you would send, and which written rules were fighting the examples.',
    presentationExpect:
      'Show that it is possible:\n\n1. The knowledge-center folder, and that you set it up after sitting with BI / Pricing.\n2. The historic send archive is in there — scale matters (hundreds or thousands, not a handful of favourites).\n3. One variant pack from the enriched project.\n4. The thin-instructions test: same brief, two packs, which you would send, and one rule you deleted because it conflicted with the archive.\n5. A yes/no: is the language more natural / on-brand than before the archive went in? If yes, the case is proven.\n\nOut of scope this sprint: Ongage MCP, live performance data, writing messages back into Ongage, audience-trigger analytics. Those come after a successful proof.',
    crossTeams: ['BI / Pricing'],
    prioritizeReuse: '',
    status: 'ready',
  },
  mu3ctc3n: {
    level1CaseId: 'mu3ctc3n',
    title: 'Pending a connect with Finance',
    recap:
      'The existing skill was scoped as a P&L budget-vs-actual brief: drop a period export, get material variances, anomalies, and follow-up questions. Grounded in a fixed export format, the chart of accounts, and example briefs — no live ERP. Roy owns it. There is no presentation debrief yet, and we have not sat with Finance to see what they actually built.',
    idea:
      'Do not invent the next case from the original brief. First connect with Finance, look at the skill or project they have now, and only then lock what level 2 should prove. Until that conversation, this stays a shell.',
    instructions:
      '1. Sit with Finance (Roy). Open whatever they have — skill folder, Claude Project, or a chat they still run from. Watch one real period export go through it if they have one.\n\n2. Write down what actually works, what they still do by hand, and whether they want a harder case at all.\n\n3. Only after that connect: rewrite this brief. Same rule as the other teams — prove it is possible, an export is enough, no ERP or live books this sprint.',
    presentationExpect:
      'Nothing to present yet. After the connect we replace this shell with a locked brief — recap of what they built, the level 2 idea, thought-starters, and what the next presentation should show.',
    crossTeams: [],
    prioritizeReuse: '',
    hideLevel2: true,
    status: 'shell',
  },
  bcutgw41: {
    level1CaseId: 'bcutgw41',
    title: 'Trust the pack, then localise it',
    recap:
      'The existing project already produces a strategy, a creative concept, and assets for a campaign — and they have run that from historical performance of other campaigns. Setup is there: context docs and skill instructions. What is still open is trust. A media buyer should not have to rewrite the strategy before it is useful. The debrief named three next moves: nail quality until they trust it, enhance it with performance data of high-performing campaigns, and translate a generic pack to different target audiences — not only a market, but demographic segments within that market. Visual recognition in a live performance dashboard — seeing what works by looking at the creatives — is the hard leftover, not this sprint.',
    idea:
      'Prove they would brief or launch from the pack — not that a dashboard is connected. Keep the existing skill. First, raise quality until a media buyer trusts the strategy and creative without rewriting it. Then drop in artefacts from high-performing campaigns (an export or a folder of winners is enough) and see if the next pack is sharper. Then take one generic pack and localise it for different target audiences: a market, and demographic segments inside that market. If those three hold, the case is proven. Live dashboard vision and visual recognition of winning ads are the sophisticated follow-up.',
    instructions:
      '1. Nail the quality of the strategic and creative output until you trust it. Run real offers through the existing project. Write back what a media buyer overrode. Stop when someone would brief creative — or launch — from the pack without rewriting the strategy.\n\n2. Enhance it with performance data of high-performing campaigns. A spreadsheet, export, or folder of winner packs is enough. Do not wait for a live dashboard. Ask: is the next pack actually better once those winners are in the project?\n\n3. Translate one generic strategy and creative towards different target audiences — not only a market (geo), but demographic segments within that market. Same offer, two or more audience cuts. Would a buyer run each version as-is?',
    presentationExpect:
      'Show that it is possible:\n\n1. A pack a media buyer would actually use — strategy, concept, and (if you already do this) assets — without rewriting the strategy.\n2. The winner-campaign artefacts you added, and one pack run after they went in.\n3. Localised versions of the same pack: at least one market, and two demographic segments inside it.\n4. A yes/no: would you brief creative or launch from these? If yes, the case is proven.\n\nOut of scope this sprint: live performance dashboards, visual recognition of winning ads, network MCP launch, becoming a creative studio. Those come after a successful proof.',
    crossTeams: [],
    prioritizeReuse: '',
    status: 'ready',
  },
  yluy9f0i: {
    level1CaseId: 'yluy9f0i',
    title: 'Package the skill, then interview prep',
    recap:
      'The existing chat already showed that Claude can filter CVs against a role and raise strengths and concerns. It worked. It is not useful as a live hiring desk right now: there are no open roles and not enough applicants to run it on real volume. GDPR is still a question (what they may put into Claude). The presentation already named the next useful move — not a harder filter, but preparing the interview from the same candidate data, including culture and soft-skill questions.',
    idea:
      'First make the existing work a real skill, not a chat. Package it: SKILL.md, the scorecard / must-haves, example CVs they already used, and a shortlist that felt right. Then grow that same skill so a shortlisted candidate also gets an interview kit — questions, what to probe, culture and soft-skill angles — using notes they already have about the profile and the company. Prove it on one past or hypothetical applicant. No TeamTailor, no LinkedIn, no live ATS. Volume hiring can wait until they actually hire.',
    instructions:
      '1. Package the chat first. If this still lives in a session, turn it into a skill folder: SKILL.md, the role/scorecard they used, two example CVs, and one shortlist they would stand behind. A colleague should be able to run a dry screen from the files alone.\n\n2. Add interview prep to that same skill. For each shortlisted candidate: tailored questions, what to probe, and a few culture / soft-skill angles grounded in what the company is looking for. Company/culture notes they already have are enough — do not build a handbook product here.\n\n3. Run it once on a past or made-up applicant (they are not hiring). Filter, then produce the interview kit. Ask: would an interviewer walk in with this?\n\n4. Keep CVs as paste or export in their own Claude project. No TeamTailor dump, no live ATS, no sharing candidate files outside HR.',
    presentationExpect:
      'Show that it is possible:\n\n1. The skill folder — not the original chat — on screen.\n2. A shortlist from the existing filter (one past or hypothetical pack is enough).\n3. The interview kit for 1–2 of those candidates.\n4. A yes/no: would an interviewer walk in with this? If yes, the case is proven.\n\nOut of scope this sprint: live hiring volume, TeamTailor or LinkedIn, a GDPR platform decision, becoming an ATS. Those come after a successful proof — and when there are actual openings.',
    crossTeams: [],
    prioritizeReuse: '',
    status: 'ready',
  },
  bidqcl01: {
    level1CaseId: 'bidqcl01',
    title: 'Grow the investigation knowledge center',
    recap:
      'The existing skill already helps triage “this Looker number looks wrong”: hypotheses, draft SQL, next checks — without a live database. Fernanda set up a local knowledge base that gets richer each time Claude handles an incident in the data team’s business context. The presentation marked two growth points: keep enriching it over time, and speed that up by pulling in the data team’s existing incident-handling knowledge.',
    idea:
      'Prove that the knowledge center can grow on purpose — not by hoping chats get smarter. First, fold the team’s incident-handling notes into the project (examples, typical breaks, what “good” looks like). Then keep the ritual: after each ticket, write one thing back into the folder. That is the product. If it works, this becomes the pattern Email can copy, and the same team can produce one export for Affiliate’s activation pack. A live BigQuery or Looker connection is the sophisticated follow-up, not this sprint. An export or pasted ticket is enough to prove it.',
    instructions:
      '1. Sit with the data team and pull in the incident-handling knowledge they already have. One working session. Dump it into the folder — do not rebuild it as a platform.\n\n2. Run one real ticket through the richer project. Write back what Claude got right or wrong. That single write-back is the enrichment loop you wanted to expedite.\n\n3. Optional facilitation, if there is time: walk email marketing through how the folder is set up so they can copy the pattern, or produce one export Affiliate can drop into their activation skill. File hand-off is enough.',
    presentationExpect:
      'Show that it is possible:\n\n1. The knowledge-center folder (or Project) — including the incident-handling notes you pulled in.\n2. One real ticket run after that enrichment, plus the one thing you wrote back.\n3. A yes/no: is the output better than before the team knowledge went in? If yes, the growth loop is proven.\n4. If you facilitated anyone: the file or walkthrough you gave email marketing or Affiliate.\n\nOut of scope this sprint: live BigQuery/Looker, custom APIs, becoming the company data desk. Those come after a successful proof.',
    crossTeams: ['E-mail Marketing', 'Affiliate Management'],
    prioritizeReuse: '',
    status: 'ready',
  },
  zvnakelf: {
    level1CaseId: 'zvnakelf',
    title: 'Package, share, and run the Voluum skill',
    recap:
      'Ad Ops built a geo × zone flow playbook. They connected the Voluum MCP — no longer CSV-only — and it ran ~50% faster than the manual process. Voluum AI still disagrees with operator EPV judgment. The work almost certainly lives on a personal Claude account. We are not sure they have a proper skill folder (SKILL.md, rules, examples). Other teams cannot see that chat.',
    idea:
      'Level 2 is not a deeper Voluum integration. It is making the existing skill real: first a proper skill folder; then share the whole project; then run one week with another team via a file (not a shared login); then confirm operators would defend the output. Voluum MCP stays with Ad Ops. No write-back.',
    instructions:
      '1. Audit the setup. If there is no folder with SKILL.md, operator/EPV rules, and at least two example weeks (including where you overrode Voluum AI), build that first. A colleague should be able to run a dry week from the files alone — not from the original chat history.\n\n2. Share the project with everything it includes. Claude Team Project invite, or export the folder to Drive/git. A second Ad Ops person must open it and run the skill once.\n\n3. Operate with another team. Run one live week via Voluum MCP. Write a markdown pack: recommended splits, where Voluum AI disagrees and why. Post the file. Media Buying and Affiliate upload it into their own Claude Projects. They never get Voluum credentials.\n\n4. Confirm quality. Sit with an operator on that same week. Mark each call agree / override / why. Write overrides back into the examples folder so the skill gets smarter.',
    presentationExpect:
      'Show four things — one per step:\n\n1. The folder (SKILL.md, rules, examples) on screen.\n2. Who else in Ad Ops can open the same project and run it.\n3. The pack that went to Media Buying and/or Affiliate, plus one reaction from that team (they used it, or they said why not).\n4. The agree/override score on a real week, and at least three written “why we disagree with Voluum AI” lines.\n\nOut of scope: pushing changes back into Voluum, or giving another department the Voluum MCP.',
    crossTeams: ['Media Buying', 'Affiliate Management'],
    prioritizeReuse: '',
    status: 'ready',
  },
  '24lddyfa': {
    level1CaseId: '24lddyfa',
    title: 'Catch cold new offers in Everflow',
    recap:
      'Account Management did not run a Level 1 case with the other teams. The workshop item is still the job: when a new offer is uploaded and sent to media buyers, it sometimes sits untested. Nobody has a reliable view of which new offers actually pick up traffic, so they slip. There is no Claude project or skill for this yet.',
    idea:
      'This is their first Claude case, at Level 2. First, set up the same foundational Project + skill the other teams already have (SKILL.md, rules, examples). Then connect Everflow MCP — read, not write — and have the skill list offers younger than X days that are generating traffic below Y. They pick both thresholds (workshop default: first week, very low traffic). Prove they would actually chase that list this week. Auto-reminders, Slack/Telegram send, and Everflow write-back are the sophisticated follow-up, not this sprint.',
    instructions:
      '1. Create a Claude Project for Account Management offer follow-up. Package a skill folder: SKILL.md, what “new” means (default 7 days — they set X), what “low traffic” means (they set Y clicks/conversions), who gets flagged (AM + the media buyer on the offer), and a fixed output template (offer id, name, age, traffic, why it looks cold, suggested next step).\n\n2. Drop in 2–3 offers that slipped and 2–3 that were tested promptly, so the skill knows what forgotten vs picked-up looks like.\n\n3. Connect Everflow MCP with the access they already have. Filter: created within X days AND traffic below Y. No write-back. A CSV export is a fallback only if MCP is blocked — the case is the live filter.\n\n4. Run it on a real slice of new offers. Produce the follow-up pack. Ask: would we chase these this week? If yes, the case is proven.',
    presentationExpect:
      'Show that it is possible:\n\n1. The Project + skill folder (SKILL.md, X/Y thresholds, examples) on screen.\n2. Everflow MCP connected — not a spreadsheet as the main path.\n3. One live (or recent) run: offers younger than X days with traffic below Y.\n4. A yes/no: would Account Management actually follow up this list? If yes, the case is proven.\n\nOut of scope this sprint: writing back to Everflow, auto-sending reminders, a live dashboard, becoming the offer desk. Those come after a successful proof.',
    crossTeams: ['Media Buying'],
    prioritizeReuse: '',
    startsAtLevel2: true,
    status: 'ready',
  },
};

export function seedDraft(level1CaseId: string): ClaudeLevel2Draft {
  const seed = LEVEL2_SEEDS[level1CaseId];
  if (!seed) {
    return {
      level1CaseId,
      title: 'Level 2 — to be scoped',
      recap: '',
      idea: '',
      instructions: '',
      presentationExpect: '',
      crossTeams: [],
      prioritizeReuse: '',
      status: 'shell',
      seedVersion: LEVEL2_SEED_VERSION,
    };
  }
  return {
    ...seed,
    status: seed.status ?? 'shell',
    seedVersion: LEVEL2_SEED_VERSION,
  };
}

export function mergeLevel2Draft(
  level1CaseId: string,
  saved?: ClaudeLevel2Draft
): ClaudeLevel2Draft {
  const base = seedDraft(level1CaseId);
  if (!saved) return base;
  const staleSeed = (saved.seedVersion ?? 0) < LEVEL2_SEED_VERSION;
  const savedLoose = saved as ClaudeLevel2Draft & { problem?: string; solution?: string };
  return {
    ...base,
    ...saved,
    recap: saved.recap || savedLoose.problem || base.recap,
    idea: saved.idea || savedLoose.solution || base.idea,
    instructions: saved.instructions ?? base.instructions,
    presentationExpect: saved.presentationExpect ?? base.presentationExpect,
    crossTeams: Array.isArray(saved.crossTeams) ? saved.crossTeams : base.crossTeams,
    prioritizeReuse: saved.prioritizeReuse ?? base.prioritizeReuse,
    hideLevel2: base.hideLevel2,
    startsAtLevel2: base.startsAtLevel2,
    level1CaseId,
    seedVersion: staleSeed ? LEVEL2_SEED_VERSION : (saved.seedVersion ?? LEVEL2_SEED_VERSION),
    ...(staleSeed
      ? {
          title: base.title,
          recap: base.recap,
          idea: base.idea,
          instructions: base.instructions,
          presentationExpect: base.presentationExpect,
          crossTeams: base.crossTeams,
          prioritizeReuse: base.prioritizeReuse,
          status: base.status,
        }
      : {}),
  };
}

export function inferStatus(draft: ClaudeLevel2Draft): ClaudeLevel2Status {
  if (draft.status === 'ready') return 'ready';
  if (draft.status === 'drafting') return 'drafting';
  if (draft.updatedAt) return 'drafting';
  return 'shell';
}

const LS_KEY = (sessionId: string) => `ai-matrix-claude-l2:${sessionId}`;

export async function loadClaudeLevel2(sessionId: string): Promise<ClaudeLevel2State> {
  let local: ClaudeLevel2State = { drafts: {} };
  try {
    const raw = window.localStorage.getItem(LS_KEY(sessionId));
    if (raw) local = JSON.parse(raw) as ClaudeLevel2State;
  } catch {
    local = { drafts: {} };
  }
  try {
    const res = await fetch(`/api/matrix-sessions/${sessionId}`);
    const data = await res.json();
    const remote = (data.meta?.claudeLevel2 as ClaudeLevel2State | undefined) || null;
    return {
      drafts: { ...(local.drafts || {}), ...(remote?.drafts || {}) },
    };
  } catch {
    return local;
  }
}

export async function saveClaudeLevel2(
  sessionId: string,
  next: ClaudeLevel2State
): Promise<ClaudeLevel2State> {
  try {
    window.localStorage.setItem(LS_KEY(sessionId), JSON.stringify(next));
  } catch {
    // ignore quota
  }
  try {
    await fetch(`/api/matrix-sessions/${sessionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'meta', meta: { claudeLevel2: next } }),
    });
  } catch {
    // local already written
  }
  return next;
}
