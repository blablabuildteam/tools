'use client';

import { useMemo, useState } from 'react';
import {
  ArrowLeft, ArrowRight, X, Code2, BadgeCheck, CircleDot,
  AlertTriangle, Ban, Presentation,
} from 'lucide-react';
import {
  type UseCase, type ClaudeFit, type PresentationNextUnlock,
  calcScore, getQuadrant, getDeptColor,
  Q_META, sortByDeptThenName, textChanged,
} from './types';

const CLAUDE_FIT_META: Record<ClaudeFit, {
  label: string; short: string; color: string; bg: string; border: string;
  Icon: typeof CircleDot;
}> = {
  good:    { label: 'Claude-ready', short: 'Claude ready', color: 'text-bla-lime', bg: 'bg-bla-lime/10', border: 'border-bla-lime/30', Icon: BadgeCheck },
  stretch: { label: 'Possible w/ caveats', short: 'Caveats', color: 'text-amber-300', bg: 'bg-amber-400/10', border: 'border-amber-400/30', Icon: AlertTriangle },
  blocked: { label: 'Needs platform/API', short: 'API', color: 'text-red-300', bg: 'bg-red-400/10', border: 'border-red-400/30', Icon: Ban },
};

const CARD_FIT_META: Record<ClaudeFit, {
  short: string; color: string; bg: string; border: string; Icon: typeof CircleDot;
}> = {
  good:    { short: 'Claude ready', color: 'text-[#3d4a00]', bg: 'bg-[#ceff00]/55', border: 'border-[#b8e600]', Icon: BadgeCheck },
  stretch: { short: 'Caveats', color: 'text-amber-800', bg: 'bg-amber-100', border: 'border-amber-200', Icon: AlertTriangle },
  blocked: { short: 'API', color: 'text-red-800', bg: 'bg-red-100', border: 'border-red-200', Icon: Ban },
};

const SCORE_KEYS: { key: keyof UseCase['scores']; label: string }[] = [
  { key: 'businessImpact', label: 'Impact' },
  { key: 'frequency', label: 'Frequency' },
  { key: 'aiSuitability', label: 'Fit for AI' },
  { key: 'implementation', label: 'Speed' },
  { key: 'risk', label: 'Safety' },
  { key: 'adoption', label: 'Adaptability' },
];

const DEBRIEF_FIELDS: {
  key: 'presentationOutcome' | 'presentationFinding' | 'presentationChallenge' | 'presentationAmbition';
  label: string;
  ask: string;
  placeholder: string;
}[] = [
  {
    key: 'presentationOutcome',
    label: 'Outcome',
    ask: 'What can you do now that you couldn’t 2 weeks ago?',
    placeholder: 'Concrete capability unlocked…',
  },
  {
    key: 'presentationFinding',
    label: 'Finding',
    ask: 'What did Claude surprise you with / change about the problem?',
    placeholder: 'What you learned vs the original brief…',
  },
  {
    key: 'presentationChallenge',
    label: 'Challenge',
    ask: 'Where did you get stuck? (data, access, judgment, format, trust)',
    placeholder: 'The real blocker…',
  },
  {
    key: 'presentationAmbition',
    label: 'Ambition',
    ask: 'If this had to work in real ops next month, what’s missing?',
    placeholder: 'What level 2 needs…',
  },
];

const PROBE_QUESTIONS = [
  'What still requires a human decision?',
  'Which system or person do you need that you didn’t have?',
  'Would another department’s output make this 10× more useful?',
  'If we connected one live tool (MCP), which one first?',
];

const NEXT_UNLOCK_OPTIONS: { id: PresentationNextUnlock; label: string; hint: string }[] = [
  { id: 'data', label: 'Data', hint: 'Live / better inputs' },
  { id: 'mcp', label: 'MCP / tool', hint: 'Connect a system' },
  { id: 'cross-team', label: 'Cross-team', hint: 'Another dept' },
  { id: 'workflow', label: 'Workflow', hint: 'Habit / trigger' },
];

interface Props {
  useCases: UseCase[];
  onBack: () => void;
  onUpdate: (uc: UseCase) => void | Promise<void>;
}

