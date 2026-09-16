'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowDown, ArrowLeft, ArrowRight, X, Code2, BadgeCheck, CircleDot,
  AlertTriangle, Ban, Presentation, Sparkles,
} from 'lucide-react';
import {
  type UseCase, type ClaudeFit, type PresentationNextUnlock,
  calcScore, getQuadrant, getDeptColor,
  Q_META, sortByDeptThenName, textChanged,
} from './types';
import {
  type ClaudeLevel2Draft,
  type ClaudeLevel2Status,
  CROSS_TEAM_OPTIONS,
  inferStatus,
  loadClaudeLevel2,
  mergeLevel2Draft,
  saveClaudeLevel2,
} from './claudeLevel2';

const CLAUDE_FIT_META: Record<ClaudeFit, {
  label: string; short: string; color: string; bg: string; border: string;
  Icon: typeof CircleDot;
}> = {
  good:    { label: 'Claude-ready', short: 'Claude ready', color: 'text-bla-lime', bg: 'bg-bla-lime/10', border: 'border-bla-lime/30', Icon: BadgeCheck },
  stretch: { label: 'Possible w/ caveats', short: 'Caveats', color: 'text-amber-300', bg: 'bg-amber-400/10', border: 'border-amber-400/30', Icon: AlertTriangle },
  blocked: { label: 'Needs platform/API', short: 'API', color: 'text-red-300', bg: 'bg-red-400/10', border: 'border-red-400/30', Icon: Ban },
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

const L2_STATUS_META: Record<ClaudeLevel2Status, { label: string; className: string }> = {
  shell:    { label: 'Shell',    className: 'border-white/20 bg-white/5 text-white/55' },
  drafting: { label: 'Drafting', className: 'border-amber-400/35 bg-amber-400/10 text-amber-200' },
  ready:    { label: 'Ready',    className: 'border-bla-lime/40 bg-bla-lime/15 text-bla-lime' },
};

interface Props {
  useCases: UseCase[];
  sessionId?: string;
  onBack: () => void;
  onUpdate: (uc: UseCase) => void | Promise<void>;
}

export default function ClaudeCasesView({ useCases, sessionId, onBack, onUpdate }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [level2Id, setLevel2Id] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, ClaudeLevel2Draft>>({});
  const draftsRef = useRef(drafts);
  draftsRef.current = drafts;

  const selectedCases = useMemo(
    () => [...useCases.filter((uc) => uc.buildInClaudeCode)].sort(sortByDeptThenName),
    [useCases]
  );

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    loadClaudeLevel2(sessionId).then((state) => {
      if (!cancelled) setDrafts(state.drafts || {});
    });
    return () => { cancelled = true; };
  }, [sessionId]);

  const draftFor = useCallback(
    (level1Id: string) => mergeLevel2Draft(level1Id, drafts[level1Id]),
    [drafts]
  );

  const persistDraft = useCallback(
    async (level1Id: string, patch: Partial<ClaudeLevel2Draft>) => {
      const current = draftsRef.current;
      const merged = {
        ...mergeLevel2Draft(level1Id, current[level1Id]),
        ...patch,
        level1CaseId: level1Id,
        updatedAt: new Date().toISOString(),
      };
      if (patch.status == null) merged.status = inferStatus(merged);
      const next = { ...current, [level1Id]: merged };
      draftsRef.current = next;
      setDrafts(next);
      if (sessionId) await saveClaudeLevel2(sessionId, { drafts: next });
    },
    [sessionId]
  );

  const selected = selectedId ? useCases.find((uc) => uc.id === selectedId) : null;
  const level2Case = level2Id ? useCases.find((uc) => uc.id === level2Id) : null;
  const level2Draft = level2Id ? draftFor(level2Id) : null;
  const original = selected?.originalInput;
  const hasOriginalDiff = original && selected && (
    textChanged(original.name, selected.name) ||
    textChanged(original.description, selected.description) ||
    textChanged(original.solution, selected.solution)
  );

  const readyCount = selectedCases.filter((uc) => inferStatus(draftFor(uc.id)) === 'ready').length;

  return (
    <div className="mx-auto w-full max-w-7xl">
      <button type="button" onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-[15px] font-medium text-white/85 transition-colors hover:border-bla-lime/40 hover:bg-bla-lime/10 hover:text-bla-lime">
        <ArrowLeft className="h-4 w-4" />
        Back to matrix
      </button>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-bla-lime/70">§ claude cases</p>
          <h2 className="mt-1 font-host text-2xl font-light text-white">Claude Cases — Level 2</h2>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-white/60">
            Level 1 presentations are done. Next: a harder case each team can still run <span className="text-white">autonomously in Claude</span> —
            now with an MCP they can connect themselves, and one artifact from another team.
            No custom APIs from us.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="rounded-xl border border-bla-lime/25 bg-bla-lime/[0.07] px-4 py-2.5 text-right">
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-bla-lime/70">Level 2 ready</p>
            <p className="font-host text-2xl font-medium text-bla-lime">{readyCount}/{selectedCases.length}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-right">
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/40">Level 1 done</p>
            <p className="font-host text-2xl font-medium text-white/70">{selectedCases.length}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-bla-lime/25 bg-bla-lime/[0.06] px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-bla-lime/15">
            <Sparkles className="h-4 w-4 text-bla-lime" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-bla-lime/70">How Level 2 is different</p>
            <div className="mt-2 space-y-2 text-[14px] leading-relaxed text-white/65">
              <p>
                Still one owner in Claude Code. Still no custom integrations from us.
                The stretch is <span className="font-medium text-white">one thing they can connect themselves</span>
                {' '}(a Claude Project knowledge center, or an MCP they already have) and
                {' '}<span className="font-medium text-white">one move toward another team</span>.
              </p>
              <p>
                We lock each brief together, then write it onto the card.
                If Level 1 was not useful in real ops, pivot.
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-bla-lime/70">Per team</p>
            <h3 className="mt-1 font-host text-xl font-light text-white">Level 1 → Level 2</h3>
            <p className="mt-1 max-w-xl text-[13px] text-white/45">
              Presented case on the left. Next case on the right. Open a card to edit.
            </p>
          </div>
        </div>

        {selectedCases.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center">
            <p className="text-[15px] text-white/40">No cases have been selected yet.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-8">
            {selectedCases.map((uc) => {
              const draft = draftFor(uc.id);
              const status = inferStatus(draft);
              const dept = uc.label || 'General';
              const hideLevel2 = Boolean(draft.hideLevel2);
              return (
                <div key={uc.id}>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: getDeptColor(dept) }} />
                    <p className="font-mono text-[12px] text-white/70">{dept}</p>
                    <span className="font-mono text-[11px] text-white/35">{uc.owner || 'No owner yet'}</span>
                  </div>

                  <div className="grid items-stretch gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
                    <button
                      type="button"
                      onClick={() => { setShowOriginal(false); setSelectedId(uc.id); }}
                      className="group flex min-h-[280px] flex-col rounded-xl border border-black/10 bg-[#e8e9ec] p-5 text-left transition-all hover:bg-[#f2f3f5]"
                    >
                      <div className="mb-3 flex items-center gap-2">
                        <span className="rounded-full border border-black/15 bg-black/5 px-2 py-0.5 font-mono text-[10px] text-black/50">
                          Level 1
                        </span>
                        <span className="rounded-full border border-[#4a5600]/25 bg-[#ceff00]/25 px-2 py-0.5 font-mono text-[10px] text-[#2a3200]">
                          Complete
                        </span>
                      </div>
                      <h4 className="mb-3 text-[16px] font-medium leading-snug text-[#12141a]">
                        {uc.name}
                      </h4>
                      <div className="mb-4 flex-1 space-y-3">
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-black/35">Problem</p>
                          <p className="mt-1 text-[13px] leading-relaxed text-black/65 line-clamp-3">
                            {uc.description || '—'}
                          </p>
                        </div>
                        <div>
                          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#4a5600]">Solution idea</p>
                          <p className="mt-1 text-[13px] leading-relaxed text-[#2a3200] line-clamp-3">
                            {uc.solution || '—'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t border-black/10 pt-3">
                        <span className={`font-mono text-[11px] ${uc.owner ? 'text-black/50' : 'text-amber-700'}`}>
                          {uc.owner || 'No owner yet'}
                        </span>
                        <span className="font-mono text-[10px] text-black/30 group-hover:text-black/50">Open</span>
                      </div>
                    </button>

                    {hideLevel2 ? (
                      <>
                        <div className="hidden items-center justify-center py-1 md:flex md:px-1" aria-hidden>
                          <div className="h-10 w-10" />
                        </div>
                        <div className="hidden md:block" aria-hidden />
                      </>
                    ) : (
                    <div className="flex items-center justify-center py-1 md:px-1" aria-hidden>
                      <div className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04]">
                        <ArrowDown className="h-4 w-4 text-bla-lime/80 md:hidden" />
                        <ArrowRight className="hidden h-4 w-4 text-bla-lime/80 md:block" />
                      </div>
                    </div>
                    )}

                    {!hideLevel2 && (
                    <button
                      type="button"
                      onClick={() => setLevel2Id(uc.id)}
                      className="group flex min-h-[280px] flex-col rounded-xl border border-dashed border-bla-lime/35 bg-[#101218] p-5 text-left transition-all hover:border-bla-lime/70 hover:bg-[#141820]"
                    >
                      <div className="mb-3 flex items-center gap-2">
                        <span className="rounded-full border border-bla-lime/35 bg-bla-lime/15 px-2 py-0.5 font-mono text-[10px] text-bla-lime">
                          Level 2
                        </span>
                        <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] ${L2_STATUS_META[status].className}`}>
                          {L2_STATUS_META[status].label}
                        </span>
                      </div>
                      <h4 className="mb-3 text-[16px] font-medium leading-snug text-white group-hover:text-bla-lime">
                        {draft.title}
                      </h4>
                      <p className="mb-4 flex-1 text-[13px] leading-relaxed text-white/50 line-clamp-4">
                        {draft.idea || '—'}
                      </p>
                      <div className="flex items-center justify-between border-t border-white/10 pt-3">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-white/30">
                            Cross Collaboration
                          </span>
                          {draft.crossTeams.length === 0 ? (
                            <span className="font-mono text-[11px] text-white/30">No cross-team yet</span>
                          ) : (
                            draft.crossTeams.map((team) => (
                              <span key={team} className="inline-flex items-center gap-1.5 font-mono text-[11px] text-white/50">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: getDeptColor(team) }} />
                                {team}
                              </span>
                            ))
                          )}
                        </div>
                        <span className="shrink-0 font-mono text-[10px] text-white/30 group-hover:text-white/55">Open brief</span>
                      </div>
                    </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <ModalFrame
        open={Boolean(level2Case && level2Draft)}
        onClose={() => setLevel2Id(null)}
        accent
        panelKey={level2Case?.id}
      >
        {level2Case && level2Draft && (
          <>
            <ModalReveal index={0} resetKey={level2Case.id} skeleton={false}>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: getDeptColor(level2Case.label || 'General') }} />
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">{level2Case.label || 'General'}</p>
                    <span className="rounded-full border border-bla-lime/35 bg-bla-lime/15 px-2 py-0.5 font-mono text-[10px] text-bla-lime">Level 2</span>
                    <span className={`rounded-full border px-2 py-0.5 font-mono text-[10px] ${L2_STATUS_META[inferStatus(level2Draft)].className}`}>
                      {L2_STATUS_META[inferStatus(level2Draft)].label}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-white/40">
                    Builds on the existing skill · {level2Case.name}{level2Case.owner ? ` · ${level2Case.owner}` : ''}
                  </p>
                </div>
                <button type="button" onClick={() => setLevel2Id(null)} className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/12 text-white/50 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </ModalReveal>

            <ModalReveal index={1} resetKey={level2Case.id}>
              <label className="mb-5 block">
                <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.14em] text-bla-lime/70">Title</span>
                <input
                  type="text"
                  defaultValue={level2Draft.title}
                  key={`l2-title-${level2Case.id}-${level2Draft.updatedAt || 'seed'}`}
                  onBlur={(e) => {
                    const val = e.target.value.trim();
                    if (val !== level2Draft.title) void persistDraft(level2Case.id, { title: val || level2Draft.title });
                  }}
                  className="w-full rounded-lg border border-white/10 bg-black/25 px-3 py-2.5 font-host text-[18px] font-medium text-white outline-none focus:border-bla-lime/30"
                />
              </label>
            </ModalReveal>

            <div className="space-y-5">
              <ModalReveal index={2} resetKey={level2Case.id}>
                <Level2Block
                  n="1"
                  label="Recap so far"
                  hint="What the existing skill actually delivered."
                  value={level2Draft.recap}
                  fieldKey={`l2-recap-${level2Case.id}-${level2Draft.updatedAt || 'seed'}`}
                  onSave={(val) => persistDraft(level2Case.id, { recap: val })}
                />
              </ModalReveal>
              <ModalReveal index={3} resetKey={level2Case.id}>
                <Level2Block
                  n="2"
                  label="Level 2 idea"
                  hint="What this case is — and what it is not."
                  value={level2Draft.idea}
                  fieldKey={`l2-idea-${level2Case.id}-${level2Draft.updatedAt || 'seed'}`}
                  onSave={(val) => persistDraft(level2Case.id, { idea: val })}
                />
              </ModalReveal>
              <ModalReveal index={4} resetKey={level2Case.id}>
                <Level2Block
                  n="3"
                  label="Thought-starters"
                  hint="These are thought-starters. Feel free to approach it based on your thinking."
                  value={level2Draft.instructions}
                  fieldKey={`l2-ins-${level2Case.id}-${level2Draft.updatedAt || 'seed'}`}
                  onSave={(val) => persistDraft(level2Case.id, { instructions: val })}
                />
              </ModalReveal>
              <ModalReveal index={5} resetKey={level2Case.id}>
                <Level2Block
                  n="4"
                  label="Next presentation"
                  hint="What we expect them to walk in with."
                  value={level2Draft.presentationExpect}
                  fieldKey={`l2-pres-${level2Case.id}-${level2Draft.updatedAt || 'seed'}`}
                  onSave={(val) => persistDraft(level2Case.id, { presentationExpect: val })}
                />
              </ModalReveal>
            </div>

            <ModalReveal index={6} resetKey={level2Case.id} className="mt-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">Prioritize reuse</p>
                <p className="mt-1 text-[12px] leading-relaxed text-white/40">
                  Attach a prioritized project after Level 2 cases are locked.
                </p>
                <AutoGrowTextarea
                  defaultValue={level2Draft.prioritizeReuse}
                  placeholder="Project name — later…"
                  fieldKey={`l2-pr-${level2Case.id}-${level2Draft.updatedAt || 'seed'}`}
                  minRows={2}
                  onSave={(val) => {
                    if (val !== level2Draft.prioritizeReuse) void persistDraft(level2Case.id, { prioritizeReuse: val });
                  }}
                  className="mt-3 w-full resize-none overflow-hidden rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-[13px] text-white/70 placeholder:text-white/25 outline-none focus:border-white/25"
                />
              </div>

              <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">Cross-team</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {CROSS_TEAM_OPTIONS.map((team) => {
                    const active = level2Draft.crossTeams.includes(team);
                    return (
                      <button
                        key={team}
                        type="button"
                        onClick={() => {
                          const next = active
                            ? level2Draft.crossTeams.filter((t) => t !== team)
                            : [...level2Draft.crossTeams, team];
                          void persistDraft(level2Case.id, { crossTeams: next });
                        }}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] transition-colors ${
                          active
                            ? 'border-white/25 bg-white/10 text-white'
                            : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/70'
                        }`}
                      >
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: getDeptColor(team) }} />
                        {team}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            </ModalReveal>

            <ModalReveal index={7} resetKey={level2Case.id} className="mt-5" skeleton={false}>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => void persistDraft(level2Case.id, { status: inferStatus(level2Draft) === 'ready' ? 'drafting' : 'ready' })}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-[14px] font-medium transition-colors ${
                  inferStatus(level2Draft) === 'ready'
                    ? 'bg-bla-lime text-[#0a0b0e]'
                    : 'border border-bla-lime/40 bg-bla-lime/15 text-bla-lime'
                }`}
              >
                <BadgeCheck className="h-4 w-4" />
                {inferStatus(level2Draft) === 'ready' ? 'Level 2 marked ready' : 'Mark Level 2 ready'}
              </button>
              <button
                type="button"
                onClick={() => { setLevel2Id(null); setSelectedId(level2Case.id); }}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-[14px] font-medium text-white/70 hover:border-white/30 hover:text-white"
              >
                <Presentation className="h-4 w-4" />
                Open Level 1 debrief
              </button>
            </div>
            </ModalReveal>
          </>
        )}
      </ModalFrame>

      <ModalFrame
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        panelKey={selected?.id}
      >
        {selected && (
          <>
            <ModalReveal index={0} resetKey={selected.id} skeleton={false}>
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: getDeptColor(selected.label || 'General') }} />
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">{selected.label || 'General'}</p>
                  <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-white/50">Level 1</span>
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
            </ModalReveal>

            <ModalReveal index={1} resetKey={selected.id}>
            <label className="mb-4 flex items-center gap-2">
              <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">Owner</span>
              <input type="text" defaultValue={selected.owner || ''} placeholder="Name…" key={`owner-${selected.id}-${selected.owner || ''}`}
                onBlur={(e) => {
                  const val = e.target.value.trim();
                  if (val !== (selected.owner || '')) onUpdate({ ...selected, owner: val });
                }}
                className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-[13px] text-white placeholder:text-white/25 outline-none focus:border-bla-lime/30" />
            </label>
            </ModalReveal>

            <ModalReveal index={2} resetKey={selected.id}>
            <div className="mb-4 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
              {SCORE_KEYS.map(({ key, label }) => (
                <div key={key} className="rounded-lg border border-white/8 bg-black/25 px-2 py-1.5">
                  <p className="font-mono text-[9px] text-white/35">{label}</p>
                  <p className="font-mono text-[13px] text-white/80">{selected.scores[key]}</p>
                </div>
              ))}
            </div>
            </ModalReveal>

            {hasOriginalDiff && (
              <ModalReveal index={3} resetKey={selected.id} skeleton={false}>
              <div className="mb-3 flex gap-1.5">
                <button type="button" onClick={() => setShowOriginal(false)}
                  className={`rounded-full border px-2.5 py-1 font-mono text-[10px] ${!showOriginal ? 'border-bla-lime/40 bg-bla-lime/15 text-bla-lime' : 'border-white/12 text-white/45'}`}>Current</button>
                <button type="button" onClick={() => setShowOriginal(true)}
                  className={`rounded-full border px-2.5 py-1 font-mono text-[10px] ${showOriginal ? 'border-bla-lime/40 bg-bla-lime/15 text-bla-lime' : 'border-white/12 text-white/45'}`}>Workshop original</button>
              </div>
              </ModalReveal>
            )}

            <ModalReveal index={4} resetKey={selected.id}>
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
            </ModalReveal>

            <ModalReveal index={5} resetKey={selected.id} className="mt-5">
            <div>
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
              <AutoGrowTextarea
                defaultValue={selected.claudeFitReason || ''}
                placeholder="Why this fit?"
                fieldKey={`fit-${selected.id}-${selected.claudeFitReason || ''}`}
                minRows={2}
                onSave={(val) => {
                  if (val !== (selected.claudeFitReason || '')) onUpdate({ ...selected, claudeFitReason: val });
                }}
                className="mt-2 w-full resize-none overflow-hidden rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-[12px] text-white/75 placeholder:text-white/25 outline-none focus:border-white/25"
              />
            </div>
            </ModalReveal>

            <ModalReveal index={6} resetKey={selected.id} className="mt-5">
            <div>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">Considerations</p>
              <AutoGrowTextarea
                defaultValue={selected.reviewNotes || ''}
                placeholder="Considerations… e.g. Which export? Who owns the input pack?"
                fieldKey={`bbb-${selected.id}-${selected.reviewNotes || ''}`}
                minRows={3}
                onSave={(val) => {
                  if (val !== (selected.reviewNotes || '')) onUpdate({ ...selected, reviewNotes: val });
                }}
                className="w-full resize-none overflow-hidden rounded-lg border border-white/10 bg-black/25 px-3 py-2.5 text-[13px] leading-relaxed text-white/80 placeholder:text-white/25 outline-none focus:border-bla-lime/30"
              />
            </div>
            </ModalReveal>

            <ModalReveal index={7} resetKey={selected.id} className="mt-5">
            <div>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">How to build this in Claude</p>
              <AutoGrowTextarea
                defaultValue={selected.howToGuide || ''}
                placeholder="Step-by-step guide for the team…"
                fieldKey={`howto-${selected.id}-${selected.howToGuide || ''}`}
                minRows={3}
                onSave={(val) => {
                  if (val !== (selected.howToGuide || '')) onUpdate({ ...selected, howToGuide: val });
                }}
                className="w-full resize-none overflow-hidden rounded-lg border border-white/10 bg-black/25 px-3 py-2.5 text-[13px] leading-relaxed text-white/80 placeholder:text-white/25 outline-none focus:border-bla-lime/30"
              />
            </div>
            </ModalReveal>

            <ModalReveal index={8} resetKey={selected.id} className="mt-5">
            <div>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">Definition of done</p>
              <AutoGrowTextarea
                defaultValue={selected.definitionOfDone || ''}
                placeholder="What must be true when the team presents?"
                fieldKey={`dod-${selected.id}-${selected.definitionOfDone || ''}`}
                minRows={3}
                onSave={(val) => {
                  if (val !== (selected.definitionOfDone || '')) onUpdate({ ...selected, definitionOfDone: val });
                }}
                className="w-full resize-none overflow-hidden rounded-lg border border-white/10 bg-black/25 px-3 py-2.5 text-[13px] leading-relaxed text-white/80 placeholder:text-white/25 outline-none focus:border-bla-lime/30"
              />
            </div>
            </ModalReveal>

            <ModalReveal index={9} resetKey={selected.id} className="mt-6">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10">
                  <Presentation className="h-4 w-4 text-white/70" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">Level 1 presentation debrief</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-white/50">
                    Archive from the office presentations. Level 2 is drafted from these notes.
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-white/10 bg-black/20 px-3.5 py-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">Probe questions</p>
                <ul className="mt-2 space-y-1.5">
                  {PROBE_QUESTIONS.map((q) => (
                    <li key={q} className="flex gap-2 text-[12px] leading-snug text-white/55">
                      <span className="mt-0.5 shrink-0 font-mono text-white/30">→</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 space-y-4">
                {DEBRIEF_FIELDS.map((field) => (
                  <div key={field.key}>
                    <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">{field.label}</p>
                      <p className="text-[11px] leading-snug text-white/40">{field.ask}</p>
                    </div>
                    <AutoGrowTextarea
                      defaultValue={selected[field.key] || ''}
                      placeholder={field.placeholder}
                      fieldKey={`${field.key}-${selected.id}-${selected[field.key] || ''}`}
                      minRows={3}
                      onSave={(val) => {
                        if (val !== (selected[field.key] || '')) {
                          onUpdate({ ...selected, [field.key]: val });
                        }
                      }}
                      className="w-full resize-none overflow-hidden rounded-lg border border-white/10 bg-black/25 px-3 py-2.5 text-[13px] leading-relaxed text-white/80 placeholder:text-white/25 outline-none focus:border-bla-lime/30"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-4">
                <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">Next unlock</p>
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
            </ModalReveal>

            <ModalReveal index={10} resetKey={selected.id} className="mt-5" skeleton={false}>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => { setSelectedId(null); setLevel2Id(selected.id); }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-bla-lime/40 bg-bla-lime/15 px-4 py-3 text-[14px] font-medium text-bla-lime"
              >
                <Sparkles className="h-4 w-4" />
                Open Level 2 shell
              </button>
              <button type="button" onClick={() => onUpdate({ ...selected, buildInClaudeCode: !selected.buildInClaudeCode })}
                className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-[14px] font-medium transition-colors ${
                  selected.buildInClaudeCode ? 'border border-white/15 text-white/70' : 'border border-white/15 text-white/70 hover:border-white/30 hover:text-white'
                }`}>
                <Code2 className="h-4 w-4" />
                {selected.buildInClaudeCode ? 'Selected as Level 1 Claude Case' : 'Select as Claude Case build'}
              </button>
              <button type="button" onClick={() => onUpdate({ ...selected, claudeReviewedByBlaBlaBuild: !selected.claudeReviewedByBlaBlaBuild })}
                className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-[14px] font-medium transition-colors ${
                  selected.claudeReviewedByBlaBlaBuild ? 'bg-bla-lime text-[#0a0b0e]' : 'border border-bla-lime/35 bg-bla-lime/10 text-bla-lime hover:bg-bla-lime/15'
                }`}>
                <BadgeCheck className="h-4 w-4" />
                {selected.claudeReviewedByBlaBlaBuild ? 'reviewed by blablabuild' : 'Mark reviewed by blablabuild'}
              </button>
            </div>
            </ModalReveal>
          </>
        )}
      </ModalFrame>
    </div>
  );
}

function AutoGrowTextarea({
  defaultValue,
  placeholder,
  fieldKey,
  minRows = 3,
  onSave,
  className,
}: {
  defaultValue: string;
  placeholder?: string;
  fieldKey: string;
  minRows?: number;
  onSave: (val: string) => void | Promise<void>;
  className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const fit = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useLayoutEffect(() => {
    fit();
  }, [fit, fieldKey, defaultValue]);

  return (
    <textarea
      ref={ref}
      key={fieldKey}
      defaultValue={defaultValue}
      placeholder={placeholder}
      rows={minRows}
      onInput={fit}
      onBlur={(e) => {
        const val = e.target.value.trim();
        if (val !== defaultValue) void onSave(val);
      }}
      className={className}
    />
  );
}

function Level2Block({
  n,
  label,
  hint,
  value,
  fieldKey,
  onSave,
}: {
  n: string;
  label: string;
  hint: string;
  value: string;
  fieldKey: string;
  onSave: (val: string) => void | Promise<void>;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-bla-lime/70">
          {n}. {label}
        </p>
        <p className="text-[11px] text-white/35">{hint}</p>
      </div>
      <AutoGrowTextarea
        defaultValue={value}
        fieldKey={fieldKey}
        minRows={3}
        onSave={(val) => {
          if (val !== value) void onSave(val);
        }}
        className="w-full resize-none overflow-hidden rounded-lg border border-white/10 bg-black/25 px-3 py-2.5 text-[13px] leading-relaxed text-white/80 placeholder:text-white/25 outline-none focus:border-bla-lime/30"
      />
    </label>
  );
}

const MODAL_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function ModalFrame({
  open,
  onClose,
  accent,
  panelKey,
  children,
}: {
  open: boolean;
  onClose: () => void;
  accent?: boolean;
  panelKey?: string;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center p-3 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0.12 : 0.2 }}
        >
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 cursor-default bg-black/60"
            onClick={onClose}
          />
          <motion.div
            key={panelKey}
            role="dialog"
            aria-modal="true"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.99 }}
            transition={{ duration: reduce ? 0.12 : 0.26, ease: MODAL_EASE }}
            className={`relative z-10 max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.5)] sm:p-6 ${
              accent
                ? 'border border-bla-lime/25 bg-[#101218]'
                : 'border border-white/12 bg-[#101218]'
            }`}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ModalReveal({
  children,
  index,
  resetKey,
  className,
  skeleton = true,
}: {
  children: ReactNode;
  index: number;
  resetKey: string;
  className?: string;
  skeleton?: boolean;
}) {
  const reduce = useReducedMotion();
  const [loaded, setLoaded] = useState(() => Boolean(reduce) || !skeleton);

  useEffect(() => {
    if (reduce || !skeleton) {
      setLoaded(true);
      return;
    }
    setLoaded(false);
    const hold = Math.min(160 + index * 55, 480);
    const t = window.setTimeout(() => setLoaded(true), hold);
    return () => window.clearTimeout(t);
  }, [reduce, skeleton, index, resetKey]);

  return (
    <motion.div
      className={`relative ${className ?? ''}`}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: reduce ? 0 : 0.04 + index * 0.04, ease: MODAL_EASE }}
    >
      <motion.div
        animate={{ opacity: loaded ? 1 : 0 }}
        transition={{ duration: reduce ? 0 : 0.22 }}
      >
        {children}
      </motion.div>
      <AnimatePresence>
        {!loaded && (
          <motion.div
            aria-hidden
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="absolute inset-0 overflow-hidden rounded-lg bg-[#101218]"
          >
            <div className="h-full min-h-[3.5rem] animate-pulse rounded-lg bg-gradient-to-b from-white/[0.07] via-white/[0.04] to-white/[0.02]" />
            <motion.div
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/[0.1] to-transparent"
              initial={{ x: '-70%' }}
              animate={{ x: '280%' }}
              transition={{ duration: 0.65, ease: 'easeInOut' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
