'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ChevronRight, ArrowLeft, BarChart3, Copy, Check, Users, RefreshCw, Info, Share2, Download, Trophy, AlertTriangle, Star, Code2, ClipboardCheck, HelpCircle, ListOrdered, Map as MapIcon } from 'lucide-react';
import Link from 'next/link';
import ClaudeCasesView from './ClaudeCasesView';
import ReviewView from './ReviewView';
import PrioritizeView from './PrioritizeView';
import RoadmapView from './RoadmapView';
import {
  workshopDescription,
  workshopLabel,
  workshopName,
  workshopSolution,
} from './types';
/** Internal normalize/review UI — local `npm run dev` only, never on shared/production URLs */
const SHOW_REVIEW = process.env.NODE_ENV === 'development';

// ─── Types ───────────────────────────────────────────────────────────────────

type QuadrantKey = 'quick' | 'strategic' | 'low' | 'later';
type View = 'landing' | 'matrix' | 'add' | 'workshop' | 'results' | 'claude' | 'review' | 'prioritize' | 'roadmap';
type ClaudeFit = 'good' | 'stretch' | 'blocked';
type PriorityStatus = 'now' | 'near' | 'next' | 'later' | 'kill';
type DeliveryPartner =
  | 'adsomnia'
  | 'blablabuild'
  | 'harlem-next'
  | 'bending-the-rules'
  | 'tbd';

interface Scores {
  businessImpact: number;
  frequency: number;
  aiSuitability: number;
  implementation: number;
  risk: number;
  adoption: number;
}

interface KnockoutAnswers {
  recurring: boolean | null;
  costly: boolean | null;
  dataAvailable: boolean | null;
  standardized: boolean | null;
}

interface UseCase {
  id: string;
  name: string;
  description: string;
  addedBy?: string;
  knockout: KnockoutAnswers;
  scores: Scores;
  // Extended fields from production
  label?: string;
  solution?: string;
  owner?: string;
  isWinner?: boolean;
  presented?: boolean;
  buildInClaudeCode?: boolean;
  claudeFit?: ClaudeFit;
  claudeFitReason?: string;
  reviewNotes?: string;
  reviewStatus?: 'pending' | 'reviewed' | 'needs-split' | 'deferred';
  howToGuide?: string;
  definitionOfDone?: string;
  claudeReviewedByBlaBlaBuild?: boolean;
  presentationOutcome?: string;
  presentationFinding?: string;
  presentationChallenge?: string;
  presentationAmbition?: string;
  presentationNextUnlock?: 'data' | 'mcp' | 'cross-team' | 'workflow';
  priorityRank?: number;
  priorityStatus?: PriorityStatus;
  deliveryPartners?: DeliveryPartner[];
  interest?: 'yes' | 'maybe' | 'no';
  originalInput?: {
    name?: string;
    description?: string;
    solution?: string;
  };
}

const CLAUDE_FIT_META: Record<ClaudeFit, { label: string; short: string; color: string; bg: string; border: string }> = {
  good: { label: 'Claude-ready', short: 'Ready', color: 'text-bla-lime', bg: 'bg-bla-lime/10', border: 'border-bla-lime/30' },
  stretch: { label: 'Possible with caveats', short: 'Caveats', color: 'text-amber-300', bg: 'bg-amber-400/10', border: 'border-amber-400/30' },
  blocked: { label: 'Needs platform/API', short: 'API', color: 'text-red-300', bg: 'bg-red-400/10', border: 'border-red-400/30' },
};

const DEFAULT_LABELS = [
  'General',
  'Media Buying',
  'Affiliate Management',
  'E-mail Marketing',
  'Finance',
  'HR',
  'BI / Pricing',
] as const;

const DEPT_COLORS: Record<string, string> = {
  'Affiliate Management': '#f472b6',
  'Media Buying': '#60a5fa',
  'BI / Pricing': '#a78bfa',
  'Finance': '#34d399',
  'HR': '#fbbf24',
  'E-mail Marketing': '#f97316',
  'General': '#6b7280',
};

function getDeptColor(label: string): string {
  return DEPT_COLORS[label] || DEPT_COLORS['General'];
}

// ─── Config ──────────────────────────────────────────────────────────────────

const CRITERIA: {
  key: keyof Scores;
  label: string;
  question: string;
  hint: string;
  weight: number;
  scaleLabels: [string, string];
}[] = [
  { key: 'businessImpact', label: 'Impact', question: 'How big is the business upside if this works?', hint: 'You already answered yes/no on “direct impact” in Quick check. Here: how large — hours saved, fewer errors, more revenue.', weight: 0.3, scaleLabels: ['Small improvement', 'Big improvement'] },
  { key: 'frequency', label: 'How often', question: 'How often does this work show up?', hint: 'You already answered yes/no on “repetitive” in Quick check. Here: how frequent — monthly = lower, daily/weekly = higher.', weight: 0.2, scaleLabels: ['Rarely', 'Daily / continuous'] },
  { key: 'aiSuitability', label: 'Fit for AI', question: 'How well can AI or automation actually do this kind of work?', hint: 'Strong: sorting, drafting, summarising, matching, checking. Weak: negotiation, taste calls, one-off strategy.', weight: 0.2, scaleLabels: ['Weak fit', 'Strong fit'] },
  { key: 'implementation', label: 'Speed to build', question: 'How fast can we ship a useful first version?', hint: 'Fast: helper in Slack/email, simple draft tool. Slow: new platform, many integrations.', weight: 0.1, scaleLabels: ['Many months', 'Days / weeks'] },
  { key: 'risk', label: 'Low risk', question: 'How safe is this for data, compliance and the business?', hint: 'Higher risk: customer/personal data, money movements, external messages. Lower risk: internal drafts a human still checks.', weight: 0.1, scaleLabels: ['High risk', 'Low risk'] },
  { key: 'adoption', label: 'Will it be used', question: 'Will the team actually use this in their daily work?', hint: 'High: clear owner + fits an existing habit. Low: nice-to-have with no owner.', weight: 0.1, scaleLabels: ['Unlikely', 'Yes, clearly'] },
];

const KNOCKOUT_QUESTIONS: {
  key: keyof KnockoutAnswers;
  label: string;
  q: string;
  yesMeans: string;
  noMeans: string;
}[] = [
  { key: 'recurring', label: 'Repetitive & frequent?', q: 'Does this come back weekly/daily and eat manual time?', yesMeans: 'High automation potential.', noMeans: 'One-off or rare — usually not worth building first.' },
  { key: 'dataAvailable', label: 'Data digitally available?', q: 'Is the info AI needs already digital and reachable?', yesMeans: 'You can start with prompts / agents.', noMeans: 'First unlock or digitise data — that’s a blocker.' },
  { key: 'standardized', label: 'Clear & fixed process?', q: 'Are the steps clear for everyone — and mostly the same each time?', yesMeans: 'Good fit for an AI workflow or agent.', noMeans: 'Process is still messy — streamline before automating.' },
  { key: 'costly', label: 'Direct business impact?', q: 'Would fixing this clearly save time, cut errors, or grow revenue?', yesMeans: 'Strong business case.', noMeans: 'Nice-to-have — little real upside.' },
];

const WORKSHOP_QS = [
  { q: 'What exact problem are we solving?', why: 'Stops vague ideas like “we need AI for X”.' },
  { q: 'How is this done today, and by whom?', why: 'Makes the current pain and owner concrete.' },
  { q: 'What would a tiny first version look like?', why: 'Separates a Quick Win pilot from a Major Project.' },
  { q: 'What data or systems must we connect?', why: 'Surfaces hidden effort and blockers early.' },
  { q: 'Who owns this after the workshop?', why: 'No owner = low adoption, even with a high score.' },
];

const TYPICAL = [
  'Campaign performance Q&A',
  'Creative brief generator',
  'Affiliate offer summariser',
  'Email subject & copy assist',
  'Invoice / payout check helper',
  'CRM lead enrichment',
  'Pricing anomaly alerts',
  'HR policy chatbot',
  'Weekly report auto-draft',
  'Fraud / anomaly flagging',
  'Advertiser onboarding checklist',
  'Audience insight digests',
];

const DECISION_RULES = [
  'Clear problem + clear owner',
  'Useful first version within weeks, not months',
  'Data is reachable (even if messy)',
  'Team will actually use it in daily work',
];

const Q_META: Record<QuadrantKey, { dot: string; bg: string; label: string; desc: string }> = {
  quick:     { dot: '#ceff00', bg: 'rgba(206,255,0,0.06)',   label: 'Quick Wins',     desc: 'High impact, low effort' },
  strategic: { dot: '#60a5fa', bg: 'rgba(96,165,250,0.06)',  label: 'Major Projects', desc: 'High impact, more effort' },
  low:       { dot: '#6b7280', bg: 'rgba(107,114,128,0.04)', label: 'Fill-ins',       desc: 'Low impact, low effort' },
  later:     { dot: '#f59e0b', bg: 'rgba(245,158,11,0.05)',  label: 'Backlog',        desc: 'Low impact, high effort' },
};