export default function ClaudeCasesView({ useCases, onBack, onUpdate }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);

  const selectedCases = useMemo(
    () => useCases.filter((uc) => uc.buildInClaudeCode),
    [useCases]
  );

  const selected = selectedId ? useCases.find((uc) => uc.id === selectedId) : null;
  const original = selected?.originalInput;
  const hasOriginalDiff = original && selected && (
    textChanged(original.name, selected.name) ||
    textChanged(original.description, selected.description) ||
    textChanged(original.solution, selected.solution)
  );

  return (
    <div className="mx-auto w-full max-w-6xl">
      <button type="button" onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-[15px] font-medium text-white/85 transition-colors hover:border-bla-lime/40 hover:bg-bla-lime/10 hover:text-bla-lime">
        <ArrowLeft className="h-4 w-4" />
        Back to matrix
      </button>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-bla-lime/70">§ claude cases</p>
          <h2 className="mt-1 font-host text-2xl font-light text-white">Selected Claude Cases</h2>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-white/60">
            These are the use cases each department will focus on building in the next two weeks. 
            Every team will explore how Claude can help solve their specific challenge.
          </p>
        </div>
        <div className="rounded-xl border border-bla-lime/25 bg-bla-lime/[0.07] px-4 py-2.5 text-right">
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-bla-lime/70">Selected</p>
          <p className="font-host text-2xl font-medium text-bla-lime">{selectedCases.length}</p>
        </div>
      </div>

      {/* Upcoming deadlines */}
      <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">Upcoming deadlines</p>
        <div className="mt-3 flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-bla-lime/10">
            <Presentation className="h-4 w-4 text-bla-lime" />
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-bla-lime/70">Office Presentations</p>
            <p className="mt-0.5 text-[14px] font-medium text-white">Wednesday, September 19th</p>
            <p className="text-[13px] text-white/50">3:00 PM – 5:00 PM</p>
            <p className="mt-1.5 text-[12px] leading-relaxed text-white/40">
              Each department presents their Claude concept or prototype.
            </p>
          </div>
        </div>
      </div>

      {/* How to read fit */}
      <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-[13px] leading-relaxed text-white/55">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">How we reviewed each case</p>
        <p className="mt-2 text-white/50">
          We assessed every use case on whether it's <span className="text-bla-lime">Claude-ready</span>, 
          <span className="text-amber-300"> possible with caveats</span>, or 
          <span className="text-red-300"> needs platform/API connections</span>.
        </p>
        <p className="mt-2 text-white/50">
          For the purpose of prototyping in the next two weeks, we focused on selecting cases that are <span className="text-bla-lime font-medium">fully Claude-ready</span> — 
          meaning you can build and demo entirely within Claude using docs or pasted text, without requiring live tool logins.
        </p>
        <p className="mt-2 text-white/50">
          We purposely chose cases that act as a <span className="font-medium text-white">first step in enablement</span>.
          Claude’s capabilities go further than how these cases are currently scoped — treat this sprint as the starting point.
          After this initiative, we’ll look at how each team can progress their case into a more intelligent, sophisticated solution.
        </p>
      </div>

      {/* How to approach */}
      <div className="mt-6 rounded-xl border border-bla-lime/25 bg-bla-lime/[0.06] px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-bla-lime/15">
            <Code2 className="h-4 w-4 text-bla-lime" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-bla-lime/70">How to approach this?</p>
            <div className="mt-2 space-y-2 text-[14px] leading-relaxed text-white/65">
              <p>
                We prepared these Claude Cases so each team can execute them <span className="font-medium text-white">autonomously</span>.
              </p>
              <p>
                Assign <span className="font-medium text-white">one person</span> who will build the case in Claude Code.
                The rest of the team supports them — reviewing output, clarifying requirements, and unblocking decisions.
              </p>
              <p>
                Plan <span className="font-medium text-white">daily sessions</span> so you keep a steady cadence and can give input during progress reviews.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Case cards in 3-column grid */}
      {selectedCases.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center">
          <p className="text-[15px] text-white/40">No cases have been selected yet.</p>
          <p className="mt-1 text-[13px] text-white/25">Selected cases will appear here.</p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {selectedCases.sort(sortByDeptThenName).map((uc) => {
            const fit = uc.claudeFit ? CARD_FIT_META[uc.claudeFit] : null;
            const dept = uc.label || 'General';
            return (
              <button
                key={uc.id}
                type="button"
                onClick={() => { setShowOriginal(false); setSelectedId(uc.id); }}
                className="group relative flex flex-col rounded-xl border border-black/10 bg-[#f2f3f5] p-5 text-left shadow-[0_1px_0_rgba(255,255,255,0.04)] transition-all hover:border-bla-lime/50 hover:bg-white"
              >
                <div className="mb-3 flex items-center gap-2 pr-6">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: getDeptColor(dept) }} />
                  <span className="font-mono text-[11px] text-black/45">{dept}</span>
                  {fit && (
                    <span className={`ml-auto inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] ${fit.border} ${fit.bg} ${fit.color}`}>
                      <fit.Icon className="h-3 w-3" />{fit.short}
                    </span>
                  )}
                </div>

                <h4 className="mb-4 text-[16px] font-medium leading-snug text-[#12141a] transition-colors group-hover:text-[#2a3200]">
                  {uc.name}
                </h4>
                
                <div className="mb-4 flex-1 space-y-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-black/35">Problem</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-black/65">
                      {uc.description || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#4a5600]">Solution idea</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-[#2a3200]">
                      {uc.solution || '—'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-black/10 pt-3">
                  <span className={`font-mono text-[11px] ${uc.owner ? 'text-black/50' : 'text-amber-700'}`}>
                    {uc.owner || 'No owner yet'}
                  </span>
                  <div className="flex items-center gap-2">
                    {(uc.presentationOutcome || uc.presentationFinding || uc.presentationChallenge || uc.presentationAmbition) && (
                      <span className="rounded-full border border-[#4a5600]/25 bg-[#ceff00]/25 px-2 py-0.5 font-mono text-[9px] text-[#2a3200]">
                        Debrief
                      </span>
                    )}
                    <ArrowRight className="h-4 w-4 text-black/0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-black/55" aria-hidden />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-3 sm:items-center sm:p-6">
          <button type="button" aria-label="Close" className="absolute inset-0 cursor-default" onClick={() => setSelectedId(null)} />
          <div className="relative z-10 max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-white/12 bg-[#101218] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.5)] sm:p-6">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: getDeptColor(selected.label || 'General') }} />
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">{selected.label || 'General'}</p>
                  <span className="rounded-full px-2 py-0.5 font-mono text-[10px]" style={{ color: Q_META[getQuadrant(selected)].dot, backgroundColor: Q_META[getQuadrant(selected)].dot + '22' }}>
                    {Q_META[getQuadrant(selected)].label}
                  </span>
                  <span className="font-mono text-[11px] text-white/50">score {calcScore(selected.scores).toFixed(2)}</span>
                </div>
                <h3 className="font-host text-lg font-medium leading-snug text-white">{selected.name}</h3>
                <p className="mt-1 font-mono text-[11px] text-white/40">by {selected.addedBy || 'Unknown'}</p>
              </div>
              <button type="button" onClick={() => setSelectedId(null)} className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/12 text-white/50 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="mb-4 flex items-center gap-2">
              <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">Owner</span>
              <input type="text" defaultValue={selected.owner || ''} placeholder="Name…" key={`owner-${selected.id}-${selected.owner || ''}`}
                onBlur={(e) => {
                  const val = e.target.value.trim();
                  if (val !== (selected.owner || '')) onUpdate({ ...selected, owner: val || undefined });
                }}
                className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-[13px] text-white placeholder:text-white/25 outline-none focus:border-bla-lime/30" />
            </label>

            <div className="mb-4 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
              {SCORE_KEYS.map(({ key, label }) => (
                <div key={key} className="rounded-lg border border-white/8 bg-black/25 px-2 py-1.5">
                  <p className="font-mono text-[9px] text-white/35">{label}</p>
                  <p className="font-mono text-[13px] text-white/80">{selected.scores[key]}</p>
                </div>
              ))}
            </div>

            {hasOriginalDiff && (
              <div className="mb-3 flex gap-1.5">
                <button type="button" onClick={() => setShowOriginal(false)}
                  className={`rounded-full border px-2.5 py-1 font-mono text-[10px] ${!showOriginal ? 'border-bla-lime/40 bg-bla-lime/15 text-bla-lime' : 'border-white/12 text-white/45'}`}>Current</button>
                <button type="button" onClick={() => setShowOriginal(true)}
                  className={`rounded-full border px-2.5 py-1 font-mono text-[10px] ${showOriginal ? 'border-bla-lime/40 bg-bla-lime/15 text-bla-lime' : 'border-white/12 text-white/45'}`}>Workshop original</button>
              </div>
            )}

            <div className="space-y-3">
              {showOriginal && original ? (
                <>
                  {textChanged(original.name, selected.name) && (
                    <div><p className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">Original title</p><p className="text-[13px] text-white/55">{original.name}</p></div>
                  )}
                  <div><p className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">Original problem</p><p className="whitespace-pre-wrap text-[13px] leading-relaxed text-white/65">{original.description || '—'}</p></div>
                  <div><p className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">Original solution</p><p className="whitespace-pre-wrap text-[13px] leading-relaxed text-white/55">{original.solution || '—'}</p></div>
                </>
              ) : (
                <>
                  <div><p className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">Problem</p><p className="whitespace-pre-wrap text-[13px] leading-relaxed text-white/65">{selected.description || '—'}</p></div>
                  <div><p className="mb-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">Solution idea</p><p className="whitespace-pre-wrap text-[13px] leading-relaxed text-bla-lime/70">{selected.solution || '—'}</p></div>
                  {original && !hasOriginalDiff && <p className="font-mono text-[10px] text-white/30">Live copy matches workshop original.</p>}
                </>
              )}
            </div>

            <div className="mt-5">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">Is this Claude-ready?</p>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
                {(Object.keys(CLAUDE_FIT_META) as ClaudeFit[]).map((fit) => {
                  const meta = CLAUDE_FIT_META[fit];
                  const active = selected.claudeFit === fit;
                  return (
                    <button key={fit} type="button" onClick={() => onUpdate({ ...selected, claudeFit: fit })}
                      className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-center text-[12px] transition-colors ${
                        active ? `${meta.border} ${meta.bg} ${meta.color}` : 'border-white/10 text-white/45 hover:border-white/20'
                      }`}>
                      <meta.Icon className="h-3.5 w-3.5 shrink-0" />{meta.label}
                    </button>
                  );
                })}
              </div>
              <textarea defaultValue={selected.claudeFitReason || ''} placeholder="Why this fit?" key={`fit-${selected.id}-${selected.claudeFitReason || ''}`} rows={2}
                onBlur={(e) => {
                  const val = e.target.value.trim();
                  if (val !== (selected.claudeFitReason || '')) onUpdate({ ...selected, claudeFitReason: val || undefined });
                }}
                className="mt-2 w-full resize-none rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-[12px] text-white/75 placeholder:text-white/25 outline-none focus:border-white/25" />
            </div>

            <div className="mt-5">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">Considerations</p>
              <textarea defaultValue={selected.reviewNotes || ''} placeholder="Considerations… e.g. Which export? Who owns the input pack?" key={`bbb-${selected.id}-${selected.reviewNotes || ''}`} rows={3}
                onBlur={(e) => {
                  const val = e.target.value.trim();
                  if (val !== (selected.reviewNotes || '')) onUpdate({ ...selected, reviewNotes: val || undefined });
                }}
                className="w-full resize-none rounded-lg border border-white/10 bg-black/25 px-3 py-2.5 text-[13px] leading-relaxed text-white/80 placeholder:text-white/25 outline-none focus:border-bla-lime/30" />
            </div>

            <div className="mt-5">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">How to build this in Claude</p>
              <textarea defaultValue={selected.howToGuide || ''} placeholder="Step-by-step guide for the team…" key={`howto-${selected.id}-${selected.howToGuide || ''}`} rows={5}
                onBlur={(e) => {
                  const val = e.target.value.trim();
                  if (val !== (selected.howToGuide || '')) onUpdate({ ...selected, howToGuide: val || undefined });
                }}
                className="w-full resize-none rounded-lg border border-white/10 bg-black/25 px-3 py-2.5 text-[13px] leading-relaxed text-white/80 placeholder:text-white/25 outline-none focus:border-bla-lime/30" />
            </div>

            <div className="mt-5">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">Definition of done</p>
              <textarea defaultValue={selected.definitionOfDone || ''} placeholder="What must be true when the team presents?" key={`dod-${selected.id}-${selected.definitionOfDone || ''}`} rows={6}
                onBlur={(e) => {
                  const val = e.target.value.trim();
                  if (val !== (selected.definitionOfDone || '')) onUpdate({ ...selected, definitionOfDone: val || undefined });
                }}
                className="w-full resize-none rounded-lg border border-white/10 bg-black/25 px-3 py-2.5 text-[13px] leading-relaxed text-white/80 placeholder:text-white/25 outline-none focus:border-bla-lime/30" />
            </div>

            {/* Presentation debrief — live capture during office presentations */}
            <div className="mt-6 rounded-xl border border-bla-lime/25 bg-bla-lime/[0.05] p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-bla-lime/15">
                  <Presentation className="h-4 w-4 text-bla-lime" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-bla-lime/70">Presentation debrief</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-white/55">
                    Capture these live while the team presents. This feeds the next, harder case (MCP, cross-team, or live data).
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-white/10 bg-black/20 px-3.5 py-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">Probe questions</p>
                <ul className="mt-2 space-y-1.5">
                  {PROBE_QUESTIONS.map((q) => (
                    <li key={q} className="flex gap-2 text-[12px] leading-snug text-white/55">
                      <span className="mt-0.5 shrink-0 font-mono text-bla-lime/60">→</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 space-y-4">
                {DEBRIEF_FIELDS.map((field) => (
                  <div key={field.key}>
                    <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-bla-lime/70">{field.label}</p>
                      <p className="text-[11px] leading-snug text-white/40">{field.ask}</p>
                    </div>
                    <textarea
                      defaultValue={selected[field.key] || ''}
                      placeholder={field.placeholder}
                      key={`${field.key}-${selected.id}-${selected[field.key] || ''}`}
                      rows={3}
                      onBlur={(e) => {
                        const val = e.target.value.trim();
                        if (val !== (selected[field.key] || '')) {
                          onUpdate({ ...selected, [field.key]: val || undefined });
                        }
                      }}
                      className="w-full resize-none rounded-lg border border-white/10 bg-black/25 px-3 py-2.5 text-[13px] leading-relaxed text-white/80 placeholder:text-white/25 outline-none focus:border-bla-lime/30"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-bla-lime/70">Next unlock</p>
                <p className="mb-2 text-[11px] text-white/40">Tag what level 2 should add — pick one primary lever.</p>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                  {NEXT_UNLOCK_OPTIONS.map((opt) => {
                    const active = selected.presentationNextUnlock === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() =>
                          onUpdate({
                            ...selected,
                            presentationNextUnlock: active ? undefined : opt.id,
                          })
                        }
                        className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
                          active
                            ? 'border-bla-lime/40 bg-bla-lime/15 text-bla-lime'
                            : 'border-white/10 text-white/50 hover:border-white/25 hover:text-white/75'
                        }`}
                      >
                        <p className="text-[12px] font-medium">{opt.label}</p>
                        <p className={`mt-0.5 font-mono text-[9px] ${active ? 'text-bla-lime/60' : 'text-white/30'}`}>{opt.hint}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <button type="button" onClick={() => onUpdate({ ...selected, buildInClaudeCode: !selected.buildInClaudeCode })}
                className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-[14px] font-medium transition-colors ${
                  selected.buildInClaudeCode ? 'border border-bla-lime/40 bg-bla-lime/15 text-bla-lime' : 'border border-white/15 text-white/70 hover:border-white/30 hover:text-white'
                }`}>
                <Code2 className="h-4 w-4" />
                {selected.buildInClaudeCode ? 'Selected as Claude Case' : 'Select as Claude Case build'}
              </button>
              <button type="button" onClick={() => onUpdate({ ...selected, claudeReviewedByBlaBlaBuild: !selected.claudeReviewedByBlaBlaBuild })}
                className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-[14px] font-medium transition-colors ${
                  selected.claudeReviewedByBlaBlaBuild ? 'bg-bla-lime text-[#0a0b0e]' : 'border border-bla-lime/35 bg-bla-lime/10 text-bla-lime hover:bg-bla-lime/15'
                }`}>
                <BadgeCheck className="h-4 w-4" />
                {selected.claudeReviewedByBlaBlaBuild ? 'reviewed by blablabuild' : 'Mark reviewed by blablabuild'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
