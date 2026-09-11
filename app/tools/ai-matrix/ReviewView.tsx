'use client';

import { useMemo, useState } from 'react';
import {
  ArrowLeft, Filter, ClipboardList, Download, Split, PauseCircle,
  RotateCcw, CircleDot,
} from 'lucide-react';
import {
  type UseCase, type ReviewStatus, getDeptColor, sortByDeptThenName, textChanged,
} from './types';

const REVIEW_STATUS_META: Record<ReviewStatus, {
  label: string; color: string; bg: string; border: string;
  Icon: typeof CircleDot;
}> = {
  pending:      { label: 'Needs review', color: 'text-white/55', bg: 'bg-white/5', border: 'border-white/15', Icon: CircleDot },
  reviewed:     { label: 'Normalized', color: 'text-bla-lime', bg: 'bg-bla-lime/10', border: 'border-bla-lime/30', Icon: Download },
  'needs-split': { label: 'Split later', color: 'text-amber-300', bg: 'bg-amber-400/10', border: 'border-amber-400/30', Icon: Split },
  deferred:     { label: 'Deferred', color: 'text-white/40', bg: 'bg-white/[0.03]', border: 'border-white/10', Icon: PauseCircle },
};

const SCORE_KEYS: { key: keyof UseCase['scores']; label: string }[] = [
  { key: 'businessImpact', label: 'Impact' },
  { key: 'frequency', label: 'Frequency' },
  { key: 'aiSuitability', label: 'Fit for AI' },
  { key: 'implementation', label: 'Speed' },
  { key: 'risk', label: 'Safety' },
  { key: 'adoption', label: 'Adaptability' },
];

type ListFilter = 'pending' | 'favorites' | 'changed' | 'reviewed' | 'all';

interface Props {
  useCases: UseCase[];
  onBack: () => void;
  onUpdate: (uc: UseCase) => void | Promise<void>;
}