const POLL_INTERVAL = 5000; // ms

// ─── Helpers ─────────────────────────────────────────────────────────────────

function calcScore(s: Scores): number {
  return s.businessImpact * 0.3 + s.frequency * 0.2 + s.aiSuitability * 0.2 +
    s.implementation * 0.1 + s.risk * 0.1 + s.adoption * 0.1;
}

function sortUseCasesByScore(cases: UseCase[]): UseCase[] {
  return [...cases].sort((a, b) => {
    const diff = calcScore(b.scores) - calcScore(a.scores);
    return diff !== 0 ? diff : a.id.localeCompare(b.id);
  });
}

function getQuadrant(uc: UseCase): QuadrantKey {
  const impact = uc.scores.businessImpact;
  const effort = 6 - uc.scores.implementation;
  if (impact >= 3 && effort <= 3) return 'quick';
  if (impact >= 3) return 'strategic';
  if (effort <= 3) return 'low';
  return 'later';
}

function randomCode(len = 6): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function makeId(): string {
  return Math.random().toString(36).slice(2, 10);
}

// risk score is 1 (risky) – 5 (very safe); flag the low end
function isHighRisk(uc: UseCase): boolean {
  return uc.scores.risk > 0 && uc.scores.risk <= 2;
}

function exportCsv(useCases: UseCase[], sessionLabel: string) {
  const headers = [
    'Use case', 'Description', 'Added by', 'Quadrant', 'Total score',
    ...CRITERIA.map((c) => c.label),
    'High risk',
  ];
  const rows = useCases.map((uc) => [
    uc.name,
    uc.description,
    uc.addedBy ?? '',
    Q_META[getQuadrant(uc)].label,
    calcScore(uc.scores).toFixed(2),
    ...CRITERIA.map((c) => String(uc.scores[c.key])),
    isHighRisk(uc) ? 'yes' : 'no',
  ]);
  const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map((r) => r.map(esc).join(',')).join('\r\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ai-matrix-${sessionLabel.replace(/\s+/g, '-').toLowerCase() || 'session'}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Score5({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`flex h-10 flex-1 items-center justify-center rounded-lg border text-sm font-medium transition-all ${
            value === n ? 'border-bla-lime bg-bla-lime font-bold text-[#0a0b0e]'
            : n < value ? 'border-bla-lime/30 bg-bla-lime/10 text-bla-lime'
            : 'border-white/10 bg-white/[0.02] text-white/40 hover:border-white/20 hover:text-white/70'
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

function YesNo({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div className="flex gap-2">
      {([true, false] as const).map((v) => (
        <button
          key={String(v)}
          type="button"
          onClick={() => onChange(v)}
          className={`flex h-9 w-14 items-center justify-center rounded-lg border text-sm font-medium transition-all ${
            value === v
              ? v ? 'border-bla-lime bg-bla-lime text-[#0a0b0e]'
                  : 'border-red-400/50 bg-red-400/15 text-red-400'
              : 'border-white/10 bg-white/[0.02] text-white/40 hover:border-white/20 hover:text-white/70'
          }`}
        >
          {v ? 'Yes' : 'No'}
        </button>
      ))}
    </div>
  );
}

/** Stable hash jitter so identical scores don't stack on the same pixel. */
function hashJitter(id: string): { dx: number; dy: number } {
  let t = 0;
  for (let i = 0; i < id.length; i++) t = (Math.imul(31, t) + id.charCodeAt(i)) | 0;
  return { dx: (t % 9 - 4) * 3.2, dy: ((t >> 4) % 9 - 4) * 3.2 };
}

const PLOT_MIN_DIST = 13;

/** Place dots with hash jitter + iterative separation (same approach as production). */
function layoutPlotPoints(
  useCases: UseCase[],
  toX: (effort: number) => number,
  toY: (impact: number) => number,
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
): { uc: UseCase; x: number; y: number }[] {
  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  const points = [...useCases]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((uc) => {
      const effort = 6 - uc.scores.implementation;
      const impact = uc.scores.businessImpact;
      const { dx, dy } = hashJitter(uc.id);
      return {
        uc,
        x: clamp(toX(effort) + dx, bounds.minX, bounds.maxX),
        y: clamp(toY(impact) + dy, bounds.minY, bounds.maxY),
      };
    });

  for (let iter = 0; iter < 6; iter++) {
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const sx = points[j].x - points[i].x;
        const sy = points[j].y - points[i].y;
        const dist = Math.hypot(sx, sy) || 0.01;
        if (dist >= PLOT_MIN_DIST) continue;
        const push = (PLOT_MIN_DIST - dist) * 0.35;
        const nx = sx / dist;
        const ny = sy / dist;
        points[i].x = clamp(points[i].x - nx * push, bounds.minX, bounds.maxX);
        points[i].y = clamp(points[i].y - ny * push, bounds.minY, bounds.maxY);
        points[j].x = clamp(points[j].x + nx * push, bounds.minX, bounds.maxX);
        points[j].y = clamp(points[j].y + ny * push, bounds.minY, bounds.maxY);
      }
    }
  }
  return points;
}

