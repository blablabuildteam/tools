'use client';

import { useMemo, useState } from 'react';
import { Check, ChevronDown, ChevronUp, ClipboardList } from 'lucide-react';
import { projectAccent, resolveProjectHorizon, type ProjectCluster } from './projectClusters';
import { PRIORITY_STATUS_META, type UseCase } from './types';
import type {
  PrioritizeMetaState,
  ProjectDecisionKind,
} from './prioritizeMeta';

export type { ProjectDecisionKind, ProjectDecisionEntry } from './prioritizeMeta';
export type PrioritizeMeta = PrioritizeMetaState;

const PRE_STEPS = [
  {
    id: 'pre-cases',
    title: 'Use cases triageën (Yes / Maybe / No)',
    detail: 'Open elk project, beoordeel of de case interessant is — nog geen project-kill.',
  },
  {
    id: 'pre-projects',
    title: 'Projecten bevestigen / herschikken',
    detail: 'Grouping-modus: cases verplaatsen, mergen, nieuw project. Alleen op Yes/Maybe.',
  },
  {
    id: 'pre-now',
    title: 'Now-shortlist voorstellen',
    detail: 'Max 2–3 projecten in Now. Rest Near/Next/Later.',
  },
  {
    id: 'pre-owners',
    title: 'Owners + delivery (draft)',
    detail: 'Adsomnia-naam + Ads / bla / HN / BtR / TBD.',
  },
] as const;

const SIETSE_STEPS = [
  {
    id: 'sietse-cases',
    title: 'Cases Yes/No akkoord (~15 min)',
    detail: 'Snel door Maybe’s en No’s — wat valt echt af?',
  },
  {
    id: 'sietse-projects',
    title: 'Project scope (~15 min)',
    detail: 'Keep / Split / Park op de overgebleven cases.',
  },
  {
    id: 'sietse-now',
    title: 'Now = 2–3 projecten (~10 min)',
    detail: 'Wat starten we eerst?',
  },
  {
    id: 'sietse-open',
    title: 'Open vragen (~5 min)',
    detail: 'Delivery TBD, HN/BtR, WorkSpace later.',
  },
] as const;

const DECISION_META: Record<
  ProjectDecisionKind,
  { label: string; color: string; bg: string; border: string }
> = {
  pending: {
    label: 'Todo',
    color: 'text-white/50',
    bg: 'bg-white/5',
    border: 'border-white/15',
  },
  keep: {
    label: 'Keep',
    color: 'text-bla-lime',
    bg: 'bg-bla-lime/10',
    border: 'border-bla-lime/30',
  },
  split: {
    label: 'Split',
    color: 'text-amber-300',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/30',
  },
  park: {
    label: 'Park',
    color: 'text-sky-300',
    bg: 'bg-sky-400/10',
    border: 'border-sky-400/30',
  },
  kill: {
    label: 'Kill',
    color: 'text-red-300',
    bg: 'bg-red-400/10',
    border: 'border-red-400/30',
  },
};

interface Props {
  useCases: UseCase[];
  clusters: ProjectCluster[];
  meta: PrioritizeMetaState;
  saving?: boolean;
  onMetaChange: (next: PrioritizeMetaState) => void;
  onPersist: (next: PrioritizeMetaState) => void;
}

