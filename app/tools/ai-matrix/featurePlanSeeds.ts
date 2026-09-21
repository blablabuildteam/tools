import type { FeatureRequest, ProjectPlan } from './projectPlanTypes';

/**
 * Relative effort for developed High projects (calendar weeks, see EFFORT_WEEKS).
 * Ranked against each other — not against the rest of the backlog.
 * Bump FEATURE_EFFORT_SEED_VERSION when these change so saved sessions refresh.
 */
export const FEATURE_EFFORT_SEED_VERSION = 2;

/** Bump to overwrite saved Prioritize briefs from FEATURE_PLAN_SEEDS. */
export const FEATURE_PLAN_SEED_VERSION = 1;

export const FEATURE_EFFORT_SEEDS: Record<string, FeatureRequest['effort']> = {
  /** Already proven Claude loop; remaining work is a connect + maybe sharing the laptop knowledge center. */
  '5wq983os': 'xs',
  /** Package a working chat into a skill + culture pack + one dry-run interview kit. No ATS. */
  yluy9f0i: 's',
  /** Same Looker-desk pattern as MB reporting, second surface (CPM grain). Stays M if sequenced after that stack. */
  '52k9ejik': 'm',
  /** Welcome desk: Everflow + Telegram + review-then-send. One message type; no auto-send, no reactivation. */
  s01zg1dt: 'm',
  /** First custom Looker desk: one warehouse, dashboard, daily + weekly packs, anomaly agent, Slack, label loop. */
  ytfkqqwj: 'l',
  /** Ongage write-back loop: purpose packs, archive engine, review-then-push, performance into the next brief. One ESP. */
  '6wwxlvke': 'l',
  /** Kill Sheets: ledger + permissions + mapping + first API batch + manual remainder + packs. 24 connectors is a programme. */
  ldfa53nk: 'xl',
  /** Closed creative cycle: live dashboard + visual recognition of winning ads + Banana/MJ in-flow. Longest R&D pole. */
  bcutgw41: 'xl',
};