function MatrixPlot({ useCases, hoveredId, selectedId, onHover, onSelect }: {
  useCases: UseCase[];
  hoveredId: string | null;
  selectedId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  const W = 560; const H = 400;
  const PAD = { t: 22, r: 14, b: 44, l: 42 };
  const plotW = W - PAD.l - PAD.r;
  const plotH = H - PAD.t - PAD.b;
  const midX = PAD.l + plotW / 2;
  const midY = PAD.t + plotH / 2;

  const toX = (effort: number) => PAD.l + ((effort - 1) / 4) * plotW;
  const toY = (impact: number) => PAD.t + plotH - ((impact - 1) / 4) * plotH;

  const points = layoutPlotPoints(useCases, toX, toY, {
    minX: PAD.l + 6,
    maxX: PAD.l + plotW - 6,
    minY: PAD.t + 6,
    maxY: PAD.t + plotH - 6,
  });

  const drawOrder = [...points].sort((a, b) => {
    const focus = selectedId || hoveredId;
    if (!focus) return 0;
    if (a.uc.id === focus) return 1;
    if (b.uc.id === focus) return -1;
    return 0;
  });

  const hoverPoint = !selectedId && hoveredId
    ? points.find((p) => p.uc.id === hoveredId)
    : undefined;
  const tipStyle = hoverPoint
    ? {
        left: `${(hoverPoint.x / W) * 100}%`,
        top: `${(hoverPoint.y / H) * 100}%`,
        transform: [
          hoverPoint.x / W > 0.55 ? 'translateX(calc(-100% - 10px))' : 'translateX(10px)',
          hoverPoint.y / H > 0.5 ? 'translateY(calc(-100% - 8px))' : 'translateY(8px)',
        ].join(' '),
      }
    : undefined;

  const QLABELS: { q: QuadrantKey; x: number; y: number; anchor: 'start' | 'end' | 'middle' }[] = [
    { q: 'quick',     x: PAD.l + 10,          y: PAD.t + 16,            anchor: 'start' },
    { q: 'strategic', x: PAD.l + plotW - 10,  y: PAD.t + 16,            anchor: 'end'   },
    { q: 'low',       x: PAD.l + 10,          y: PAD.t + plotH - 10,    anchor: 'start' },
    { q: 'later',     x: PAD.l + plotW - 10,  y: PAD.t + plotH - 10,    anchor: 'end'   },
  ];

  return (
    <div className="relative w-full" onMouseLeave={() => onHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full touch-none" style={{ fontFamily: 'inherit' }}>
        <rect x={PAD.l} y={PAD.t}   width={plotW / 2} height={plotH / 2} fill={Q_META.quick.bg} />
        <rect x={midX}  y={PAD.t}   width={plotW / 2} height={plotH / 2} fill={Q_META.strategic.bg} />
        <rect x={PAD.l} y={midY}    width={plotW / 2} height={plotH / 2} fill={Q_META.low.bg} />
        <rect x={midX}  y={midY}    width={plotW / 2} height={plotH / 2} fill={Q_META.later.bg} />
        <rect x={PAD.l} y={PAD.t}   width={plotW}     height={plotH} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <line x1={midX} y1={PAD.t}  x2={midX} y2={PAD.t + plotH} stroke="rgba(255,255,255,0.10)" strokeWidth="1" strokeDasharray="5 5" />
        <line x1={PAD.l} y1={midY}  x2={PAD.l + plotW} y2={midY} stroke="rgba(255,255,255,0.10)" strokeWidth="1" strokeDasharray="5 5" />

        {QLABELS.map(({ q, x, y, anchor }) => (
          <text key={q} x={x} y={y} textAnchor={anchor} fontSize="9" fill={Q_META[q].dot} opacity="0.8" fontFamily="monospace" letterSpacing="0.08em">
            {Q_META[q].label.toUpperCase()}
          </text>
        ))}

        {/* X axis */}
        <line x1={PAD.l} y1={PAD.t + plotH} x2={PAD.l + plotW} y2={PAD.t + plotH} stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" />
        {[1, 2, 3, 4, 5].map((n) => {
          const x = toX(n);
          return (
            <g key={`ex-${n}`}>
              <line x1={x} y1={PAD.t + plotH} x2={x} y2={PAD.t + plotH + 5} stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
              <text x={x} y={PAD.t + plotH + 16} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.4)" fontFamily="monospace">{n}</text>
            </g>
          );
        })}
        <text x={PAD.l} y={394} textAnchor="start" fontSize="10" fill="rgba(255,255,255,0.55)" fontFamily="monospace" letterSpacing="0.06em">LOW EFFORT</text>
        <text x={PAD.l + plotW} y={394} textAnchor="end" fontSize="10" fill="rgba(255,255,255,0.55)" fontFamily="monospace" letterSpacing="0.06em">HIGH EFFORT</text>

        {/* Y axis */}
        <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={PAD.t + plotH} stroke="rgba(255,255,255,0.28)" strokeWidth="1.5" />
        {[1, 2, 3, 4, 5].map((n) => {
          const y = toY(n);
          return (
            <g key={`iy-${n}`}>
              <line x1={PAD.l - 5} y1={y} x2={PAD.l} y2={y} stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
              <text x={PAD.l - 8} y={y + 3} textAnchor="end" fontSize="8" fill="rgba(255,255,255,0.4)" fontFamily="monospace">{n}</text>
            </g>
          );
        })}
        <text x={12} y={PAD.t + 10} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.55)" fontFamily="monospace" letterSpacing="0.04em" transform={`rotate(-90, 12, ${PAD.t + 10})`}>HIGH IMPACT</text>
        <text x={12} y={PAD.t + plotH - 4} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.55)" fontFamily="monospace" letterSpacing="0.04em" transform={`rotate(-90, 12, ${PAD.t + plotH - 4})`}>LOW IMPACT</text>

        {drawOrder.map(({ uc, x: cx, y: cy }) => {
          const color = getDeptColor(uc.label || 'General');
          const isActive = hoveredId === uc.id || selectedId === uc.id;
          const highRisk = isHighRisk(uc);
          const r = 4.5;

          return (
            <g
              key={uc.id}
              onMouseEnter={() => onHover(uc.id)}
              onClick={() => onSelect(uc.id)}
              style={{ cursor: 'pointer' }}
            >
              <circle cx={cx} cy={cy} r={20} fill="transparent" />
              <circle cx={cx} cy={cy} r={r} fill={color} opacity={isActive ? 1 : 0.9} />
              {uc.presented && (
                <path
                  d={`M ${cx - 1.7} ${cy + 0.15} L ${cx - 0.3} ${cy + 1.6} L ${cx + 1.9} ${cy - 1.5}`}
                  fill="none"
                  stroke="#0a0b0e"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {uc.isWinner && <circle cx={cx} cy={cy} r={r + 3.5} fill="none" stroke="#ceff00" strokeWidth="1.25" />}
              {highRisk && <circle cx={cx} cy={cy} r={r + 2.5} fill="none" stroke="#f87171" strokeWidth="1" strokeDasharray="2 2" />}
            </g>
          );
        })}

        {useCases.length === 0 && (
          <text x={PAD.l + plotW / 2} y={PAD.t + plotH / 2 + 4} textAnchor="middle" fontSize="12" fill="rgba(255,255,255,0.18)" fontFamily="inherit">
            Add use cases to plot them here
          </text>
        )}
      </svg>

      {hoverPoint && tipStyle && (
        <div
          className="pointer-events-none absolute z-20 w-[240px] rounded-xl border border-white/12 bg-[#101218]/95 px-3.5 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-md"
          style={tipStyle}
        >
          <div className="flex items-start gap-2">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: getDeptColor(hoverPoint.uc.label || 'General') }} />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium leading-snug text-white">{workshopName(hoverPoint.uc)}</p>
              <p className="mt-1 font-mono text-[10px] text-white/40">
                {workshopLabel(hoverPoint.uc) || hoverPoint.uc.label || 'General'} · {Q_META[getQuadrant(hoverPoint.uc)].label} · {calcScore(hoverPoint.uc.scores).toFixed(1)}
                {isHighRisk(hoverPoint.uc) ? ' · High risk' : ''}
              </p>
            </div>
          </div>
          <p className="mt-2 font-mono text-[10px] text-white/28">Click to discuss</p>
        </div>
      )}
    </div>
  );
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const EMPTY_KO: KnockoutAnswers = { recurring: null, costly: null, dataAvailable: null, standardized: null };
const EMPTY_SCORES: Scores = { businessImpact: 0, frequency: 0, aiSuitability: 0, implementation: 0, risk: 0, adoption: 0 };

// ─── localStorage helpers (module-level so they're stable references) ─────────

const lsKey = (sid: string) => `ai-matrix:${sid}`;