export default function ReviewView({ useCases, onBack, onUpdate }: Props) {
  const [listFilter, setListFilter] = useState<ListFilter>('pending');
  const [deptFilter, setDeptFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const departments = useMemo(
    () => Array.from(new Set(useCases.map((uc) => uc.label || 'General'))).sort(),
    [useCases]
  );

  const stats = useMemo(() => ({
    pending: useCases.filter((uc) => (uc.reviewStatus || 'pending') === 'pending').length,
    reviewed: useCases.filter((uc) => uc.reviewStatus === 'reviewed').length,
    split: useCases.filter((uc) => uc.reviewStatus === 'needs-split').length,
    deferred: useCases.filter((uc) => uc.reviewStatus === 'deferred').length,
  }), [useCases]);

  const filtered = useMemo(() => {
    let rows = [...useCases];
    if (listFilter === 'pending') rows = rows.filter((uc) => (uc.reviewStatus || 'pending') === 'pending');
    if (listFilter === 'reviewed') rows = rows.filter((uc) => uc.reviewStatus === 'reviewed');
    if (listFilter === 'favorites') rows = rows.filter((uc) => uc.isWinner);
    if (listFilter === 'changed') {
      rows = rows.filter((uc) => {
        const orig = uc.originalInput;
        return !!orig && (textChanged(orig.name, uc.name) || textChanged(orig.description, uc.description) || textChanged(orig.solution, uc.solution));
      });
    }
    if (deptFilter !== 'all') rows = rows.filter((uc) => (uc.label || 'General') === deptFilter);
    return rows.sort(sortByDeptThenName);
  }, [useCases, listFilter, deptFilter]);

  const selected = selectedId ? useCases.find((uc) => uc.id === selectedId) : null;
  const original = selected?.originalInput;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <button type="button" onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-[15px] font-medium text-white/85 transition-colors hover:border-bla-lime/40 hover:bg-bla-lime/10 hover:text-bla-lime">
        <ArrowLeft className="h-4 w-4" />
        Back to matrix
      </button>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-bla-lime/70">§ review · normalize</p>
          <h2 className="mt-1 font-host text-2xl font-light text-white">Before → after workshop copy</h2>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-white/50">
            Keep the original participant input frozen. Rewrite the live case into a shared format: clear title, problem, solution.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {([
            ['pending', stats.pending, 'Needs review'],
            ['reviewed', stats.reviewed, 'Normalized'],
            ['needs-split', stats.split, 'Split'],
            ['deferred', stats.deferred, 'Deferred'],
          ] as [ReviewStatus, number, string][]).map(([key, count, label]) => {
            const meta = REVIEW_STATUS_META[key];
            return (
              <div key={key} className={`rounded-xl border px-3 py-2 ${meta.border} ${meta.bg}`}>
                <p className={`font-mono text-[9px] uppercase tracking-[0.14em] ${meta.color}`}>{label}</p>
                <p className={`font-host text-xl font-medium ${meta.color}`}>{count}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[13px] leading-relaxed text-white/55">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">Shared format · </span>
        <strong className="font-medium text-white/75">Title</strong> (action-oriented) ·{' '}
        <strong className="font-medium text-white/75">Problem</strong> (who / pain / frequency) ·{' '}
        <strong className="font-medium text-white/75">Solution</strong> (what AI does, inputs → outputs)
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Filter className="h-3.5 w-3.5 text-white/35" />
        {([
          ['pending', 'Needs review'],
          ['favorites', 'Favorites'],
          ['changed', 'Already changed'],
          ['reviewed', 'Normalized'],
          ['all', 'All cases'],
        ] as [ListFilter, string][]).map(([key, label]) => (
          <button key={key} type="button" onClick={() => setListFilter(key)}
            className={`rounded-full border px-3 py-1 font-mono text-[11px] transition-colors ${
              listFilter === key ? 'border-bla-lime/40 bg-bla-lime/15 text-bla-lime' : 'border-white/12 text-white/45 hover:border-white/25 hover:text-white/75'
            }`}>
            {label}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-white/15" />
        <button type="button" onClick={() => setDeptFilter('all')}
          className={`rounded-full border px-3 py-1 font-mono text-[11px] transition-colors ${
            deptFilter === 'all' ? 'border-white/25 bg-white/10 text-white' : 'border-white/12 text-white/45'
          }`}>
          All depts
        </button>
        {departments.map((dept) => (
          <button key={dept} type="button" onClick={() => setDeptFilter(dept)}
            className={`rounded-full border px-3 py-1 font-mono text-[11px] transition-colors ${
              deptFilter === dept ? 'border-white/25 bg-white/10 text-white' : 'border-white/12 text-white/45'
            }`}>
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: getDeptColor(dept) }} />
            {dept}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_420px]">
        <div className="space-y-2.5">
          {filtered.length === 0 && (
            <p className="rounded-xl border border-dashed border-white/12 p-8 text-center text-sm text-white/35">No cases in this filter.</p>
          )}
          {filtered.map((uc) => {
            const status = REVIEW_STATUS_META[uc.reviewStatus || 'pending'];
            const isActive = selectedId === uc.id;
            const orig = uc.originalInput;
            const edited = orig && (textChanged(orig.name, uc.name) || textChanged(orig.description, uc.description) || textChanged(orig.solution, uc.solution));
            return (
              <button key={uc.id} type="button" onClick={() => setSelectedId(uc.id)}
                className={`w-full rounded-xl border p-4 text-left transition-colors ${
                  isActive ? 'border-bla-lime/35 bg-bla-lime/[0.07]' : 'border-white/8 bg-white/[0.02] hover:border-white/15'
                }`}>
                <div className="flex items-start gap-3">
                  <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: getDeptColor(uc.label || 'General') }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[15px] font-medium text-white">{uc.name}</p>
                      {uc.isWinner && <span className="rounded-full bg-white/8 px-2 py-0.5 font-mono text-[10px] text-white/45">Favorite</span>}
                      {uc.buildInClaudeCode && <span className="rounded-full bg-bla-lime/15 px-2 py-0.5 font-mono text-[10px] text-bla-lime">Claude Code</span>}
                    </div>
                    <p className="mt-1 font-mono text-[11px] text-white/40">
                      {uc.label || 'General'} · by {uc.addedBy || 'Unknown'}{edited ? ' · edited' : ''}
                    </p>
                    <p className="mt-2 line-clamp-2 text-[13px] leading-snug text-white/50">{uc.description}</p>
                    <span className={`mt-2.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] ${status.border} ${status.bg} ${status.color}`}>
                      <status.Icon className="h-3 w-3" />{status.label}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          {selected ? (
            <div className="rounded-2xl border border-white/12 bg-[#101218] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
              <div className="mb-1 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: getDeptColor(selected.label || 'General') }} />
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">{selected.label || 'General'}</p>
              </div>
              <h3 className="font-host text-lg font-medium leading-snug text-white">{selected.name}</h3>
              <p className="mt-1 font-mono text-[11px] text-white/40">by {selected.addedBy || 'Unknown'}</p>

              <div className="mt-5 grid gap-3">
                <div className="rounded-xl border border-white/8 bg-black/30 p-3.5">
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">Before · workshop original</p>
                  {original ? (
                    <div className="space-y-2.5 text-[12px] leading-relaxed">
                      <div><p className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/30">Title</p><p className="text-white/55">{original.name}</p></div>
                      <div><p className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/30">Problem</p><p className="whitespace-pre-wrap text-white/55">{original.description}</p></div>
                      <div><p className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/30">Solution</p><p className="whitespace-pre-wrap text-white/45">{original.solution || '—'}</p></div>
                    </div>
                  ) : (
                    <p className="text-[12px] text-white/35">No frozen original yet (will lock on first edit).</p>
                  )}
                </div>

                <div className="rounded-xl border border-bla-lime/20 bg-bla-lime/[0.04] p-3.5">
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-bla-lime/70">After · normalized (editable)</p>
                  <label className="block">
                    <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/35">Title</span>
                    <input defaultValue={selected.name} key={`name-${selected.id}`}
                      onBlur={(e) => {
                        const val = e.target.value.trim();
                        if (val && val !== selected.name) onUpdate({ ...selected, name: val });
                      }}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-[13px] text-white outline-none focus:border-bla-lime/30" />
                  </label>
                  <label className="mt-3 block">
                    <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/35">Problem</span>
                    <textarea defaultValue={selected.description} rows={4} key={`desc-${selected.id}`}
                      onBlur={(e) => {
                        const val = e.target.value.trim();
                        if (val && val !== selected.description) onUpdate({ ...selected, description: val });
                      }}
                      className="mt-1 w-full resize-none rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-[13px] leading-relaxed text-white/85 outline-none focus:border-bla-lime/30" />
                  </label>
                  <label className="mt-3 block">
                    <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/35">Solution</span>
                    <textarea defaultValue={selected.solution || ''} rows={4} key={`sol-${selected.id}`}
                      onBlur={(e) => {
                        const val = e.target.value.trim();
                        if (val !== (selected.solution || '')) onUpdate({ ...selected, solution: val || undefined });
                      }}
                      className="mt-1 w-full resize-none rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-[13px] leading-relaxed text-bla-lime/75 outline-none focus:border-bla-lime/30" />
                  </label>
                </div>
              </div>

              {original?.scores && (
                <div className="mt-4">
                  <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">Scores · original vs current</p>
                  <div className="grid grid-cols-3 gap-1.5">
                    {SCORE_KEYS.map(({ key, label }) => {
                      const origScore = original.scores?.[key];
                      const curScore = selected.scores[key];
                      const changed = origScore !== undefined && origScore !== curScore;
                      return (
                        <div key={key} className={`rounded-lg border px-2 py-1.5 ${changed ? 'border-amber-400/30 bg-amber-400/10' : 'border-white/8 bg-black/20'}`}>
                          <p className="font-mono text-[9px] text-white/35">{label}</p>
                          <p className="font-mono text-[12px] text-white/70">{origScore}{changed ? ` → ${curScore}` : ''}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <label className="mt-4 block">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">Review notes</span>
                <textarea defaultValue={selected.reviewNotes || ''} placeholder="Out of scope, merge with…, rescore after split…" rows={3} key={`notes-${selected.id}`}
                  onBlur={(e) => {
                    const val = e.target.value.trim();
                    if (val !== (selected.reviewNotes || '')) onUpdate({ ...selected, reviewNotes: val || undefined });
                  }}
                  className="mt-1.5 w-full resize-none rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-[12px] text-white/75 outline-none focus:border-white/25" />
              </label>

              <div className="mt-4">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">Review status</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {(Object.keys(REVIEW_STATUS_META) as ReviewStatus[]).map((status) => {
                    const meta = REVIEW_STATUS_META[status];
                    const active = (selected.reviewStatus || 'pending') === status;
                    return (
                      <button key={status} type="button" onClick={() => onUpdate({ ...selected, reviewStatus: status })}
                        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-left text-[11px] transition-colors ${
                          active ? `${meta.border} ${meta.bg} ${meta.color}` : 'border-white/10 text-white/45 hover:border-white/20'
                        }`}>
                        <meta.Icon className="h-3.5 w-3.5 shrink-0" />{meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {original && (
                <button type="button" onClick={() => onUpdate({
                  ...selected,
                  name: original.name || selected.name,
                  description: original.description || selected.description,
                  solution: original.solution,
                  label: original.label || selected.label,
                  reviewStatus: 'pending',
                })}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/12 px-4 py-2.5 text-[13px] text-white/55 transition-colors hover:border-white/25 hover:text-white/80">
                  <RotateCcw className="h-3.5 w-3.5" />Restore original copy
                </button>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/12 p-6 text-center">
              <ClipboardList className="mx-auto h-6 w-6 text-white/25" />
              <p className="mt-3 text-sm text-white/40">Pick a case to compare original workshop input with the normalized version.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