/** Default briefs for high Prioritize projects — session edits still win when filled. */
export const FEATURE_PLAN_SEEDS: Record<string, ProjectPlan> = {
  yluy9f0i: {
    problemStatement:
      'HR still screens by hand: hours on CVs and cover letters, then a second pass to invent interview questions. The first pass is a hard-skill compare against the public job ad — work a candidate can prep the same way. Adsomnia’s actual edge is private: culture, how this department works, and who is already on the team. That context never makes the interview kit today, so interviews re-test the website posting instead of zooming in on soft skills. The Claude proof already filters CVs; it still lives as a chat and stops at the shortlist. They are not hiring at volume. GDPR is still open.',
    opportunity:
      'One packaged hiring skill. Same run: score CVs and covering letters against the role on the site (hard skills), then load Adsomnia culture and current team/department notes so the interviewer walks in with questions a candidate cannot reverse-engineer from the job page. Soft skills and culture fit are the interview, not a side prompt. Later, when they hire for real, the same skill can take Enneagram (or similar) profiles of people already on the team and hire into the gaps that would boost synergy — that is scale, not this pack.',
    solutions:
      'Keep this in Claude. Package the chat into a skill folder (SKILL.md, scorecard, example CVs/cover letters, a shortlist they stand behind) and put culture + current-team notes in the same folder. Hard-skill match vs the public posting is the floor. The interview kit is weighted to soft skills, culture, and how they would sit with this team/department. Cover letters stay first-class. Do not split interview prep onto another chip. Do not build a handbook product or an ATS. Prove on one past or hypothetical applicant. Enneagram team-gap hiring is written as a later slice, not collected in this sprint.',
    functionalities: [
      {
        id: 'fn-skill-pack',
        title: 'Packaged skill, not a chat',
        description:
          'SKILL.md, the role/scorecard they used, two example CVs plus cover letters, and one shortlist they would stand behind. A colleague can run a dry screen from the files alone.',
      },
      {
        id: 'fn-hard-skill-screen',
        title: 'Hard-skill fit vs the public role',
        description:
          'Compare pasted/exported CVs and covering letters to the job opportunity as it sits on the website (must-haves / nice-to-haves). This is the consistent first pass — necessary, but not the interview.',
      },
      {
        id: 'fn-compare-shortlist',
        title: 'Comparable shortlist',
        description:
          'Who made the hard-skill cut, why, and what raised concerns. Strengths and gaps side by side so the hiring call is not a gut stack of PDFs.',
      },
      {
        id: 'fn-culture-team',
        title: 'Adsomnia culture and current team context',
        description:
          'Private notes on culture, how this department works, and who is already on the team. This is the edge: a candidate can prep the JD; they cannot prep how Adsomnia actually operates. Not a handbook Q&A product — a short pack HR already has.',
      },
      {
        id: 'fn-soft-skill-kit',
        title: 'Soft-skill interview kit (the actual interview)',
        description:
          'For each shortlisted candidate: questions and probes that zoom in on culture fit, collaboration, and how they would sit with this team — not a recap of hard skills they (and we) can already score from the application. The interviewer walks in with Adsomnia’s advantage.',
      },
      {
        id: 'fn-hr-only-input',
        title: 'HR-owned paste/export',
        description:
          'CVs stay in their own Claude project. No TeamTailor dump, no LinkedIn scrape, no sharing candidate files outside HR. GDPR stays a policy call, not a platform build.',
      },
      {
        id: 'fn-enneagram-later',
        title: 'Later: team Enneagram / synergy gaps',
        description:
          'Once the skill is trusted, optionally support it with Enneagram (or similar) profiles of people on the current team so hiring can target gaps that boost synergy. Scale opportunity only — do not collect personality profiles in this sprint.',
      },
    ],
    expectedImpact:
      'Shortlists stay consistent on hard skills. Interviews stop re-testing the job ad and start testing culture and soft skills, where Adsomnia actually has an information advantage. Same skill, one motion. No ATS while volume is low. A clear later path to team-gap / Enneagram hiring when they scale.',
    businessValue:
      'HR judgement on the things a CV cannot show. Interviewers walk in better prepared than the candidate, because culture and team context are not public. Avoids a hiring product they do not have openings to fill. Leaves a synergy-hiring option for when teams grow.',
    technicalApproach:
      'Claude Project / skill folder owned by HR (Laia). Inputs: public JD + scorecard, pasted CVs/cover letters, culture and current team/department notes. Outputs: hard-skill comparison, shortlist, soft-skill/culture interview kit. No TeamTailor, LinkedIn, or Personio API. Handbook Q&A stays a sibling. Enneagram profiles are out of this pack. Prove on one past or made-up applicant until they are hiring.',
    targetAudience: [
      'HR (Laia and whoever runs a dry screen)',
      'Hiring managers / interviewers using the kit',
      'Current team leads whose department context feeds the kit',
      'Not candidates — they never see this tool',
    ],
    risks: [
      'GDPR: what candidate data may go into Claude. Until decided, use past or hypothetical packs, not live applicants.',
      'Bias: scorecards and culture notes must be reviewed; the skill should surface concerns, not hide them.',
      'Culture notes that are vague will produce generic “culture fit” questions — the pack has to name how this team actually works.',
      'Hard-skill questions will creep back into the kit if the prompt is not explicit that the interview zooms in on soft skills.',
      'Enneagram / personality profiling of current staff is sensitive and optional later — collecting it now would stall the proof.',
      'Not hiring now — proof is a dry run, not a live desk.',
      'Do not become an ATS. Volume, TeamTailor, LinkedIn, and synergy-gap hiring come after a successful proof.',
    ],
    dependencies: [
      'Existing successful Claude run (filter + strengths/concerns) as the seed.',
      'The public job opportunity / scorecard for the hard-skill pass.',
      'Written Adsomnia culture notes plus current team/department context (who is on the team, how they work).',
      'Two example CVs + cover letters and one shortlist they stand behind.',
      'HR-only Claude project; candidate files not shared outside HR.',
      'GDPR call before live applicant files go in.',
      'Enneagram (or similar) profiles of current teammates — only if/when they choose the later scale slice.',
    ],
  },

  ytfkqqwj: {
    problemStatement:
      'Leadership opened a Looker Studio and still walk it by hand to find what moved. Media buying does the same hunt for daily performance. Anomalies get missed because a person cannot see every geo, buyer, and campaign every morning. Workshop chips split this into a reporting pack (ScaleWizard + Claude) and a separate performance-drop alarm. ScaleWizard is only one feeder into Studio. Pasting exports into Claude cannot watch the feed, cannot hold two cadences, and cannot learn from “this did / did not matter.” Ad Ops CPM reporting is a sibling desk, not this product.',
    opportunity:
      'One custom product on the dataset that already feeds Looker Studio — Adsomnia owns it; that is the only integration. A trained agent consumes that feed, spots the anomalies that matter, and writes thorough analysis. Media buying gets a daily pack; leadership gets a weekly pack. Slack fires when something needs a human now. Performance drop alarming lives here, not as a second app. Financial MB reporting is a sibling High (Sheets → a custom ledger), not this product.',
    solutions:
      'Build a custom app, not a Claude skill. Claude cannot sit on a live feed, cannot schedule two audience cadences, cannot push Slack, and cannot keep a durable feedback loop of what leadership and buyers marked as noise vs signal. Custom is required because the job is operational: always-on read of their warehouse, a dashboard they actually open, an agent that compounds on labelled anomalies, and alerts without opening a chat. Connect once to the Looker Studio underlying dataset. Do not reconnect ScaleWizard, Voluum, or ad networks — those already land in Studio. Start with a one-off with MB and leadership to write “what matters”; then every pack and alert can be marked useful or not so the agent trains.',
    functionalities: [
      {
        id: 'fn-looker-feed',
        title: 'One integration: the Studio feed',
        description:
          'Read the Adsomnia-owned dataset that powers Looker Studio. No second pipes to ScaleWizard, trackers, or networks. Studio stays the BI they already trust; the desk reads what it already sees.',
      },
      {
        id: 'fn-custom-dashboard',
        title: 'Custom dashboard (why not Claude)',
        description:
          'A persistent UI for MB and leadership. They stop clicking through Studio to reconstruct the story. Claude paste cannot be that desk: no shared login surface, no scheduled packs, no alert history, no labelled-anomaly memory.',
      },
      {
        id: 'fn-mb-daily',
        title: 'Daily pack for media buying',
        description:
          'What moved, what to deep-dive, which anomalies need a buyer today. Cadence and grain are tuned with the MB team in the definition workshop.',
      },
      {
        id: 'fn-leadership-weekly',
        title: 'Weekly pack for leadership',
        description:
          'What actually mattered this week — not a dump of every metric. Structure agreed with leadership so they stop Studio archaeology.',
      },
      {
        id: 'fn-anomaly-agent',
        title: 'Trained anomaly + analysis agent',
        description:
          'Consumes the full feed, flags outliers humans miss, and writes the analysis behind each flag. Thorough, not a threshold dashboard they already have in Studio.',
      },
      {
        id: 'fn-slack-alerts',
        title: 'Slack alerts (absorbs performance drop alarming)',
        description:
          'Push when performance drops or an anomaly needs a human before the next daily/weekly pack. Same agent, same definitions — not a parallel alarming product.',
      },
      {
        id: 'fn-define-matters',
        title: 'One-off: define what matters',
        description:
          'Workshop with media buying and leadership: metrics, grains, “this is an anomaly,” “this is noise.” Until that exists, the agent has nothing to be trained on.',
      },
      {
        id: 'fn-feedback-loop',
        title: 'Feedback cycle back to the agent',
        description:
          'On each pack and alert, they mark why it did or did not matter. That label trains the next run. This is the compounding loop Claude sessions cannot keep as a product.',
      },
    ],
    expectedImpact:
      'Hours back from Studio click-through. Daily focus for buyers; weekly sense for leadership. Anomalies that used to hide in the volume get raised in Slack. Alarming and reporting are one system, trained on the same “what matters” rules.',
    businessValue:
      'Wasted spend caught earlier. Buyers optimize instead of reconciling dashboards. Leadership sees a narrative, not a Looker tab. Custom product is justified: always-on data, two cadences, Slack, and a training loop — none of which a Claude project can own.',
    technicalApproach:
      'Custom app. Single read of the warehouse/dataset behind Looker Studio (Adsomnia-owned). Dashboard + scheduled daily MB / weekly leadership jobs + anomaly agent + Slack. Definition workshop before the agent is trusted. Human labels (mattered / noise + why) write back into training. No ScaleWizard, Voluum, or network APIs. No Claude as the runtime. Financial MB reporting is out of this codebase.',
    targetAudience: [
      'Media buying team (daily pack + Slack)',
      'Adsomnia leadership (weekly pack + material Slack)',
      'Not Finance — financial MB reporting is a later project',
    ],
    risks: [
      'Studio’s UI is not the API — the desk needs stable access to the underlying dataset they own, with an owner for schema changes.',
      'Without the definition workshop, the agent will cry wolf or stay silent. Do not skip it.',
      'Alert fatigue if Slack fires before “what matters” is labelled.',
      'Reconnecting ScaleWizard or trackers would duplicate BI and break the one-integration rule.',
      'Claude as a workaround (export → paste) would look cheap and fail the cadence/alert/training job — do not dual-run it.',
      'Financial MB reporting will try to sneak in as “just another pack.” Keep it a separate project.',
      'Looker Studio itself remaining the click-path if the custom UI is weaker than Studio for exploration — dashboard must answer “what matters,” not clone every chart.',
    ],
    dependencies: [
      'Access to the Adsomnia-owned dataset behind Looker Studio (and a named owner).',
      'Confirmation of tables/metrics already in that Studio (ScaleWizard and others as feeders only).',
      'One-off workshop with MB and leadership: what matters, grains, noise.',
      'Slack workspace and channels for MB vs leadership.',
      'Feedback UI so they can say why an item mattered or not.',
      'Financial MB reporting explicitly parked (ldfa53nk) — do not pull platform Sheets into this desk.',
    ],
  },

  '52k9ejik': {
    problemStatement:
      'Ad Ops already has a Looker Studio for CPMs. They still walk it by hand: scan geo × zone × buyer, notice who dropped, then react. Significant drops get missed until margin has already moved. Two workshop chips described the same job — a daily “what actually matters” pack, and a CPM-drop alert. They were listed as two High projects under Tracker Operations Center. Claude-on-export cannot watch the feed every morning or page Slack when a zone falls over.',
    opportunity:
      'One custom Ad Ops desk, same technical pattern as MB performance reporting: read the Adsomnia-owned dataset behind that Looker Studio (one integration), train an agent on CPM grain, serve a daily pack of what matters, and Slack when CPMs drop per geo/zone/buyer. Automated CPM reporting and drop alerting are one product. Monthly CPM log autofill and TSD/ExAds writes stay other chips. The MB/leadership performance desk stays a sibling — same idea, different audience and metrics.',
    solutions:
      'Custom app, not Claude. Custom is required for the same reasons as the MB desk: always-on read, a dashboard Ad Ops actually opens, scheduled daily reporting, Slack, and a labelled feedback loop of which drops mattered. Connect once to the warehouse feeding the CPM Studio. Do not reconnect Voluum, ExAds, or ScaleWizard for this product. One-off with Ad Ops (and buyers if they own zones) to define “significant drop” and “what matters”; then they mark true/false so the agent trains. If the warehouse is shared with MB reporting, still ship a separate UI — CPM × geo × zone × buyer, not campaign ROI packs.',
    functionalities: [
      {
        id: 'fn-cpm-feed',
        title: 'One integration: the CPM Studio feed',
        description:
          'Read the Adsomnia-owned dataset behind the Looker Studio Ad Ops already click. Feeders (ScaleWizard, trackers) stay in BI. No second platform pipes in this project.',
      },
      {
        id: 'fn-cpm-dashboard',
        title: 'Custom Ad Ops dashboard',
        description:
          'Persistent UI for daily CPM story per geo/zone/buyer. They stop reconstructing it in Studio. Claude paste cannot be this desk.',
      },
      {
        id: 'fn-cpm-daily',
        title: 'Daily “what matters” pack',
        description:
          'Absorbs Automated CPM Reporting: aggregate the feed, say what to deep-dive, not a dump of every cell. Cadence and grain locked with Ad Ops.',
      },
      {
        id: 'fn-cpm-drop-slack',
        title: 'CPM drop Slack alerts',
        description:
          'Absorbs the daily drop report: significant CPM drops per geo/zone/buyer, with enough analysis to act before margin erodes. Same definitions as the daily pack — not a second alerter.',
      },
      {
        id: 'fn-cpm-agent',
        title: 'Trained CPM anomaly agent',
        description:
          'Consumes the full CPM cut, flags drops and odd winners humans miss, writes why. Thresholds from the definition workshop, then refined by labels.',
      },
      {
        id: 'fn-cpm-define',
        title: 'One-off: what is a significant drop',
        description:
          'Sit with Ad Ops: % / absolute / by zone, noise vs action, who gets Slack. Until this exists the agent will either spam or stay quiet.',
      },
      {
        id: 'fn-cpm-feedback',
        title: 'Feedback cycle',
        description:
          'On each pack line and alert: why it did or did not matter. Labels train the next day. Same compounding loop as the MB desk.',
      },
    ],
    expectedImpact:
      'Ad Ops stop Studio archaeology every morning. Drops that used to hide until the weekly TSD fight show up in Slack the same day. One High project instead of two overlapping chips.',
    businessValue:
      'Margin protected earlier. Time back for TSD and flow work. Custom is justified the same way as MB reporting: live feed, dashboard, daily cadence, Slack, training — Claude cannot own that. Separate from MB/leadership packs so Ad Ops get CPM grain, not a generic performance dump.',
    technicalApproach:
      'Custom app. Single read of the dataset behind the CPM Looker Studio. Dashboard + daily job + drop agent + Slack. Definition workshop with Ad Ops. Label write-back. Same architecture as MB performance reporting; different product, metrics, and channels. No Voluum/ExAds write in this project. Monthly CPM log autofill remains a later/low chip unless they later fold the 1st-of-month doc into this pack.',
    targetAudience: [
      'Ad Operations (daily pack + Slack)',
      'Media buyers who own zones (consumers of who is winning CPMs) — not the MB performance desk',
      'Not leadership’s weekly ROI pack — that is MB performance reporting',
    ],
    risks: [
      'Same warehouse as MB reporting could tempt one mega-dashboard. Keep two surfaces or Ad Ops will drown in buyer metrics.',
      '“Significant” undefined → Slack fatigue.',
      'Reconnecting ExAds/Voluum here turns this into TSD optimization (fr8ri4kx), which is a different project.',
      'Monthly CPM log (1gbuvwx4) sneaking in as a must-have document fill — optional later, not v1.',
      'Claude export workaround would skip alerts and training.',
      'Studio remaining the click-path if the UI only clones charts.',
    ],
    dependencies: [
      'Access to the Adsomnia-owned dataset behind the CPM Looker Studio.',
      'Named owner for that schema.',
      'Definition workshop with Ad Ops: drop thresholds, grains, Slack channels.',
      'Slack workspace for Ad Ops.',
      'Feedback UI for mattered / noise.',
      'Clear split from MB performance reporting (ytfkqqwj) even if the warehouse is shared.',
    ],
  },

  '5wq983os': {
    problemStatement:
      'Other teams ping BI every other day: this Looker number looks wrong. That used to be manual SQL/LookML. The team already proved L1: Claude triages from pasted exports and schema docs (hypotheses, draft SQL, next checks — human runs queries). L2 is growing a knowledge center so each incident makes the next one faster. They built that center themselves, including outside Claude. It currently lives locally on one laptop. A custom triage product would rebuild what already works. Live DB/Looker was always the later platform track, not the proof.',
    opportunity:
      'Keep this as a Claude-run skill plus their knowledge center — not a custom app. The only product-shaped gap is that the center is not yet a team asset. A session with the person who built it decides whether to productize the knowledge center (shareable, not a laptop folder) or leave it as their own stack. Text-to-SQL for ad-hoc pulls (pnsh385v) stays a sibling. Do not connect BigQuery/Looker in this project.',
    solutions:
      'No custom solution now. Document and keep the loop they already run: ticket in → Claude + knowledge center → draft investigation → human executes → write one thing back into the center. Fold data-team incident-handling notes in as L2 already asked. After the connect: if the laptop is the risk, package and share the knowledge center (Team project, Drive, git — whatever they already use besides Claude), not a new UI. If they do not want that, this stays an Adsomnia-owned Claude/ops practice — no new product.',
    functionalities: [
      {
        id: 'fn-claude-triage',
        title: 'Claude triage (already proven)',
        description:
          'L1: “this Looker number looks wrong” → likely causes, drafted SQL, next checks. Human runs queries. No live Looker/DB in this project.',
      },
      {
        id: 'fn-knowledge-center',
        title: 'Knowledge center they already built',
        description:
          'Enriched by each incident and by data-team business context. Exists in Claude and outside it. That is the product they have — not a dashboard to clone.',
      },
      {
        id: 'fn-write-back',
        title: 'Write-back ritual',
        description:
          'After each ticket, one thing goes back into the folder so the next triage is sharper. L2 is growing this on purpose, not hoping chats get smarter.',
      },
      {
        id: 'fn-no-custom',
        title: 'Not a custom triage app',
        description:
          'They already run this. Building a custom investigation UI would compete with a working skill and a knowledge center that has not been fully seen yet.',
      },
      {
        id: 'fn-laptop-risk',
        title: 'Laptop is the risk',
        description:
          'The center lives on one machine today. If that person is off, the practice is not a team asset. This is the only reason to talk productization.',
      },
      {
        id: 'fn-connect',
        title: 'Connect, then decide productization',
        description:
          'Workshop with the builder in two days: what the stack actually is, what is Claude vs local, whether to share/productize the knowledge center. No custom build until that call. Live warehouse connection stays later.',
      },
    ],
    expectedImpact:
      'Faster, more consistent “data looks wrong” handling without a new product. After the connect, either a shared knowledge center or a clear “they own it.” Avoids building a custom desk that duplicates Fernanda’s loop.',
    businessValue:
      'BI time stays on judgment, not first-pass hunting. Other teams get a repeatable triage path. A custom build is not the next step until it is clear they even want the center off the laptop.',
    technicalApproach:
      'Claude Project / skill + existing knowledge-center files (owner: Fernanda / BI). Inputs: pasted ticket, schema docs, CSV/export or screenshot. Outputs: hypotheses, draft SQL, next checks, write-back. No Looker API, no BigQuery, no custom app in this pack. Productization options after the connect only: shared Claude Team project, Drive/git copy of the center, backup off laptop. pnsh385v remains separate (ad-hoc SQL from NL, not incident triage).',
    targetAudience: [
      'BI / Pricing (Fernanda and whoever runs triage)',
      'Teams who file “this Looker number looks wrong”',
      'Not a self-serve Looker replacement for the whole company',
    ],
    risks: [
      'Laptop-only knowledge center — bus factor of one until the connect.',
      'Building a custom product before the call would duplicate their stack and waste the meeting.',
      'Live Looker/DB sneaking in as “the real solution” — out of scope until they ask.',
      'Merging Text-to-SQL (ad-hoc pulls) into this chip would blur incident triage vs one-off reporting.',
      'If they already productized outside Claude and do not want help, leave it rather than invent work.',
    ],
    dependencies: [
      'Existing L1 Claude case and L2 knowledge-center practice.',
      'Connect with the builder (scheduled ~two days out).',
      'Access to see what lives on the laptop vs in Claude — only with their agreement.',
      'Data-team incident-handling notes to fold in (L2).',
      'Explicit go/no-go on productizing the knowledge center after that conversation.',
    ],
  },

  ldfa53nk: {
    problemStatement:
      'Every cycle someone walks ~24 ad platforms, copies numbers into a fixed Google Sheet, then MB/Finance rebuild a repetitive financial pack. One buyer already fills a P&L doc per media buyer every day (the daily-stats chip). Sheets break, mappings drift, and the report dumps everything instead of what matters. Claude-on-export cannot be the ledger, cannot permission several operators, and cannot replace the Sheet as system of record.',
    opportunity:
      'Kill Sheets. One custom ledger with the same template they already use. Pull via API where possible (map/normalize each source into one schema); leave the rest as the same manual fill they do today, but in the ledger UI. Then the Looker-desk pattern: define what matters, automated packs, Slack when something is off. Daily stats autofill is this product’s entry path, not a second project. Campaign Looker reporting and Roy’s company P&L stay siblings.',
    solutions:
      'Custom app: permissions for multiple operators; template entry UI; per-platform API connectors with explicit field mapping into one normalized ledger; manual rows for sources without API (TrafficBar, TwinRed, Taboola/Outbrain/MGID, etc. until connected). Existing Harlem Next BQ / ScaleWizard inventory is a starting list of what already has an API, not the product. Reporting agent + Slack on the ledger. No Google Sheet write-back. No live Looker Studio pipe in this project — that is MB performance reporting.',
    functionalities: [
      {
        id: 'fn-kill-sheets',
        title: 'Sheets die; the template is the ledger',
        description:
          'The current fixed Google Sheet is the schema the ledger implements. Operators never paste into Sheets again. Optional export later if someone insists on a file; the ledger is the system of record.',
      },
      {
        id: 'fn-template-ui',
        title: 'Template entry UI',
        description:
          'Same shape as today’s sheet: API-filled cells locked/normalized, remaining platforms typed in by hand like now. Several people operate it.',
      },
      {
        id: 'fn-permissions',
        title: 'Bespoke user permissions',
        description:
          'Multiple operators. Who can enter whose buyer, who can see Finance-only cuts, who can approve a mapping change. Not a shared Sheet link.',
      },
      {
        id: 'fn-api-map',
        title: 'API pull + per-source mapping',
        description:
          '~24 platforms today. Connect where an API exists (workshop already listed Exo, TJ, Adnium, TrafficStars, … into HN BQ; Meta via ScaleWizard soon). Each connector has a mapping into the ledger template. Unmapped fields stay visible, not silently dropped.',
      },
      {
        id: 'fn-manual-remainder',
        title: 'Manual fill for no-API sources',
        description:
          'CrakRevenue-style CPC maths, Taboola/Outbrain/MGID, TrafficBar, TwinRed, etc. stay human-entered in the same UI until an API exists. That is how Sheets work today — v1 does not wait for 24 connectors.',
      },
      {
        id: 'fn-fin-agent',
        title: 'What-matters financial packs',
        description:
          'Same pattern as Looker desks: one-off with MB/Finance on what actually matters, then automated packs instead of a repetitive dump of the whole sheet.',
      },
      {
        id: 'fn-fin-slack',
        title: 'Slack on the ledger',
        description:
          'Alert when a mapping fails, a manual row is late, or a figure looks off vs the rules they labelled. Feedback: this mattered / noise.',
      },
      {
        id: 'fn-daily-entry',
        title: 'Absorbs daily P&L autofill',
        description:
          'The “one buyer fills every P&L doc every day” job is this desk’s cadence, not a tracker-export Claude skill.',
      },
    ],
    expectedImpact:
      'Hours of platform-hopping and Sheet repair gone. APIs fill what they can; humans only type what they must. Reports say what matters. Several operators without a fragile shared Sheet.',
    businessValue:
      'Fewer errors than copy-paste across 24 UIs. Financial MB packs on a real ledger. Custom is required: connectors, mapping, permissions, scheduled packs, Slack — Claude paste of a Sheet cannot do that. Separate from campaign Studio so Finance numbers are not mixed into performance click-through.',
    technicalApproach:
      'Custom app. Canonical template = today’s Sheet columns. Inbound: REST/partner APIs with a mapping table per source; reuse existing HN BQ extracts where that is already the pipe, without making BQ the product. Manual entry for the rest. AuthZ per operator/buyer. Reporting agent + Slack. No Sheets. No ERP. No Looker Studio. No merge with mu3ctc3n (company budget-vs-actual). Connector rollout is phased: v1 = template + permissions + first API batch + manual remainder + packs; more APIs as mappings land.',
    targetAudience: [
      'Media buyers / the operators who currently fill the Sheet and daily P&L docs',
      'Finance consumers of the MB financial pack',
      'Not leadership’s Looker weekly, not Roy’s company P&L skill',
    ],
    risks: [
      '24 APIs is a programme. If v1 waits for all of them, Sheets never die. Ship template + manual + first API batch.',
      'Bad mappings silently wrong the ledger — mappings must be reviewable and versioned.',
      'HN BQ / ScaleWizard as a hidden second system of record. They are sources; the custom ledger is the system of record.',
      'Permissions too coarse → buyers see each other’s P&L; too fine → nobody can operate.',
      'Merging this into Looker performance reporting would mix campaign anomalies with financial entry.',
      'Finance company P&L (mu3ctc3n) sneaking in chart-of-accounts / ERP.',
      'A leftover Sheet “just for backup” becoming the real workflow again.',
    ],
    dependencies: [
      'A copy of the current fixed Sheet template (columns, per-buyer grain, cadence).',
      'Inventory of ~24 platforms: API vs manual (workshop list is the start).',
      'Credentials / partner API access for the first connector batch.',
      'Named operators and permission model (who enters whose rows).',
      'Definition workshop with MB and Finance: what matters, Slack channel.',
      'Decision to kill Sheets on cutover (no dual-run).',
    ],
  },
"6wwxlvke": {
    problemStatement:
      "Email still splits the same job across tools: Claude for copy, Ongage for cloning and send, and a wish for a central dashboard (insights → strategy → creative → production → delivery → performance). Those were listed as separate projects. They share one loop. Building them apart would mean three UIs and no closed learning path.",
    opportunity:
      "One Email production loop. Several purposes (compliant variants, GEO × placement template fills, other copy types) go through the same desk: brief → pack → review → write into Ongage and schedule on existing segments → performance back in as insights for the next brief. The dashboard is not a separate product; it is the insights and performance ends of this loop. Lists, ISP routing, and client-safe wrappers stay in Ongage.",
    solutions:
      "A custom production desk that owns creative production and the performance view, and uses Ongage as the ESP. Purpose is a pack type, not a new Prioritize project. Template-library fill and compliant variants are paths on the same desk. The centralised dashboard (insights → … → performance) is the same surface: strategy/creative/production in the tool, delivery in Ongage, performance queried back. Figma-to-HTML stays a sibling for rendering. v1 is review-then-push; auto-push later.",
    functionalities: [
      {
        id: "fn-loop-surface",
        title: "Insights → performance on one surface",
        description:
          "The centralised email dashboard is this product: see what ran, brief the next pack, produce it, hand off delivery, then read results. Not a second app beside the copy desk.",
      },
      {
        id: "fn-purpose-packs",
        title: "Purpose-aware brief → pack",
        description:
          "Operator picks the email purpose (compliant variants, GEO × placement template fill, trigger/lifecycle, other) and briefs constraints. Same desk, different pack shape and guardrails.",
      },
      {
        id: "fn-template-fill",
        title: "Template library fill (GEO × placement)",
        description:
          "One brief produces the full message set from the existing Ongage template library by filling GEO × placement variables. Replaces the standalone template-driven builder.",
      },
      {
        id: "fn-compliant-variants",
        title: "Compliant variant generation",
        description:
          "For flirting and other grey-area copy: subjects, HTML body, plain text, named variations. Compliance must-nots stay hard-coded; tone/vocabulary come from the historic send archive.",
      },
      {
        id: "fn-archive-engine",
        title: "Historic archive in the generation engine",
        description:
          "Load sent-mail at scale so every purpose can see what good looks like. Thin written tone rules; keep legal/compliance guardrails.",
      },
      {
        id: "fn-review-push",
        title: "Review, then write to Ongage (auto-push later)",
        description:
          "Reviewer accepts/edits/rejects. Accepted copy is written as Ongage messages and as mailings onto existing segments + ESP distribution. No silent writes in v1.",
      },
      {
        id: "fn-campaign-handoff",
        title: "Delivery stays in Ongage",
        description:
          "Create/schedule campaigns on segments they already maintain. Audience, demographic slicing, ISP/domain routing, throttling stay in Ongage. Header/footer templates keep the client-safe wrapper.",
      },
      {
        id: "fn-perf-loop",
        title: "Performance back into the next brief",
        description:
          "Pull mailing stats per message (and country/segment/platform as context). Join to human accept/reject. That is the dashboard’s performance step and the training signal Claude paste cannot close.",
      }
    ],
    expectedImpact:
      "One product instead of a dashboard project, a Claude skill, and a template cloner. Operators stay on the loop. Quality compounds. Email still uses Ongage for send and list ops.",
    businessValue:
      "Stops overlapping Email tools. Insights, production, and performance share a system of record. Faster time-to-campaign; compliance in the product; copy improves with sends.",
    technicalApproach:
      "Custom app: purpose-routed generation + performance view from Ongage reports. REST: templates and POST/PUT /api/emails; POST /api/mailings; POST /api/reports/query grouped by email_message_id (optional country/segment/platform). API entitlement required. v1 never overwrites a live send. Figma-to-HTML remains rendering-only.",
    targetAudience: [
      "Email Marketing — operators and reviewers",
      "Bending the Rules — ESP / template craft",
      "BI / Pricing — historic send archive pattern",
      "Legal / compliance — must-not list for grey-area purposes",
    ],
    risks: [
      "Account without API access returns HTTP 403.",
      "Rate limits if GEO × placement sets are bulk-created too fast.",
      "v1 never overwrites a live send (copy-on-write unless overwrite=true).",
      "Scheduling needs real segment IDs and ESP distribution; review gate is the control.",
      "HTML rendering across clients is not this project — templates / Figma-to-HTML.",
      "New email types should be pack types here, not new Prioritize projects.",
    ],
    dependencies: [
      "Ongage API credentials and confirmed API entitlement",
      "List, segment, ESP connection, and template IDs already in use",
      "Historic send archive (L2) as seed corpus",
      "Compliance must-not list for grey-area purposes",
      "Sibling: Figma-to-HTML email builder",
    ],
  },

  "s01zg1dt": {
    problemStatement:
      "There is no consistent onboarding for new affiliates. Some partners get a strong first impression; others get little or nothing. Activation lives in personal Claude skills and manual Telegram sends. Offer selection is not systematic. The first message is often offer-only, with no proper introduction to Adsomnia as a company.",
    opportunity:
      "One welcome desk. A new partner enters via Affiliate or via Everflow. The tool resolves their Telegram group, asks BI/Pricing + Everflow for the right welcome offers, drafts a specific Telegram message, always attaches the generic Adsomnia pitch deck, and waits for AM review before send. Later, when the pack is trusted, send can go automatic. Dormant-partner reactivation is the scale-up of the same desk — not v1.",
    solutions:
      "Partner Activation Pack for Affiliate Management (Sietse), with BI/Pricing in the offer loop. Dual intake: AM submits a partner, and Everflow new-affiliate events land in the same queue. Everflow API reads partner records, filters/aggregates/ranks welcome offers, and supplies tracking links. Copy engine is the existing Claude skill. Destination is the per-partner Telegram group. v1 is review-then-send; auto-send is a later switch. Every send includes the generic pitch deck (company intro) plus a Telegram message that stays specific (offers, fit, CTA). Weekly digest stays a separate project. Reactivation of dormant partners is listed as scale-up, not a v1 path.",
    functionalities: [
      {
        id: "fn-dual-intake",
        title: "Dual intake (AM + Everflow)",
        description:
          "New partners enter two ways into one queue: an AM adds them, or Everflow fires a new-affiliate event. Same onboarding from there — no parallel processes.",
      },
      {
        id: "fn-partner-record",
        title: "Everflow partner record",
        description:
          "Read the partner from Everflow (profile, geos, verticals) so the welcome is not typed from memory. Missing Telegram group or incomplete record blocks send and flags the AM.",
      },
      {
        id: "fn-telegram-group",
        title: "Per-partner Telegram group",
        description:
          "Resolve the existing Telegram group for that partner. Groups, not DMs. No group on file → no send.",
      },
      {
        id: "fn-offers-bi-everflow",
        title: "Welcome offers (Everflow + BI/Pricing)",
        description:
          "Everflow API filter/aggregate/rank plus BI/Pricing in the loop for the business logic of ‘best welcome offers’ and tracking links. Affiliate does not guess a generic top-10.",
      },
      {
        id: "fn-welcome-pack",
        title: "Specific Telegram welcome + generic pitch deck",
        description:
          "Always two pieces: (1) a partner-specific Telegram message (offers, why them, CTA) from the proven Claude skill; (2) the generic Adsomnia pitch deck / intro doc, always attached. Message is relevant; deck is the company.",
      },
      {
        id: "fn-review-send",
        title: "Review-then-send (auto-send later)",
        description:
          "AM reviews the pack, then the tool sends into the partner Telegram group. Auto-send only after the team trusts quality. Reactivation of dormant partners uses this same desk later — out of scope for v1.",
      }
    ],
    expectedImpact:
      "Every net-new partner gets the same first impression: specific offers in their Telegram group, generic Adsomnia intro attached, human-approved. Time-to-first-activation drops. No partner is skipped. When quality is proven, the same flow can auto-send — and later wake dormant partners.",
    businessValue:
      "First impression is consistent and impressive. Faster activation = faster traffic. BI/Pricing + Everflow stop wrong offers on day one. AMs review exceptions instead of assembling packs. Pitch deck makes Adsomnia look like a company, not a Telegram blast of links.",
    technicalApproach:
      "Productise the Affiliate Claude activation skill as copy. Dual intake: UI for AMs + Everflow new-affiliate webhook into one queue. Everflow API for partner records, offer rank, tracking links. BI/Pricing owns/validates the welcome-offer rules (the ‘right slice’ that was never going to live in an Affiliate BigQuery MCP). Telegram Bot API posts to the stored per-partner group after approval. Pitch deck is a single stored asset, always attached — not generated per partner. Auto-send is a flag, not a v1 path. Dormant reactivation reuses intake + pack + group send once v1 is trusted. Keep Iryna’s weekly digest separate.",
    targetAudience: [
      "Affiliate Management (Sietse + AMs) — operators and reviewers",
      "BI / Pricing — welcome-offer logic",
      "New partners — recipients in their Telegram group",
    ],
    risks: [
      "Wrong offers on day one — BI/Pricing rules must be explicit and reviewable in the AM queue.",
      "Missing or wrong Telegram group sends to the wrong partner.",
      "Everflow webhook + AM duplicate creates double welcomes unless the queue de-dupes on partner id.",
      "Auto-send turned on too early.",
      "Pitch deck ignored if Telegram clients bury attachments — message should still stand alone.",
    ],
    dependencies: [
      "Everflow API: partner records, offers, tracking links, new-affiliate webhook",
      "BI/Pricing welcome-offer rules (what ‘best’ means for a first message)",
      "Telegram bot + per-partner group chat IDs",
      "Existing Claude skill (examples, tone, must/must-nots)",
      "Canonical Adsomnia pitch deck / intro doc",
      "AM review queue before send",
    ],
  },

  "bcutgw41": {
    problemStatement:
      "Media Buying can already produce a strategy → angles → hooks → testing plan in Claude, and they have run that from historical campaign performance. In practice the loop is still broken across tools: paste an offer into Claude, pull performance from elsewhere, then jump to Banana or Midjourney to make the assets. Buyers stitch the workflow themselves. What won last week does not automatically shape next week’s strategy. Campaigns stay ad-hoc per buyer instead of a closed playbook per market and demographic.",
    opportunity:
      "One bespoke surface for the Media Buying team. A buyer opens an offer, sees live what is winning, gets a trusted strategy pack, localises it, and generates the creatives (Banana / Midjourney) in the same place. After launch, the live dashboard feeds results back into the next pack. Closed cycle: performance → strategy → assets → live → performance.",
    solutions:
      "A Creative Strategy Brief Pack built for Media Buying as the operator — not a handoff to a studio. The Claude case stays the proof that a pack can be trusted. This project scales that into a product: live performance dashboard as the source of truth, strategy generation grounded in those winners, localisation to market and demographic cuts, and in-flow asset creation via Banana and Midjourney. The dashboard is not a reporting extra; it is the input to the next campaign.",
    functionalities: [
      {
        id: "fn-offer-intake",
        title: "Offer + constraints intake",
        description:
          "Buyer enters offer, geo, network, audience, brand/compliance limits. The same intake pulls current performance context from the live dashboard so the run is never a blank Claude chat.",
      },
      {
        id: "fn-live-dashboard",
        title: "Live creative performance dashboard",
        description:
          "Always-on view of what is working — including visual recognition of winning ads (the leftover from the Claude debrief). This is the memory of the cycle, not a weekly export.",
      },
      {
        id: "fn-strategy-pack",
        title: "Performance-grounded strategy pack",
        description:
          "Generate strategy, angles, hooks, variant directions, and a testing plan from a locked template, using live winners plus the team’s trusted example packs. A buyer should brief or generate from this without rewriting the strategy.",
      },
      {
        id: "fn-localise",
        title: "Market & demographic localisation",
        description:
          "Cut one generic pack for a market and for demographic segments inside that market. Same offer, multiple audience versions the buyer would run as-is.",
      },
      {
        id: "fn-asset-gen",
        title: "In-flow asset creation (Banana + Midjourney)",
        description:
          "Media buyers generate the creatives themselves from the pack — assume Banana and Midjourney as the generation stack. No separate tool-hop, no studio handoff as the default path.",
      },
      {
        id: "fn-closed-loop",
        title: "Closed-loop write-back",
        description:
          "Once creatives are live, results land back on the dashboard and feed the next strategy run. Overrides and ‘we would launch this’ calls are written into the playbook so quality compounds.",
      }
    ],
    expectedImpact:
      "Media Buying runs offer → live winners → strategy → localised cuts → Banana/Midjourney assets → live → next pack without leaving the product. Faster time to a testable campaign per market. Higher hit rate because strategy is continuously fed by what actually performed. The Claude skill is no longer the operating system; it is the proven core inside a closed cycle.",
    businessValue:
      "One workflow instead of three tools. Buyers spend time deciding and launching, not stitching Claude, dashboards, and image gens. Creative strategy stays current because live performance writes the next brief. More campaigns per buyer, more consistent quality per market, less dependence on one person’s Claude project.",
    technicalApproach:
      "Productise the existing Media Buying Claude project (context docs, skill instructions, example packs) as the strategy engine. Wrap it with: (1) a live performance dashboard that can visually surface winning creatives and feed structured winner signals into the next pack; (2) Banana + Midjourney as the asset-generation layer driven by that pack; (3) localisation as a first-class cut of the same pack. Start from the artefacts they already trust; connect live performance so the cycle does not depend on a manual export. Network MCP launch and becoming an external creative studio stay out of scope — this is an MB-operated system.",
    targetAudience: [
      "Media Buying team (Alexander + buyers) — primary users",
      "Campaign managers (same team, launch/test decisions)",
    ],
    risks: [
      "Dashboard + visual recognition is the hard leftover from the Claude debrief — connecting live creative performance is the longest pole.",
      "Banana / Midjourney quality and brand/compliance still need buyer review before spend.",
      "If the strategy pack is not trusted, buyers will still rewrite it and the closed loop never starts.",
      "Live data access (which tracker / network / ScaleWizard) is not locked yet — integration path may slip.",
      "Generation costs and rate limits if every buyer runs assets from the same surface.",
    ],
    dependencies: [
      "Existing Claude project / skill (template, trusted example packs, must/must-not rules)",
      "Live performance source(s) that can feed the dashboard and winner signals",
      "Banana and Midjourney access for the Media Buying team",
      "Alexander (or another MB) to validate: would we launch from this pack + these assets?",
      "Agreement on which networks/trackers the live dashboard reads first",
    ],
  },
};