function readLocal(sid: string): UseCase[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(lsKey(sid));
    return raw ? (JSON.parse(raw) as UseCase[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(sid: string, cases: UseCase[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(lsKey(sid), JSON.stringify(cases));
  } catch {
    // ignore quota / private mode errors
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AiMatrixTool() {
  // Session
  const [view, setView] = useState<View>('landing');
  const [sessionId, setSessionId] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [yourName, setYourName] = useState('');

  // Use cases (from API)
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  // 'sync'  = backend (Vercel KV) live, shared across devices
  // 'local' = no backend, stored on this device only
  const [storageMode, setStorageMode] = useState<'sync' | 'local'>('local');

  // Form state
  const [addStep, setAddStep] = useState<0 | 1>(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formSolution, setFormSolution] = useState('');
  const [formLabel, setFormLabel] = useState<string>('General');
  const [showCustomLabel, setShowCustomLabel] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [extraLabels, setExtraLabels] = useState<string[]>([]);
  const [formKO, setFormKO] = useState<KnockoutAnswers>({ ...EMPTY_KO });
  const [formScores, setFormScores] = useState<Scores>({ ...EMPTY_SCORES });

  // UI state
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [filterLabel, setFilterLabel] = useState<string>('all');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const knownIdsRef = useRef<Set<string>>(new Set());
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateUseCase = async (uc: UseCase) => {
    setUseCases((prev) => {
      const next = prev.map((row) => (row.id === uc.id ? { ...row, ...uc } : row));
      writeLocal(sessionId, next);
      return next;
    });
    setLastUpdated(new Date());
    try {
      const res = await fetch(`/api/matrix-sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(uc),
      });
      const data = await res.json();
      if (data.kv && data.useCases) {
        knownIdsRef.current = new Set((data.useCases as UseCase[]).map((u) => u.id));
        setStorageMode('sync');
        // Merge by id — preserve local order (priority ranks live on each case)
        setUseCases((prev) => {
          const byId = new Map((data.useCases as UseCase[]).map((u) => [u.id, u]));
          const merged = prev.map((row) => byId.get(row.id) ?? row);
          const prevIds = new Set(prev.map((r) => r.id));
          for (const u of data.useCases as UseCase[]) {
            if (!prevIds.has(u.id)) merged.push(u);
          }
          writeLocal(sessionId, merged);
          return merged;
        });
      } else {
        setStorageMode('local');
      }
    } catch {
      setStorageMode('local');
    }
  };

  const replaceAllUseCases = useCallback((cases: UseCase[]) => {
    // Never wipe a populated board with an empty replace
    if (cases.length === 0) return;
    knownIdsRef.current = new Set(cases.map((u) => u.id));
    setUseCases(cases);
    writeLocal(sessionId, cases);
    setLastUpdated(new Date());
  }, [sessionId]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 4000);
  }, []);

  // ── API helpers ──────────────────────────────────────────────────────────

  const fetchUseCases = useCallback(async (sid: string, silent = false) => {
    if (!silent) setIsSyncing(true);
    try {
      const res = await fetch(`/api/matrix-sessions/${sid}`);
      const data = await res.json();
      if (data.kv) {
        const incoming: UseCase[] = data.useCases ?? [];
        // Toast for use cases added by others since the last sync.
        if (silent && knownIdsRef.current.size > 0) {
          const fresh = incoming.filter((uc) => !knownIdsRef.current.has(uc.id));
          if (fresh.length === 1) {
            showToast(`${fresh[0].addedBy || 'Someone'} added "${workshopName(fresh[0])}"`);
          } else if (fresh.length > 1) {
            showToast(`${fresh.length} new use cases added`);
          }
        }
        knownIdsRef.current = new Set(incoming.map((uc) => uc.id));
        setStorageMode('sync');
        setUseCases(sortUseCasesByScore(incoming));
        writeLocal(sid, sortUseCasesByScore(incoming));
      } else {
        // No backend: fall back to whatever is stored on this device.
        const local = sortUseCasesByScore(readLocal(sid));
        knownIdsRef.current = new Set(local.map((uc) => uc.id));
        setStorageMode('local');
        setUseCases(local);
      }
      setLastUpdated(new Date());
    } catch {
      setStorageMode('local');
      setUseCases(sortUseCasesByScore(readLocal(sid)));
    } finally {
      setIsSyncing(false);
    }
  }, [showToast]);

  const addUseCase = async (uc: UseCase) => {
    // Optimistic update + local cache so it always shows up immediately.
    knownIdsRef.current.add(uc.id);
    setUseCases((prev) => {
      const next = sortUseCasesByScore([...prev, uc]);
      writeLocal(sessionId, next);
      return next;
    });
    setLastUpdated(new Date());
    try {
      const res = await fetch(`/api/matrix-sessions/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(uc),
      });
      const data = await res.json();
      if (data.kv && data.useCases) {
        knownIdsRef.current = new Set((data.useCases as UseCase[]).map((u) => u.id));
        setStorageMode('sync');
        const sorted = sortUseCasesByScore(data.useCases as UseCase[]);
        setUseCases(sorted);
        writeLocal(sessionId, sorted);
      } else {
        setStorageMode('local');
      }
    } catch {
      setStorageMode('local');
    }
  };

  const removeUseCase = async (id: string) => {
    setSelectedId((cur) => (cur === id ? null : cur));
    setUseCases((prev) => {
      const next = sortUseCasesByScore(prev.filter((uc) => uc.id !== id));
      writeLocal(sessionId, next);
      return next;
    });
    setLastUpdated(new Date());
    try {
      const res = await fetch(`/api/matrix-sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data.kv && data.useCases) {
        setStorageMode('sync');
        const sorted = sortUseCasesByScore(data.useCases as UseCase[]);
        setUseCases(sorted);
        writeLocal(sessionId, sorted);
      }
    } catch {
      setStorageMode('local');
    }
  };

  // ── Polling ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (view !== 'landing') {
      fetchUseCases(sessionId, true);
      pollingRef.current = setInterval(() => fetchUseCases(sessionId, true), POLL_INTERVAL);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [view, sessionId, fetchUseCases]);

  // ── Share link + QR ─────────────────────────────────────────────────────────

  const buildShare = useCallback(async (sid: string) => {
    if (typeof window === 'undefined') return;
    const url = `${window.location.origin}${window.location.pathname}?s=${encodeURIComponent(sid)}`;
    setShareUrl(url);

  }, []);

  // Auto-join when arriving via a shared link (?s=session-code)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sid = new URLSearchParams(window.location.search).get('s');
    if (sid) {
      const clean = sid.trim().toLowerCase();
      setSessionId(clean);
      buildShare(clean);
      fetchUseCases(clean).finally(() => setView('matrix'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Session actions ───────────────────────────────────────────────────────

  const createSession = async () => {
    if (!companyName.trim()) return;
    const code = randomCode(6);
    const sid = `${companyName.trim().toLowerCase().replace(/[^a-z0-9]/g, '-')}-${code}`;
    setIsLoading(true);
    setSessionId(sid);
    await buildShare(sid);
    await fetchUseCases(sid);
    setIsLoading(false);
    setView('matrix');
    setShowShare(true);
  };

  const joinSession = async () => {
    const sid = joinCode.trim().toLowerCase().replace(/\s/g, '');
    if (!sid) return;
    setIsLoading(true);
    setSessionId(sid);
    await buildShare(sid);
    await fetchUseCases(sid);
    setIsLoading(false);
    setView('matrix');
  };

  // ── Form helpers ──────────────────────────────────────────────────────────

  const koDone = (Object.values(formKO) as (boolean | null)[]).every((v) => v !== null);
  const koFailed = (Object.values(formKO) as (boolean | null)[]).some((v) => v === false);
  const scoresDone = CRITERIA.every((c) => formScores[c.key] > 0);

  function resetForm() {
    setFormName('');
    setFormDesc('');
    setFormSolution('');
    setFormLabel('General');
    setShowCustomLabel(false);
    setCustomLabel('');
    setFormKO({ ...EMPTY_KO });
    setFormScores({ ...EMPTY_SCORES });
    setAddStep(0);
    setEditingId(null);
  }

  function addCustomLabel() {
    const label = customLabel.trim();
    if (!label) return;
    if (![...DEFAULT_LABELS, ...extraLabels].includes(label)) {
      setExtraLabels((prev) => [...prev, label]);
    }
    setFormLabel(label);
    setShowCustomLabel(false);
    setCustomLabel('');
  }

  async function saveUseCase() {
    if (!formName.trim() || !scoresDone) return;
    if (editingId) {
      const existing = useCases.find((uc) => uc.id === editingId);
      if (!existing) return;
      await updateUseCase({
        ...existing,
        name: formName.trim(),
        description: formDesc.trim(),
        solution: formSolution.trim() || undefined,
        label: formLabel || 'General',
        knockout: { ...formKO },
        scores: { ...formScores },
      });
    } else {
      const uc: UseCase = {
        id: makeId(),
        name: formName.trim(),
        description: formDesc.trim(),
        solution: formSolution.trim() || undefined,
        label: formLabel || 'General',
        addedBy: yourName || undefined,
        knockout: { ...formKO },
        scores: { ...formScores },
      };
      await addUseCase(uc);
    }
    resetForm();
    setView('matrix');
  }

  function startAdd(name = '') {
    resetForm();
    if (name) setFormName(name);
    if (filterLabel !== 'all') setFormLabel(filterLabel);
    setView('add');
  }

  function startEdit(uc: UseCase) {
    setEditingId(uc.id);
    setFormName(uc.name);
    setFormDesc(uc.description);
    setFormSolution(uc.solution || '');
    setFormLabel(uc.label || 'General');
    setShowCustomLabel(false);
    setCustomLabel('');
    setFormKO({ ...uc.knockout });
    setFormScores({ ...uc.scores });
    setAddStep(0);
    setSelectedId(null);
    setView('add');
  }

  function copySessionId() {
    navigator.clipboard.writeText(sessionId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function copyLink() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  }

  function formatLastUpdated() {
    if (!lastUpdated) return '';
    const secs = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
    if (secs < 10) return 'just now';
    if (secs < 60) return `${secs}s ago`;
    return `${Math.floor(secs / 60)}m ago`;
  }

  const allLabels = Array.from(
    new Set([
      ...DEFAULT_LABELS,
      ...extraLabels,
      ...useCases.map((uc) => uc.label).filter((l): l is string => Boolean(l)),
    ])
  );

  const selectedCase = selectedId ? useCases.find((uc) => uc.id === selectedId) ?? null : null;

  const filteredUseCases = sortUseCasesByScore(
    filterLabel === 'all'
      ? useCases
      : useCases.filter((uc) => (uc.label || 'General') === filterLabel)
  );

  // ── Views ─────────────────────────────────────────────────────────────────

  const LandingView = (
    <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center px-5 py-16">
      <div className="w-full max-w-md">
        <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.28em] text-bla-lime/70">§ no-regret ai framework</div>
        <h1 className="font-host text-3xl font-light leading-tight text-white md:text-4xl">
          AI Use Case<br />
          <span className="font-medium text-bla-lime">Matrix</span>
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-white/50">
          Score, prioritise and plot AI use cases together in a live workshop session.
        </p>

        <div className="mt-10 space-y-4">
          {/* Create session */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">Start a new session</p>
            <div className="space-y-3">
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createSession()}
                placeholder="Company name (e.g. Adsomnia)"
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-bla-lime/50"
              />
              <input
                type="text"
                value={yourName}
                onChange={(e) => setYourName(e.target.value)}
                placeholder="Your name (optional)"
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-bla-lime/50"
              />
              <button
                onClick={createSession}
                disabled={!companyName.trim() || isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-bla-lime px-5 py-3 text-sm font-medium text-[#0a0b0e] transition-opacity disabled:opacity-40"
              >
                {isLoading ? 'Creating…' : 'Create session →'}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/8" />
            <span className="font-mono text-[10px] text-white/30">or</span>
            <div className="h-px flex-1 bg-white/8" />
          </div>

          {/* Join session */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-white/45">Join an existing session</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && joinSession()}
                placeholder="Session code"
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-bla-lime/50"
              />
              <button
                onClick={joinSession}
                disabled={!joinCode.trim() || isLoading}
                className="rounded-xl border border-white/15 px-4 py-2.5 text-sm text-white/70 transition-colors hover:border-white/30 hover:text-white disabled:opacity-40"
              >
                Join
              </button>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center font-mono text-[10px] text-white/25">
          Sessions are stored for 90 days · No account needed
        </p>
      </div>
    </div>
  );

  const MatrixView = (
    <div className="flex min-h-[calc(100vh-160px)] flex-col gap-6 lg:flex-row lg:items-stretch">
      {/* Left sidebar */}
      <div className="flex w-full flex-col gap-3 lg:h-[calc(100vh-160px)] lg:w-80 lg:shrink-0">
        <button
          onClick={() => startAdd()}
          className="flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-bla-lime/40 bg-bla-lime/10 px-4 py-3 text-sm font-medium text-bla-lime transition-colors hover:bg-bla-lime/20"
        >
          <Plus className="h-4 w-4" />
          Add use case
        </button>

        {/* Department filter */}
        <div className="shrink-0">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">§ department</p>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setFilterLabel('all')}
              className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                filterLabel === 'all'
                  ? 'border-bla-lime/40 bg-bla-lime/10 text-bla-lime'
                  : 'border-white/10 text-white/45 hover:border-white/20 hover:text-white/80'
              }`}
            >
              All ({useCases.length})
            </button>
            {allLabels.map((label) => {
              const count = useCases.filter((uc) => (uc.label || 'General') === label).length;
              return (
                <button
                  key={label}
                  onClick={() => setFilterLabel(label)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                    filterLabel === label
                      ? 'border-white/25 bg-white/10 text-white'
                      : 'border-white/10 text-white/45 hover:border-white/20 hover:text-white/80'
                  }`}
                >
                  <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: getDeptColor(label) }} />
                  {label}{count > 0 ? ` (${count})` : ''}
                </button>
              );
            })}
          </div>
        </div>

        {useCases.length === 0 ? (
          <div className="mt-2 min-h-0 flex-1 overflow-y-auto">
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">§ click to start</p>
            <div className="flex flex-wrap gap-1.5">
              {TYPICAL.map((name) => (
                <button key={name} onClick={() => startAdd(name)}
                  className="rounded-full border border-white/10 px-2.5 py-1 text-xs text-white/50 transition-colors hover:border-white/20 hover:text-white/80">
                  {name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-2">
            <p className="shrink-0 font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">
              § use cases ({filteredUseCases.length}{filterLabel !== 'all' ? ` · ${filterLabel}` : ''})
            </p>
            <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.2)_transparent]">
              {filteredUseCases.length === 0 && (
                <p className="text-xs text-white/35">No use cases in this department yet.</p>
              )}
              {filteredUseCases.map((uc) => {
                const q = getQuadrant(uc);
                const score = calcScore(uc.scores);
                const dept = workshopLabel(uc) || uc.label || 'General';
                return (
                  <div
                    key={uc.id}
                    role="button"
                    tabIndex={0}
                    onMouseEnter={() => setHoveredId(uc.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => setSelectedId(uc.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedId(uc.id); }}
                    className={`group flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 transition-colors ${
                      uc.isWinner
                        ? 'bg-bla-lime/[0.07]'
                        : uc.presented
                          ? 'bg-emerald-400/[0.05]'
                          : selectedId === uc.id
                            ? 'bg-white/[0.06]'
                            : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: getDeptColor(dept) }} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <p className={`min-w-0 flex-1 truncate text-[13px] font-medium ${uc.presented ? 'text-white/55' : 'text-white/90'}`}>
                          {workshopName(uc)}
                        </p>
                        <span className="shrink-0 font-mono text-[11px] tabular-nums text-white/40">{score.toFixed(1)}</span>
                      </div>
                      <p className="mt-0.5 truncate font-mono text-[10px] text-white/30">
                        {dept}
                        <span className="text-white/15"> · </span>
                        {Q_META[q].label}
                      </p>
                    </div>
                    <div
                      className={`flex shrink-0 items-center gap-0.5 transition-opacity ${
                        uc.isWinner || uc.presented ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        title={uc.presented ? 'Clear presented' : 'Mark as presented'}
                        onClick={() => updateUseCase({ ...uc, presented: !uc.presented })}
                        className={`grid h-6 w-6 place-items-center rounded-md transition-colors ${
                          uc.presented ? 'text-emerald-300' : 'text-white/30 hover:text-emerald-300'
                        }`}
                      >
                        <Check className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        title={uc.isWinner ? 'Remove favorite' : 'Mark as favorite'}
                        onClick={() => updateUseCase({ ...uc, isWinner: !uc.isWinner })}
                        className={`grid h-6 w-6 place-items-center rounded-md transition-colors ${
                          uc.isWinner ? 'text-bla-lime' : 'text-white/30 hover:text-bla-lime'
                        }`}
                      >
                        <Star className={`h-3 w-3 ${uc.isWinner ? 'fill-bla-lime' : ''}`} />
                      </button>
                      <button
                        type="button"
                        title="Delete"
                        onClick={() => removeUseCase(uc.id)}
                        className="grid h-6 w-6 place-items-center rounded-md text-white/25 opacity-0 transition-colors hover:text-red-400 group-hover:opacity-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Matrix panel */}
      <div className="flex-1 rounded-2xl border border-white/8 bg-white/[0.015] p-3 md:p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
            § priority matrix{filterLabel !== 'all' ? ` · ${filterLabel}` : ''}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {allLabels.slice(0, 8).map((label) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: getDeptColor(label) }} />
                <span className="font-mono text-[9px] text-white/40">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <MatrixPlot
          useCases={filteredUseCases}
          hoveredId={hoveredId}
          selectedId={selectedId}
          onHover={setHoveredId}
          onSelect={setSelectedId}
        />

        {filteredUseCases.length > 0 && (
          <div className="mt-5 border-t border-white/8 pt-5">
            <p className="mb-2.5 font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">§ quick wins</p>
            <div className="flex flex-wrap gap-2">
              {filteredUseCases.filter((uc) => getQuadrant(uc) === 'quick').length === 0
                ? <p className="text-sm text-white/30">No quick wins yet. Score higher on impact and speed to build.</p>
                : filteredUseCases.filter((uc) => getQuadrant(uc) === 'quick').map((uc) => (
                    <span key={uc.id} className="inline-flex items-center gap-1.5 rounded-full border border-bla-lime/30 bg-bla-lime/10 px-3 py-1 text-xs font-medium text-bla-lime">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: getDeptColor(uc.label || 'General') }} />
                      {workshopName(uc)}
                    </span>
                  ))
              }
            </div>
          </div>
        )}
      </div>

      {/* Case detail modal */}
      {selectedCase && (() => {
        const uc = selectedCase;
        const q = getQuadrant(uc);
        const score = calcScore(uc.scores);
        const dept = workshopLabel(uc) || uc.label || 'General';
        const highRisk = isHighRisk(uc);
        const koFailed = (Object.values(uc.knockout) as (boolean | null)[]).some((v) => v === false);
        return (
          <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-3 sm:items-center sm:p-6">
            <button type="button" aria-label="Close" className="absolute inset-0 cursor-default" onClick={() => setSelectedId(null)} />
            <div className="relative z-10 max-h-[92vh] w-full max-w-[400px] overflow-y-auto rounded-2xl border border-white/12 bg-[#0e1016] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
              <div className="mb-4 flex items-start gap-3">
                <span
                  className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{
                    background: `radial-gradient(circle at 50% 50%, ${getDeptColor(dept)} 0%, ${getDeptColor(dept)}88 55%, transparent 100%)`,
                    boxShadow: `0 0 12px ${getDeptColor(dept)}66`,
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-host text-[18px] font-medium leading-snug text-white">{workshopName(uc)}</p>
                  <p className="mt-1 font-mono text-[11px] text-white/40">
                    by <span className="text-white/65">{uc.addedBy || 'Unknown'}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-white/35 transition-colors hover:bg-white/8 hover:text-white/70"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-1.5">
                <span className="rounded-full px-2.5 py-0.5 font-mono text-[10px]" style={{ color: getDeptColor(dept), backgroundColor: getDeptColor(dept) + '22' }}>
                  {dept}
                </span>
                <span className="rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: Q_META[q].dot, backgroundColor: Q_META[q].dot + '22' }}>
                  {Q_META[q].label}
                </span>
                <span className="rounded-full bg-white/8 px-2.5 py-0.5 font-mono text-[10px] text-white/70">
                  {score.toFixed(1)} / 5
                </span>
                {uc.isWinner && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-bla-lime/15 px-2.5 py-0.5 font-mono text-[10px] text-bla-lime">
                    <Star className="h-2.5 w-2.5 fill-bla-lime" /> Favorite
                  </span>
                )}
                {uc.presented && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2.5 py-0.5 font-mono text-[10px] text-emerald-300">
                    <Check className="h-2.5 w-2.5" /> Presented
                  </span>
                )}
                {highRisk && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-400/15 px-2.5 py-0.5 font-mono text-[10px] text-red-300">
                    <AlertTriangle className="h-2.5 w-2.5" /> High risk
                  </span>
                )}
                {koFailed && (
                  <span className="rounded-full bg-amber-400/15 px-2.5 py-0.5 font-mono text-[10px] text-amber-300/90">Check flags</span>
                )}
              </div>

              <div className="mb-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => updateUseCase({ ...uc, isWinner: !uc.isWinner })}
                  className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-[13px] font-medium transition-colors ${
                    uc.isWinner
                      ? 'border-bla-lime/40 bg-bla-lime/15 text-bla-lime'
                      : 'border-white/12 bg-white/[0.04] text-white/70 hover:border-white/20 hover:text-white'
                  }`}
                >
                  <Star className={`h-3.5 w-3.5 ${uc.isWinner ? 'fill-bla-lime' : ''}`} />
                  {uc.isWinner ? 'Favorited' : 'Favorite'}
                </button>
                <button
                  type="button"
                  onClick={() => updateUseCase({ ...uc, presented: !uc.presented })}
                  className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-[13px] font-medium transition-colors ${
                    uc.presented
                      ? 'border-emerald-400/40 bg-emerald-400/15 text-emerald-300'
                      : 'border-white/12 bg-white/[0.04] text-white/70 hover:border-white/20 hover:text-white'
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                  {uc.presented ? 'Presented' : 'Mark presented'}
                </button>
              </div>

              {highRisk && (
                <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-400/25 bg-red-400/[0.08] px-3.5 py-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
                  <div>
                    <p className="text-[13px] font-medium text-red-200">High risk</p>
                    <p className="mt-0.5 text-[12px] leading-snug text-red-200/70">
                      Safety scored {uc.scores.risk}/5 — discuss risk mitigation before picking this as a first win.
                    </p>
                  </div>
                </div>
              )}

              <div className="mb-4 space-y-3">
                <div>
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
                    Problem · workshop (v1)
                  </p>
                  <p className="text-[13px] leading-relaxed text-white/70">
                    {workshopDescription(uc) || 'No problem statement yet.'}
                  </p>
                </div>
                <div>
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
                    Solution / AI · workshop (v1)
                  </p>
                  <p className="text-[13px] leading-relaxed text-bla-lime/75">
                    {workshopSolution(uc) || 'No solution sketched yet.'}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">Quick check</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {KNOCKOUT_QUESTIONS.map(({ key, label }) => {
                    const val = uc.knockout[key];
                    const yes = val === true;
                    const no = val === false;
                    return (
                      <div
                        key={key}
                        className={`rounded-lg border px-2.5 py-2 ${
                          yes ? 'border-bla-lime/25 bg-bla-lime/[0.06]' : no ? 'border-amber-400/25 bg-amber-400/[0.06]' : 'border-white/8 bg-white/[0.02]'
                        }`}
                      >
                        <p className="font-mono text-[9px] leading-snug text-white/45">{label.replace(/\?$/, '')}</p>
                        <p className={`mt-1 text-[12px] font-medium ${yes ? 'text-bla-lime' : no ? 'text-amber-300' : 'text-white/30'}`}>
                          {yes ? 'Yes' : no ? 'No' : '—'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mb-4">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">Scores</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {CRITERIA.map(({ key, label }) => (
                    <div key={key} className="rounded-lg border border-white/8 bg-white/[0.03] px-2 py-2 text-center">
                      <p className="font-mono text-[9px] leading-tight text-white/40">{label}</p>
                      <p className="mt-1 font-mono text-[15px] text-white/85">{uc.scores[key]}</p>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => startEdit(uc)}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-bla-lime px-3 py-2.5 text-[13px] font-medium text-[#0a0b0e] transition-colors hover:bg-bla-lime/90"
              >
                Edit case
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );

  const AddForm = (
    <div className="mx-auto w-full max-w-xl">
      <button onClick={() => { resetForm(); setView('matrix'); }}
        className="mb-6 flex items-center gap-2 text-sm text-white/45 transition-colors hover:text-white">
        <ArrowLeft className="h-4 w-4" />
        Back to matrix
      </button>

      <div className="mb-8 flex items-center gap-3">
        {['Quick check', 'Score & result'].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full border font-mono text-xs font-medium transition-colors ${
              addStep > i ? 'border-bla-lime bg-bla-lime text-[#0a0b0e]'
              : addStep === i ? 'border-bla-lime text-bla-lime'
              : 'border-white/15 text-white/30'
            }`}>
              {addStep > i ? '✓' : i + 1}
            </div>
            <span className={`hidden text-sm sm:inline ${addStep === i ? 'text-white' : 'text-white/35'}`}>{label}</span>
            {i < 1 && <ChevronRight className="h-4 w-4 text-white/20" />}
          </div>
        ))}
      </div>

      {addStep === 0 && (
        <div className="space-y-5">
          <div>
            <label className="mb-2 block font-mono text-xs uppercase tracking-[0.22em] text-white/50">Use case name</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Short title — e.g. Weekly campaign report auto-draft"
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 font-host text-[15px] text-white placeholder-white/25 outline-none focus:border-bla-lime/50"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block font-mono text-xs uppercase tracking-[0.22em] text-white/50">Problem statement</label>
            <p className="mb-2 text-[14px] leading-snug text-white/50">What problem are we hitting — or what do we want to solve?</p>
            <textarea
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              placeholder="e.g. Every Monday media buyers spend ~3 hours copying Meta + Google stats into a sheet. Underperforming ads get spotted too late."
              rows={3}
              className="w-full resize-y rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 font-host text-[15px] leading-relaxed text-white placeholder-white/30 outline-none focus:border-bla-lime/50"
            />
          </div>

          <div>
            <label className="mb-1 block font-mono text-xs uppercase tracking-[0.22em] text-white/50">Possible solution / AI</label>
            <p className="mb-2 text-[14px] leading-snug text-white/50">What AI or tooling could help — even a rough idea?</p>
            <textarea
              value={formSolution}
              onChange={(e) => setFormSolution(e.target.value)}
              placeholder="e.g. A Slack bot that drafts a Monday digest from both platforms and flags weak campaigns for human review."
              rows={3}
              className="w-full resize-y rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 font-host text-[15px] leading-relaxed text-white placeholder-white/30 outline-none focus:border-bla-lime/50"
            />
          </div>

          <div>
            <label className="mb-2 block font-mono text-xs uppercase tracking-[0.22em] text-white/50">Department</label>
            <div className="flex flex-wrap gap-1.5">
              {allLabels.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => { setFormLabel(label); setShowCustomLabel(false); }}
                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    formLabel === label && !showCustomLabel
                      ? 'border-bla-lime/40 bg-bla-lime/10 text-bla-lime'
                      : 'border-white/10 text-white/50 hover:border-white/20 hover:text-white/80'
                  }`}
                >
                  <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: getDeptColor(label) }} />
                  {label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowCustomLabel(true)}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                  showCustomLabel
                    ? 'border-bla-lime/40 bg-bla-lime/10 text-bla-lime'
                    : 'border-dashed border-white/15 text-white/40 hover:border-white/25 hover:text-white/70'
                }`}
              >
                <Plus className="mr-1 inline h-3 w-3" />
                Custom
              </button>
            </div>
            {showCustomLabel && (
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomLabel()}
                  placeholder="e.g. Legal, Product…"
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-bla-lime/50"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={addCustomLabel}
                  disabled={!customLabel.trim()}
                  className="rounded-xl bg-bla-lime px-3 py-2 text-sm font-medium text-[#0a0b0e] disabled:opacity-40"
                >
                  Add
                </button>
              </div>
            )}
          </div>

          <div>
            <p className="mb-2 font-mono text-xs uppercase tracking-[0.22em] text-white/50">§ quick check</p>
            <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-bla-lime/20 bg-bla-lime/[0.06] p-3.5">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-bla-lime/80" />
              <p className="text-[14px] leading-relaxed text-white/65">
                Four yes/no gates before scoring. A <span className="font-medium text-white">No</span> doesn’t block you — it flags a weaker starting point.
              </p>
            </div>
            <div className="space-y-3">
              {KNOCKOUT_QUESTIONS.map(({ key, label, q, yesMeans, noMeans }) => (
                <div key={key} className="rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3.5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.18em] text-bla-lime/70">{label}</p>
                      <p className="text-[15px] leading-snug text-white/90">{q}</p>
                      <p className="mt-1.5 text-[13px] leading-snug text-white/40">
                        <span className="text-white/55">Yes:</span> {yesMeans}{' '}
                        <span className="text-white/55">No:</span> {noMeans}
                      </p>
                    </div>
                    <YesNo value={formKO[key]} onChange={(v) => setFormKO((prev) => ({ ...prev, [key]: v }))} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {koFailed && koDone && (
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4">
              <p className="mb-2 text-[15px] font-medium text-amber-100">You answered No on:</p>
              <ul className="space-y-2">
                {KNOCKOUT_QUESTIONS.filter(({ key }) => formKO[key] === false).map(({ key, label, noMeans }) => (
                  <li key={key} className="text-[14px] leading-snug text-amber-200/90">
                    <span className="font-medium text-amber-100">{label.replace(/\?$/, '')}</span> — {noMeans}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[13px] text-amber-200/70">Still score it — just expect a harder start than a Quick Win.</p>
            </div>
          )}

          <button onClick={() => setAddStep(1)} disabled={!formName.trim() || !koDone}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-bla-lime px-6 py-3.5 text-sm font-medium text-[#0a0b0e] disabled:cursor-not-allowed disabled:opacity-40">
            Continue to scoring
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {addStep === 1 && (
        <div className="space-y-5">
          <div>
            <p className="font-host text-lg font-medium text-white">{formName}</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-white/35">
              {formLabel} · Score each criterion from 1 (low) to 5 (high)
            </p>
          </div>

          {CRITERIA.map((c) => (
            <div key={c.key} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <div className="mb-0.5 flex items-center justify-between">
                <span className="font-host text-sm font-medium text-white">{c.label}</span>
                <span className="font-mono text-xs text-white/35">weight {Math.round(c.weight * 100)}%</span>
              </div>
              <p className="mb-1 text-[14px] text-white/60">{c.question}</p>
              <p className="mb-3 text-[12px] leading-snug text-white/35">{c.hint}</p>
              <Score5 value={formScores[c.key]} onChange={(v) => setFormScores((prev) => ({ ...prev, [c.key]: v }))} />
              <div className="mt-1.5 flex justify-between font-mono text-[9px] text-white/25">
                <span>1 · {c.scaleLabels[0]}</span>
                <span>5 · {c.scaleLabels[1]}</span>
              </div>
            </div>
          ))}

          {scoresDone && (() => {
            const q = getQuadrant({ id: '', name: formName, description: '', knockout: formKO, scores: formScores });
            return (
              <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
                <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">Total score</p>
                <p className="font-host text-3xl font-medium text-white">
                  {calcScore(formScores).toFixed(2)}
                  <span className="ml-1 text-base text-white/35">/ 5.00</span>
                </p>
                <p className="mt-2 text-sm font-medium" style={{ color: Q_META[q].dot }}>
                  → {Q_META[q].label}: {Q_META[q].desc}
                </p>
              </div>
            );
          })()}

          <div className="flex gap-3">
            <button onClick={() => setAddStep(0)}
              className="flex items-center gap-2 rounded-xl border border-white/10 px-5 py-3 text-sm text-white/55 transition-colors hover:border-white/20 hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <button onClick={saveUseCase} disabled={!scoresDone}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-bla-lime px-6 py-3.5 text-sm font-medium text-[#0a0b0e] disabled:cursor-not-allowed disabled:opacity-40">
              {editingId ? 'Save changes' : 'Add to matrix'}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const WorkshopView = (
    <div className="mx-auto w-full max-w-2xl">
      <button onClick={() => setView('matrix')}
        className="mb-6 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-[15px] font-medium text-white/85 transition-colors hover:border-bla-lime/40 hover:bg-bla-lime/10 hover:text-bla-lime">
        <ArrowLeft className="h-4 w-4" />
        Back to the matrix board
      </button>

      <p className="font-mono text-xs uppercase tracking-[0.28em] text-bla-lime/70">§ help</p>
      <h2 className="mt-1 font-host text-2xl font-light text-white">How to add a strong use case</h2>
      <p className="mt-2 text-[15px] leading-relaxed text-white/55">Quick check → score → land on the matrix. Here’s a filled example you can mirror.</p>

      <div className="mt-6 rounded-2xl border border-bla-lime/25 bg-bla-lime/[0.06] p-5">
        <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.2em] text-bla-lime/70">§ example use case</p>
        <p className="font-host text-xl font-medium text-white">Monday campaign digest</p>
        <span className="mt-2 inline-block rounded-full px-2.5 py-0.5 font-mono text-[11px]" style={{ color: getDeptColor('Media Buying'), backgroundColor: getDeptColor('Media Buying') + '22' }}>
          Media Buying
        </span>
        <div className="mt-4 space-y-3">
          <div>
            <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.16em] text-white/40">Problem statement</p>
            <p className="text-[14px] leading-relaxed text-white/75">Every Monday media buyers spend ~3 hours copying Meta + Google stats into a sheet. Underperforming ads get spotted too late.</p>
          </div>
          <div>
            <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.16em] text-white/40">Possible solution / AI</p>
            <p className="text-[14px] leading-relaxed text-bla-lime/80">A Slack bot that drafts a Monday digest from both platforms and flags weak campaigns for human review.</p>
          </div>
        </div>
        <p className="mt-4 text-[13px] text-white/50">→ Lands in <span className="text-bla-lime">Quick Wins</span> (high impact, low effort).</p>
      </div>

      <div className="mt-8 space-y-2.5">
        <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.22em] text-white/40">§ discussion prompts</p>
        {WORKSHOP_QS.map(({ q, why }, i) => (
          <div key={q} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
            <div className="flex items-start gap-4">
              <span className="mt-0.5 shrink-0 font-mono text-[11px] text-bla-lime/65">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <p className="text-sm font-medium leading-relaxed text-white/90">{q}</p>
                <p className="mt-1 text-[13px] leading-snug text-white/40">{why}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-white/8 bg-white/[0.015] p-6">
        <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.28em] text-bla-lime/70">§ when picking winners</p>
        <p className="mb-4 text-xs text-white/45">Prefer ideas that meet most of these:</p>
        {DECISION_RULES.map((rule) => (
          <div key={rule} className="flex items-center gap-3 border-b border-white/5 py-3 last:border-0">
            <Download className="h-3.5 w-3.5 shrink-0 text-bla-lime" />
            <span className="text-sm text-white/75">{rule}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const ResultsView = (() => {
    const label = sessionId.split('-').slice(0, -1).join(' ') || sessionId;
    const ranked = [...useCases].sort((a, b) => calcScore(b.scores) - calcScore(a.scores));
    const quickWins = ranked.filter((uc) => getQuadrant(uc) === 'quick');
    const counts = (Object.keys(Q_META) as QuadrantKey[]).reduce((acc, q) => {
      acc[q] = useCases.filter((uc) => getQuadrant(uc) === q).length;
      return acc;
    }, {} as Record<QuadrantKey, number>);

    return (
      <div className="mx-auto w-full max-w-3xl">
        <button onClick={() => setView('matrix')}
          className="mb-6 flex items-center gap-2 text-sm text-white/45 transition-colors hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back to matrix
        </button>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-bla-lime/70">§ results · {label}</p>
            <h2 className="mt-1 font-host text-2xl font-light text-white">Prioritised use cases</h2>
            <p className="mt-1 text-sm text-white/50">{useCases.length} use cases scored · {quickWins.length} no-regret quick wins</p>
          </div>
          <button onClick={() => exportCsv(useCases, label)}
            className="flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm text-white/70 transition-colors hover:border-white/30 hover:text-white">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>

        {/* Quadrant counts */}
        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(Object.entries(Q_META) as [QuadrantKey, typeof Q_META[QuadrantKey]][]).map(([k, v]) => (
            <div key={k} className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: v.dot }} />
                <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-white/45">{v.label}</span>
              </div>
              <p className="mt-1.5 font-host text-2xl font-medium text-white">{counts[k]}</p>
            </div>
          ))}
        </div>

        {/* Quick wins highlight */}
        {quickWins.length > 0 && (
          <div className="mt-8 rounded-2xl border border-bla-lime/20 bg-bla-lime/[0.05] p-6">
            <div className="mb-4 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-bla-lime" />
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-bla-lime">§ start here — no-regret quick wins</p>
            </div>
            <div className="space-y-2.5">
              {quickWins.map((uc, i) => (
                <div key={uc.id} className="flex items-center gap-3">
                  <span className="font-mono text-sm font-medium text-bla-lime">{i + 1}</span>
                  <span className="flex-1 text-sm font-medium text-white">{workshopName(uc)}</span>
                  {isHighRisk(uc) && <AlertTriangle className="h-3.5 w-3.5 text-red-400" />}
                  <span className="font-mono text-xs text-bla-lime/80">{calcScore(uc.scores).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full ranking */}
        <div className="mt-8">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">§ full ranking</p>
          <div className="space-y-2">
            {ranked.map((uc, i) => {
              const q = getQuadrant(uc);
              return (
                <div key={uc.id} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-3.5">
                  <span className="w-5 shrink-0 text-center font-mono text-xs text-white/30">{i + 1}</span>
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: Q_META[q].dot }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">{workshopName(uc)}</p>
                    {workshopDescription(uc) && (
                      <p className="truncate text-xs text-white/40">{workshopDescription(uc)}</p>
                    )}
                  </div>
                  {isHighRisk(uc) && (
                    <span className="hidden items-center gap-0.5 rounded-full bg-red-400/10 px-1.5 py-px font-mono text-[9px] text-red-400 sm:flex">
                      <AlertTriangle className="h-2.5 w-2.5" /> risk
                    </span>
                  )}
                  <span className="rounded-full px-2 py-px font-mono text-[9px] uppercase tracking-[0.15em]"
                    style={{ color: Q_META[q].dot, backgroundColor: Q_META[q].dot + '22' }}>
                    {Q_META[q].label}
                  </span>
                  <span className="w-10 shrink-0 text-right font-mono text-xs text-white/55">{calcScore(uc.scores).toFixed(1)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  })();

  // ── Main layout ────────────────────────────────────────────────────────────

  const inSession = view !== 'landing';
  const sessionLabel = sessionId.split('-').slice(0, -1).join(' ') || sessionId;

  return (
    <div className="min-h-screen bg-[#0a0b0e] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#0a0b0e]/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-3 py-3.5 sm:px-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 hover:text-bla-lime">
              Tools
            </Link>
            <div className="h-4 w-px bg-white/15" />
            <button onClick={() => setView('landing')} className="font-host text-[17px] font-bold tracking-tight hover:opacity-80">
              <span className="font-light text-white/60">blabla</span>build
            </button>
            <div className="h-4 w-px bg-white/15" />
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/45">AI Use Case Matrix</span>
            <span className="hidden rounded-full border border-red-400/25 bg-red-400/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-red-400 sm:inline-block">
              Confidential
            </span>
          </div>

          {inSession && (
            <div className="flex items-center gap-3">
              {/* Storage / sync indicator */}
              {storageMode === 'sync' ? (
                <div className="hidden items-center gap-1.5 md:flex">
                  <RefreshCw className={`h-3 w-3 text-bla-lime/70 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span className="font-mono text-[10px] text-bla-lime/70">Live · {formatLastUpdated()}</span>
                </div>
              ) : (
                <div className="hidden items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 md:flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                  <span className="font-mono text-[10px] text-amber-400">This device only</span>
                </div>
              )}

              {/* Participants count */}
              <div className="hidden items-center gap-1.5 sm:flex">
                <Users className="h-3.5 w-3.5 text-white/40" />
                <span className="font-mono text-[10px] text-white/40">{useCases.length} cases</span>
              </div>

              {/* Invite */}
              <button onClick={() => setShowShare(true)}
                className="flex h-8 items-center gap-1.5 rounded-full border border-bla-lime/30 bg-bla-lime/10 px-3 text-xs font-medium text-bla-lime transition-colors hover:bg-bla-lime/20">
                <Share2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Invite</span>
              </button>

              {/* Nav tabs */}
              <div className="flex gap-0.5 rounded-full border border-white/10 p-1">
                <button onClick={() => setView('matrix')}
                  className={`flex h-7 items-center gap-1.5 rounded-full px-3 text-xs transition-colors ${view === 'matrix' || view === 'add' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}>
                  <BarChart3 className="h-3 w-3" />
                  <span className="hidden sm:inline">Matrix</span>
                </button>
                <button onClick={() => setView('results')}
                  className={`flex h-7 items-center gap-1.5 rounded-full px-3 text-xs transition-colors ${view === 'results' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}>
                  <Trophy className="h-3 w-3" />
                  <span className="hidden sm:inline">Results</span>
                </button>
                <button onClick={() => setView('claude')}
                  className={`flex h-7 items-center gap-1.5 rounded-full px-3 text-xs transition-colors ${view === 'claude' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}>
                  <Code2 className="h-3 w-3" />
                  <span className="hidden sm:inline">Claude Cases</span>
                </button>
                <button onClick={() => setView('prioritize')}
                  className={`flex h-7 items-center gap-1.5 rounded-full px-3 text-xs transition-colors ${view === 'prioritize' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}>
                  <ListOrdered className="h-3 w-3" />
                  <span className="hidden sm:inline">Prioritize</span>
                </button>
                <button onClick={() => setView('roadmap')}
                  className={`flex h-7 items-center gap-1.5 rounded-full px-3 text-xs transition-colors ${view === 'roadmap' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}>
                  <MapIcon className="h-3 w-3" />
                  <span className="hidden sm:inline">Roadmap</span>
                </button>
                {SHOW_REVIEW && (
                  <button onClick={() => setView('review')}
                    className={`flex h-7 items-center gap-1.5 rounded-full px-3 text-xs transition-colors ${view === 'review' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}>
                    <ClipboardCheck className="h-3 w-3" />
                    <span className="hidden sm:inline">Review</span>
                  </button>
                )}
                <button onClick={() => setView('workshop')}
                  className={`flex h-7 items-center gap-1.5 rounded-full px-3 text-xs transition-colors ${view === 'workshop' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white'}`}>
                  <HelpCircle className="h-3 w-3" />
                  <span className="hidden sm:inline">Help</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Session bar */}
        {inSession && (
          <div className={`border-t ${storageMode === 'sync' ? 'border-bla-lime/10 bg-bla-lime/5' : 'border-amber-400/10 bg-amber-400/[0.04]'}`}>
            <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3 px-3 py-1.5 sm:px-4">
              <span className={`font-mono text-[10px] ${storageMode === 'sync' ? 'text-bla-lime/60' : 'text-amber-400/70'}`}>
                Session: <span className={`font-medium ${storageMode === 'sync' ? 'text-bla-lime' : 'text-amber-400'}`}>{sessionLabel}</span>
              </span>
              {storageMode === 'sync' ? (
                <button onClick={copySessionId}
                  className="flex items-center gap-1.5 font-mono text-[10px] text-white/40 transition-colors hover:text-white">
                  <span>Code: <span className="font-medium text-white/70">{sessionId}</span></span>
                  {copied
                    ? <Check className="h-3 w-3 text-bla-lime" />
                    : <Copy className="h-3 w-3" />}
                </button>
              ) : (
                <span className="truncate font-mono text-[10px] text-amber-400/60">
                  Saved on this device only — connect Vercel KV to sync across devices
                </span>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main */}
      <main className="mx-auto w-full max-w-[1600px] px-3 py-6 sm:px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={view + addStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {view === 'landing'   && LandingView}
            {view === 'matrix'    && MatrixView}
            {view === 'add'       && AddForm}
            {view === 'workshop'  && WorkshopView}
            {view === 'results'   && ResultsView}
            {view === 'claude'    && (
              <ClaudeCasesView useCases={useCases} sessionId={sessionId} onBack={() => setView('matrix')} onUpdate={updateUseCase} />
            )}
            {view === 'prioritize' && (
              <PrioritizeView
                useCases={useCases}
                sessionId={sessionId}
                onBack={() => setView('matrix')}
                onUpdate={updateUseCase}
                onReplaceAll={replaceAllUseCases}
              />
            )}
            {view === 'roadmap' && (
              <RoadmapView
                useCases={useCases}
                sessionId={sessionId}
                onBack={() => setView('matrix')}
                onGoPrioritize={() => setView('prioritize')}
              />
            )}
            {SHOW_REVIEW && view === 'review' && (
              <ReviewView useCases={useCases} onBack={() => setView('matrix')} onUpdate={updateUseCase} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-5 left-1/2 z-[90] -translate-x-1/2"
          >
            <div className="flex items-center gap-2.5 rounded-full border border-bla-lime/30 bg-[#0d0f12] px-4 py-2.5 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.7)]">
              <Plus className="h-3.5 w-3.5 text-bla-lime" />
              <span className="text-sm text-white/90">{toast}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share modal */}
      <AnimatePresence>
        {showShare && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[95] flex items-center justify-center p-4"
            onClick={() => setShowShare(false)}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-[#0d0f12] p-7 text-center shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)]"
            >
              <button onClick={() => setShowShare(false)}
                className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-white/40 transition-colors hover:bg-white/5 hover:text-white">
                <X className="h-4 w-4" />
              </button>

              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-bla-lime/70">§ invite participants</p>
              <h3 className="mt-1.5 font-host text-xl font-light text-white">Share the link to join</h3>

              <p className="mt-5 mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">Share this link</p>
              <button onClick={copyLink}
                className="flex w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition-colors hover:border-white/20">
                <span className="min-w-0 flex-1 truncate font-mono text-xs text-white/60">{shareUrl}</span>
                {linkCopied
                  ? <Check className="h-4 w-4 shrink-0 text-bla-lime" />
                  : <Copy className="h-4 w-4 shrink-0 text-white/40" />}
              </button>

              {storageMode !== 'sync' && (
                <div className="mt-5 flex items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-left">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                  <p className="text-xs leading-relaxed text-amber-400/90">
                    Live sync is off. Connect a Vercel KV store so participants on other devices see each other&apos;s use cases.
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