export default function PrioritizePlaybook({
  useCases,
  clusters,
  meta,
  saving,
  onMetaChange,
  onPersist,
}: Props) {
  const [open, setOpen] = useState(false);

  const toggleCheck = (id: string) => {
    const checklist = { ...(meta.checklist || {}) };
    checklist[id] = !checklist[id];
    onPersist({ ...meta, checklist });
  };

  const setDecision = (projectId: string, decision: ProjectDecisionKind) => {
    const projectDecisions = { ...(meta.projectDecisions || {}) };
    projectDecisions[projectId] = {
      ...(projectDecisions[projectId] || { note: '' }),
      decision,
      note: projectDecisions[projectId]?.note || '',
      updatedAt: new Date().toISOString(),
    };
    onPersist({ ...meta, projectDecisions });
  };

  const setNote = (projectId: string, note: string) => {
    const projectDecisions = { ...(meta.projectDecisions || {}) };
    projectDecisions[projectId] = {
      decision: projectDecisions[projectId]?.decision || 'pending',
      note,
      updatedAt: new Date().toISOString(),
    };
    onMetaChange({ ...meta, projectDecisions });
  };

  const flushNote = () => {
    onPersist(meta);
  };

  const preDone = PRE_STEPS.filter((s) => meta.checklist?.[s.id]).length;
  const sietseDone = SIETSE_STEPS.filter((s) => meta.checklist?.[s.id]).length;
  const decisionsDone = useMemo(() => {
    return clusters.filter((p) => {
      const d = meta.projectDecisions?.[p.id]?.decision;
      return d && d !== 'pending';
    }).length;
  }, [meta.projectDecisions, clusters]);

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-white/10 bg-[#0d0f12]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl border border-bla-lime/25 bg-bla-lime/10">
            <ClipboardList className="h-4 w-4 text-bla-lime" />
          </div>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-bla-lime/70">
              § playbook · duidelijkheid
            </p>
            <h3 className="font-host text-lg text-white">Stappen & decision log</h3>
            <p className="mt-0.5 text-[12px] text-white/40">
              Pre {preDone}/{PRE_STEPS.length} · Sietse {sietseDone}/{SIETSE_STEPS.length} · Projects{' '}
              {decisionsDone}/{clusters.length}
              {saving ? ' · saving…' : ''}
            </p>
          </div>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-white/40" />
        ) : (
          <ChevronDown className="h-4 w-4 text-white/40" />
        )}
      </button>

      {open && (
        <div className="space-y-6 border-t border-white/8 px-5 py-5">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
                1 · Jullie van tevoren
              </p>
              <ul className="mt-3 space-y-2">
                {PRE_STEPS.map((step, i) => {
                  const done = Boolean(meta.checklist?.[step.id]);
                  return (
                    <li key={step.id}>
                      <button
                        type="button"
                        onClick={() => toggleCheck(step.id)}
                        className={`flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                          done
                            ? 'border-bla-lime/25 bg-bla-lime/[0.06]'
                            : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                        }`}
                      >
                        <span
                          className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border ${
                            done
                              ? 'border-bla-lime/40 bg-bla-lime/20 text-bla-lime'
                              : 'border-white/20 text-transparent'
                          }`}
                        >
                          <Check className="h-3 w-3" />
                        </span>
                        <span>
                          <span className="block text-[13px] font-medium text-white">
                            {i + 1}. {step.title}
                          </span>
                          <span className="mt-0.5 block text-[12px] leading-relaxed text-white/45">
                            {step.detail}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
                2 · Met Sietse (~45 min)
              </p>
              <ul className="mt-3 space-y-2">
                {SIETSE_STEPS.map((step, i) => {
                  const done = Boolean(meta.checklist?.[step.id]);
                  return (
                    <li key={step.id}>
                      <button
                        type="button"
                        onClick={() => toggleCheck(step.id)}
                        className={`flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                          done
                            ? 'border-bla-lime/25 bg-bla-lime/[0.06]'
                            : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                        }`}
                      >
                        <span
                          className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border ${
                            done
                              ? 'border-bla-lime/40 bg-bla-lime/20 text-bla-lime'
                              : 'border-white/20 text-transparent'
                          }`}
                        >
                          <Check className="h-3 w-3" />
                        </span>
                        <span>
                          <span className="block text-[13px] font-medium text-white">
                            {i + 1}. {step.title}
                          </span>
                          <span className="mt-0.5 block text-[12px] leading-relaxed text-white/45">
                            {step.detail}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
              3 · Decision log per project
            </p>
            <p className="mt-1 text-[12px] text-white/40">
              Pas ná case triage. Keep = één initiatief · Split = twee · Park = later · Kill =
              project weg
            </p>
            <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
              {clusters.map((p) => {
                const entry = meta.projectDecisions?.[p.id] || {
                  decision: 'pending' as ProjectDecisionKind,
                  note: '',
                };
                const accent = projectAccent(p.id);
                const horizon = resolveProjectHorizon(p, useCases);
                const n = useCases.filter((u) => p.caseIds.includes(u.id)).length;
                return (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.02] p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: accent }}
                          />
                          <span className="font-mono text-[10px] text-white/40">
                            {n} cases · {PRIORITY_STATUS_META[horizon].short}
                          </span>
                        </div>
                        <p className="mt-1.5 font-host text-[15px] font-medium text-white">
                          {p.name}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(Object.keys(DECISION_META) as ProjectDecisionKind[]).map((kind) => {
                        const m = DECISION_META[kind];
                        const active = entry.decision === kind;
                        return (
                          <button
                            key={kind}
                            type="button"
                            onClick={() => setDecision(p.id, kind)}
                            className={`rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] ${
                              active
                                ? `${m.border} ${m.bg} ${m.color}`
                                : 'border-white/10 text-white/35 hover:text-white/60'
                            }`}
                          >
                            {m.label}
                          </button>
                        );
                      })}
                    </div>
                    <textarea
                      value={entry.note}
                      onChange={(e) => setNote(p.id, e.target.value)}
                      onBlur={flushNote}
                      placeholder="Notitie: wat erin/uit, owner, open vraag…"
                      rows={2}
                      className="mt-3 w-full resize-none rounded-xl border border-white/10 bg-[#0a0b0e] px-3 py-2 text-[12px] text-white/80 placeholder:text-white/25"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
