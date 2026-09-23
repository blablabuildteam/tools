"use client";

import {
  addEdge,
  Background,
  BaseEdge,
  Handle,
  MiniMap,
  PanOnScrollMode,
  Position,
  ReactFlow,
  ReactFlowProvider,
  MarkerType,
  getSmoothStepPath,
  useEdgesState,
  useNodesState,
  useReactFlow,
  useStore,
  type Connection,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { animate, AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Building2, ChevronDown, ChevronRight, Clock, FaceExpressionless, FileType, GripVertical, Info, Minus, Plus, Redo2, Scan, Sparkles, StickyNote, Trash2, Undo2, Users, Wrench } from "lucide-react";
import { nanoid } from "nanoid";
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from "react";
import {
  asChipList,
  createDefaultPrepMilestones,
  normalizePrepStep,
  sketchFingerprint,
  SKETCH_PATCH_KEYS,
  STICKY_COLORS,
  type DurationUnit,
  type PrepAiIdea,
  type PrepConnection,
  type PrepMilestone,
  type PrepMilestoneId,
  type PrepPhaseSketch,
  type PrepStep,
  type PrepSticky,
  type SketchPatchKey,
} from "@/lib/workshop-types";

const COL_W = 300;
const COL_GAP = 36;
const ORIGIN_X = 36;
const HOURS_BAND_Y = 24;
const HOURS_BAND_H = 116;
const ORIGIN_Y = HOURS_BAND_Y + HOURS_BAND_H + 16;
const HEADER_H = 148;
const STEP_W = 272;
const STEP_H = 248;
const STEP_COLLAPSED_H = 56;
const STEP_GAP = 8;
const ADD_H = 44;
const LANE_PAD = 14;
const AI_H = 158;
const AI_GAP = 10;
const ADD_AI_H = 36;
const REVEAL_H = 52;
const STICKY_W = 176;
const STICKY_H = 132;
const ADD_MILESTONE_W = 280;
const ADD_MILESTONE_H = 118;
const MILESTONE_W = 280;
const BOARD_BG = "#f3f1eb";

const LANE_COLORS = [
  "rgba(21, 31, 40, 0.035)",
  "rgba(21, 31, 40, 0.045)",
];

function laneBackground(index: number) {
  const i = Number.isFinite(index) && index >= 0 ? index : 0;
  return LANE_COLORS[i % LANE_COLORS.length];
}

function laneMinimapColor(index: number) {
  const src = laneBackground(index);
  const m = src.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
  if (!m) return "#e7e4dc";
  const r = Number(m[1]);
  const g = Number(m[2]);
  const b = Number(m[3]);
  const a = Math.min(0.32, Number(m[4]) * 3.2);
  const mix = (c: number, base: number) => Math.round(c * a + base * (1 - a));
  return `rgb(${mix(r, 243)}, ${mix(g, 241)}, ${mix(b, 235)})`;
}

/** Declared size so MiniMap can draw nodes before/without measured bounds. */
function flowSize(width: number, height: number, style: Node["style"] = {}) {
  return {
    width,
    initialWidth: width,
    initialHeight: height,
    style: { ...style, width },
  };
}

function flowBox(width: number, height: number, style: Node["style"] = {}) {
  return {
    width,
    height,
    initialWidth: width,
    initialHeight: height,
    style: { ...style, width, height },
  };
}

type LaneData = { index: number };
type MilestoneData = PrepMilestone & { index: number };
type HoursBandData = { milestoneIds: string[] };
type AddData = { milestoneId: PrepMilestoneId };
type RevealData = { milestoneId: PrepMilestoneId; open: boolean; count: number };
type ChipKind = "person" | "party" | "tool" | "format";

type EditorCtx = {
  patchStep: (id: string, partial: Partial<PrepStep>) => void;
  deleteStep: (id: string) => void;
  addStep: (milestoneId: PrepMilestoneId) => void;
  patchAi: (id: string, partial: Partial<PrepAiIdea>) => void;
  deleteAi: (id: string) => void;
  addAi: (milestoneId: PrepMilestoneId) => void;
  reportHeight: (id: string, height: number) => void;
  patchMilestone: (id: string, partial: Partial<PrepMilestone>) => void;
  addMilestone: () => void;
  requestDeleteMilestone: (id: string) => void;
  canDeleteMilestone: boolean;
  setStepsCollapsed: (collapsed: boolean) => void;
  patchSticky: (id: string, partial: Partial<PrepSticky>) => void;
  deleteSticky: (id: string) => void;
  deleteConnection: (id: string) => void;
  chipSuggestions: Record<ChipKind, string[]>;
  hoursByMilestone: Record<PrepMilestoneId, number>;
  aiCountByMilestone: Record<PrepMilestoneId, number>;
  painCountByMilestone: Record<PrepMilestoneId, number>;
  peopleByMilestone: Record<PrepMilestoneId, string[]>;
  partiesByMilestone: Record<PrepMilestoneId, string[]>;
  toolsByMilestone: Record<PrepMilestoneId, string[]>;
  formatsByMilestone: Record<PrepMilestoneId, string[]>;
  showAiKansen: boolean;
  revealedAiMilestoneIds: string[];
  toggleAiColumn: (milestoneId: PrepMilestoneId) => void;
  durationUnit: DurationUnit;
  hidePainPoints: boolean;
};

const EditorContext = createContext<EditorCtx | null>(null);

function useEditor() {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error("PrepPhaseEditor context missing");
  return ctx;
}

function parseDuration(raw: string): number {
  const n = Number(String(raw).trim().replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function formatDuration(n: number, unit: DurationUnit): string {
  if (n <= 0) return unit === "minutes" ? "0 min" : "0 uur";
  if (unit === "minutes") {
    const label = Number.isInteger(n) ? String(Math.round(n)) : String(Math.round(n * 10) / 10).replace(".", ",");
    return `${label} min`;
  }
  const label = Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10).replace(".", ",");
  return `${label} uur`;
}

function formatDurationCompact(n: number, unit: DurationUnit): string {
  if (n <= 0) return "0";
  if (unit === "minutes") {
    return Number.isInteger(n) ? `${Math.round(n)}m` : `${String(Math.round(n * 10) / 10).replace(".", ",")}m`;
  }
  const label = Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10).replace(".", ",");
  return `${label}u`;
}

function convertDurationValue(raw: string, from: DurationUnit, to: DurationUnit): string {
  if (from === to) return raw;
  const n = parseDuration(raw);
  if (n <= 0) return "";
  if (from === "hours" && to === "minutes") {
    const mins = Math.round(n * 60);
    return mins > 0 ? String(mins) : "";
  }
  const hours = n / 60;
  if (hours <= 0) return "";
  const rounded = Math.round(hours * 100) / 100;
  return String(rounded);
}

function hoursBandWidth(count: number) {
  if (count <= 0) return COL_W;
  return count * COL_W + (count - 1) * COL_GAP;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function useAnimatedHours(ids: string[], hoursById: Record<string, number>): number[] {
  const target = ids.map((id) => hoursById[id] ?? 0);
  const targetKey = ids.map((id, i) => `${id}:${target[i]}`).join("|");
  const [shown, setShown] = useState(target);
  const shownRef = useRef(target);
  const idsRef = useRef(ids);
  const targetRef = useRef({ ids, target });
  const reduceMotion = useReducedMotion();
  const first = useRef(true);
  targetRef.current = { ids, target };

  useEffect(() => {
    const { ids: nextIds, target: nextVals } = targetRef.current;
    const sameShape =
      idsRef.current.length === nextIds.length && idsRef.current.every((id, i) => id === nextIds[i]);
    idsRef.current = nextIds;

    if (first.current || reduceMotion || !sameShape) {
      first.current = false;
      shownRef.current = nextVals;
      setShown(nextVals);
      return;
    }

    const from = shownRef.current;
    if (from.length === nextVals.length && from.every((v, i) => v === nextVals[i])) return;

    const controls = animate(0, 1, {
      duration: 0.52,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (t) => {
        const mixed = nextVals.map((b, i) => Math.max(0, (from[i] ?? 0) + (b - (from[i] ?? 0)) * t));
        shownRef.current = mixed;
        setShown(mixed);
      },
      onComplete: () => {
        shownRef.current = nextVals;
        setShown(nextVals);
      },
    });
    return () => controls.stop();
  }, [reduceMotion, targetKey]);

  return shown.length === ids.length ? shown : target;
}

function hoursLinePath(points: { x: number; y: number }[], yMin: number, yMax: number): string {
  if (!points.length) return "";
  if (points.length === 1) {
    const p = points[0];
    return `M ${p.x - 36} ${p.y} L ${p.x + 36} ${p.y}`;
  }
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = clamp(p1.y + (p2.y - p0.y) / 6, yMin, yMax);
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = clamp(p2.y - (p3.y - p1.y) / 6, yMin, yMax);
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function uniqueChipList(steps: PrepStep[], pick: (step: PrepStep) => string[]): string[] {
  const map = new Map<string, string>();
  for (const step of steps) {
    for (const label of pick(step)) {
      const key = label.trim().toLowerCase();
      if (key && !map.has(key)) map.set(key, label.trim());
    }
  }
  return [...map.values()];
}

function uniqueChipsByMilestone(
  milestones: PrepMilestone[],
  steps: PrepStep[],
  pick: (step: PrepStep) => string[]
): Record<PrepMilestoneId, string[]> {
  const totals = {} as Record<PrepMilestoneId, string[]>;
  const maps = new Map<PrepMilestoneId, Map<string, string>>();
  for (const m of milestones) {
    maps.set(m.id, new Map());
    totals[m.id] = [];
  }
  for (const step of steps) {
    const map = maps.get(step.milestoneId);
    if (!map) continue;
    for (const label of pick(step)) {
      const key = label.toLowerCase();
      if (!map.has(key)) map.set(key, label);
    }
  }
  for (const [id, map] of maps) totals[id] = [...map.values()];
  return totals;
}

function useReportHeight(id: string) {
  const { reportHeight } = useEditor();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const send = () => reportHeight(id, el.offsetHeight);
    send();
    const ro = new ResizeObserver(send);
    ro.observe(el);
    return () => ro.disconnect();
  }, [id, reportHeight]);

  return ref;
}

function colX(index: number) {
  return ORIGIN_X + index * (COL_W + COL_GAP);
}

function measured(heights: Record<string, number>, id: string, fallback: number) {
  return heights[id] ?? fallback;
}

function isAiOpen(milestoneId: PrepMilestoneId, showAll: boolean, revealed: string[]) {
  return showAll || revealed.includes(milestoneId);
}

function layoutNodes(
  milestones: PrepMilestone[],
  steps: PrepStep[],
  aiIdeas: PrepAiIdea[],
  heights: Record<string, number> = {},
  stickies: PrepSticky[] = [],
  showAiKansen = false,
  revealedIds: string[] = []
): Node[] {
  const cols = [...milestones].sort((a, b) => a.order - b.order);
  const byCol = new Map<PrepMilestoneId, PrepStep[]>();
  const aiByCol = new Map<PrepMilestoneId, PrepAiIdea[]>();
  for (const m of cols) {
    byCol.set(m.id, []);
    aiByCol.set(m.id, []);
  }
  for (const step of [...steps].sort((a, b) => a.order - b.order)) {
    byCol.get(step.milestoneId)?.push(step);
  }
  for (const idea of [...aiIdeas].sort((a, b) => a.order - b.order)) {
    aiByCol.get(idea.milestoneId)?.push(idea);
  }

  const nodes: Node[] = [];
  cols.forEach((m, i) => {
    const col = byCol.get(m.id) ?? [];
    const ideas = aiByCol.get(m.id) ?? [];
    const x = colX(i) + (COL_W - STEP_W) / 2;
    const columnNodes: Node[] = [];
    let y = columnContentY(heights, m.id);

    col.forEach((step) => {
      const stepH = measured(
        heights,
        step.id,
        step.collapsed ? STEP_COLLAPSED_H : STEP_H
      );
      columnNodes.push({
        id: step.id,
        type: "prep-step",
        position: { x, y },
        data: step,
        dragHandle: ".step-drag",
        ...flowSize(STEP_W, stepH, { zIndex: 2 }),
      });
      y += stepH + STEP_GAP;
    });
    columnNodes.push({
      id: `add-${m.id}`,
      type: "add-step",
      position: { x, y },
      data: { milestoneId: m.id },
      draggable: false,
      selectable: true,
      connectable: false,
      ...flowBox(STEP_W, ADD_H, { zIndex: 4 }),
    });
    y += ADD_H + 8;
    const aiOpen = isAiOpen(m.id, showAiKansen, revealedIds);
    columnNodes.push({
      id: `reveal-ai-${m.id}`,
      type: "reveal-ai",
      position: { x, y },
      data: { milestoneId: m.id, open: aiOpen, count: ideas.length },
      draggable: false,
      selectable: true,
      connectable: false,
      ...flowBox(STEP_W, REVEAL_H, { zIndex: 4 }),
    });
    y += REVEAL_H + (aiOpen ? 8 : LANE_PAD);
    if (aiOpen) {
      ideas.forEach((idea) => {
        const ideaH = measured(heights, idea.id, AI_H);
        columnNodes.push({
          id: idea.id,
          type: "ai-idea",
          position: { x, y },
          data: idea,
          dragHandle: ".ai-drag",
          ...flowSize(STEP_W, ideaH, { zIndex: 3 }),
        });
        y += ideaH + AI_GAP;
      });
      columnNodes.push({
        id: `add-ai-${m.id}`,
        type: "add-ai",
        position: { x, y },
        data: { milestoneId: m.id },
        draggable: false,
        selectable: true,
        connectable: false,
        ...flowBox(STEP_W, ADD_AI_H, { zIndex: 4 }),
      });
      y += ADD_AI_H + LANE_PAD;
    }
    const height = Math.max(560, y - ORIGIN_Y);

    nodes.push({
      id: `lane-${m.id}`,
      type: "lane",
      position: { x: colX(i), y: ORIGIN_Y },
      data: { index: i },
      draggable: false,
      selectable: false,
      connectable: false,
      focusable: false,
      className: "nopan",
      ...flowBox(COL_W, height, {
        zIndex: 0,
        pointerEvents: "none",
        borderRadius: 16,
      }),
    });
    nodes.push({
      id: `ms-${m.id}`,
      type: "milestone",
      position: { x: colX(i) + 10, y: ORIGIN_Y + 10 },
      data: { ...m, index: i },
      dragHandle: ".ms-drag",
      connectable: false,
      ...flowSize(MILESTONE_W, measured(heights, `ms-${m.id}`, HEADER_H - 18), { zIndex: 5 }),
    });
    nodes.push(...columnNodes);
  });
  if (cols.length > 0) {
    const bandW = hoursBandWidth(cols.length);
    nodes.push({
      id: "hours-band",
      type: "hours-band",
      position: { x: ORIGIN_X, y: HOURS_BAND_Y },
      data: { milestoneIds: cols.map((m) => m.id) },
      draggable: false,
      selectable: false,
      connectable: false,
      focusable: false,
      className: "nopan",
      ...flowBox(bandW, HOURS_BAND_H, {
        zIndex: 6,
        pointerEvents: "none",
      }),
    });
  }
  nodes.push({
    id: "add-milestone",
    type: "add-milestone",
    position: { x: colX(cols.length), y: ORIGIN_Y + 10 },
    data: {},
    draggable: false,
    selectable: true,
    connectable: false,
    className: "nopan",
    ...flowBox(ADD_MILESTONE_W, ADD_MILESTONE_H, { zIndex: 5 }),
  });
  for (const sticky of stickies) {
    nodes.push({
      id: sticky.id,
      type: "sticky",
      position: { x: sticky.x, y: sticky.y },
      data: sticky,
      connectable: false,
      ...flowSize(STICKY_W, measured(heights, sticky.id, STICKY_H), { zIndex: 8 }),
    });
  }
  return nodes;
}

function LaneNode({ data }: NodeProps<Node<LaneData>>) {
  return (
    <div
      className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-black/8"
      style={{ backgroundColor: laneBackground(data.index) }}
    />
  );
}

function HoursBandNode({ data }: NodeProps<Node<HoursBandData>>) {
  const { hoursByMilestone, durationUnit } = useEditor();
  const gid = useId().replace(/:/g, "");
  const ids = data.milestoneIds;
  const hours = useAnimatedHours(ids, hoursByMilestone);
  const total = hours.reduce((sum, n) => sum + n, 0);
  const peak = Math.max(...hours, 0);
  const width = hoursBandWidth(ids.length);
  const padTop = 40;
  const padBottom = 22;
  const plotTop = padTop;
  const plotBottom = HOURS_BAND_H - padBottom;
  const plotH = Math.max(8, plotBottom - plotTop);
  const yMax = peak > 0 ? peak : 1;
  const points = hours.map((h, i) => ({
    x: i * (COL_W + COL_GAP) + COL_W / 2,
    y: plotBottom - (h / yMax) * plotH,
    hours: h,
  }));
  const line = hoursLinePath(points, plotTop, plotBottom);
  const area =
    points.length === 0
      ? ""
      : points.length === 1
        ? `${line} L ${points[0].x + 36} ${plotBottom} L ${points[0].x - 36} ${plotBottom} Z`
        : `${line} L ${points[points.length - 1].x} ${plotBottom} L ${points[0].x} ${plotBottom} Z`;
  const unitLabel = durationUnit === "minutes" ? "Minuten" : "Uren";
  const emptyHint =
    durationUnit === "minutes"
      ? "Vul minuten in bij de stappen om te zien waar de inzet zit"
      : "Vul uren in bij de stappen om te zien waar de inzet zit";

  return (
    <div
      className="pointer-events-none relative overflow-hidden rounded-2xl bg-[#151f28] shadow-sm ring-1 ring-black/10"
      style={{ width, height: HOURS_BAND_H }}
      aria-label={`${unitLabel} per proces, ${formatDuration(total, durationUnit)} totaal`}
    >
      <div className="absolute inset-x-3 top-2 z-10 flex items-center justify-between gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#ceff00]/80">
          {unitLabel} over het proces
        </p>
        <p className="rounded-full bg-[#ceff00] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#151f28]">
          {formatDuration(total, durationUnit)} totaal
        </p>
      </div>
      <AnimatePresence>
        {total < 0.05 ? (
          <motion.p
            key="hours-empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="absolute inset-x-0 top-[52px] text-center text-[11px] text-white/35"
          >
            {emptyHint}
          </motion.p>
        ) : null}
      </AnimatePresence>
      {ids.length === 0 ? null : (
        <svg
          width={width}
          height={HOURS_BAND_H}
          viewBox={`0 0 ${width} ${HOURS_BAND_H}`}
          className="absolute inset-0"
          aria-hidden
        >
          <defs>
            <linearGradient id={`hours-fill-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ceff00" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#ceff00" stopOpacity="0.04" />
            </linearGradient>
          </defs>
          <line
            x1={points[0]?.x ?? 0}
            x2={points[points.length - 1]?.x ?? width}
            y1={plotBottom}
            y2={plotBottom}
            stroke="white"
            strokeOpacity="0.12"
            strokeWidth="1"
          />
          {area ? <path d={area} fill={`url(#hours-fill-${gid})`} /> : null}
          {line ? (
            <path
              d={line}
              fill="none"
              stroke="#ceff00"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
          {points.map((p, i) => {
            const isPeak = peak > 0 && p.hours === peak;
            return (
              <g key={ids[i]}>
                <line
                  x1={p.x}
                  y1={p.y}
                  x2={p.x}
                  y2={plotBottom}
                  stroke="#ceff00"
                  strokeOpacity="0.2"
                  strokeWidth="1"
                />
                <motion.circle
                  cx={p.x}
                  cy={p.y}
                  initial={false}
                  animate={{ r: isPeak ? 5 : 3.5 }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  fill={isPeak ? "#ceff00" : "#151f28"}
                  stroke="#ceff00"
                  strokeWidth="2"
                />
                <text
                  x={p.x}
                  y={HOURS_BAND_H - 6}
                  textAnchor="middle"
                  fill={p.hours > 0 ? (isPeak ? "#ceff00" : "rgba(255,255,255,0.7)") : "rgba(255,255,255,0.28)"}
                  fontSize="10"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  fontWeight="600"
                >
                  {formatDurationCompact(p.hours, durationUnit)}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

const PERSON_PALETTE = [{ bg: "#ebe8e1", text: "#3d3a34" }];
const TOOL_PALETTE = [{ bg: "#e4e9f0", text: "#2f3a48" }];
const PARTY_PALETTE = [{ bg: "#efe6dc", text: "#4a3b2f" }];
const FORMAT_PALETTE = [{ bg: "#e7ebe7", text: "#334038" }];

const FORMAT_PRESETS = ["Excel", "PDF", "Word", "PowerPoint", "Email", "Dashboard"];

function chipColor(label: string, kind: ChipKind) {
  void label;
  if (kind === "person") return PERSON_PALETTE[0];
  if (kind === "party") return PARTY_PALETTE[0];
  if (kind === "format") return FORMAT_PALETTE[0];
  return TOOL_PALETTE[0];
}

function columnContentY(heights: Record<string, number>, milestoneId: PrepMilestoneId) {
  const cardH = measured(heights, `ms-${milestoneId}`, HEADER_H - 18);
  return ORIGIN_Y + 10 + cardH + 8;
}

function MilestoneNode({ id, data, selected }: NodeProps<Node<MilestoneData>>) {
  const {
    hoursByMilestone,
    painCountByMilestone,
    patchMilestone,
    requestDeleteMilestone,
    canDeleteMilestone,
    durationUnit,
    hidePainPoints,
  } = useEditor();
  const boxRef = useReportHeight(id);
  const hours = hoursByMilestone[data.id] ?? 0;
  const painCount = hidePainPoints ? 0 : painCountByMilestone[data.id] ?? 0;
  const n = data.index + 1;

  return (
    <div
      ref={boxRef}
      className={`prep-pop-in w-[280px] rounded-xl bg-[#151f28] px-3.5 py-3.5 text-white shadow-sm transition-shadow duration-200 ${
        selected ? "ring-2 ring-[#ceff00]/70" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1">
          <button
            type="button"
            className="ms-drag mt-0.5 cursor-grab rounded p-0.5 text-white/35 hover:text-white/80"
            aria-label="Sleep milestone"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/40">
            {String(n).padStart(2, "0")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {painCount > 0 && (
            <p
              className="inline-flex items-center gap-0.5 rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-white/70"
              title={`${painCount} pijnpunt${painCount === 1 ? "" : "en"}`}
            >
              <FaceExpressionless className="h-3.5 w-3.5" />
              {painCount}
            </p>
          )}
          <p className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-[11px] text-white/75">
            {formatDuration(hours, durationUnit)}
          </p>
          {canDeleteMilestone ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                requestDeleteMilestone(data.id);
              }}
              className="nodrag rounded p-0.5 text-white/30 hover:text-red-300"
              aria-label="Milestone verwijderen"
              title="Milestone verwijderen"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>
      <textarea
        value={data.short}
        onChange={(e) => patchMilestone(data.id, { short: e.target.value })}
        placeholder="Naam proces / milestone"
        rows={2}
        className="nodrag mt-2 w-full resize-none bg-transparent text-[16px] font-semibold leading-snug tracking-tight text-white outline-none placeholder:text-white/30"
      />
      <textarea
        value={data.title}
        onChange={(e) => patchMilestone(data.id, { title: e.target.value })}
        placeholder="Korte beschrijving (optioneel)"
        rows={2}
        className="nodrag mt-1.5 w-full resize-none bg-transparent text-[13px] leading-snug text-white/55 outline-none placeholder:text-white/30"
      />
    </div>
  );
}

function AddMilestoneNode() {
  return (
    <div className="nodrag nopan flex h-[118px] w-[280px] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[#151f28]/20 bg-white/70 px-3 text-center text-[#151f28]/55 transition-colors duration-200 hover:border-[#151f28]/40 hover:bg-white">
      <Plus className="h-5 w-5" />
      <span className="text-[13px] font-semibold">Proces toevoegen</span>
    </div>
  );
}

function useExitThen(run: () => void, ms = 180) {
  const [leaving, setLeaving] = useState(false);
  const exit = useCallback(() => {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(run, ms);
  }, [leaving, ms, run]);
  return { leaving, exit };
}

function ChipInput({
  icon: Icon,
  label,
  placeholder,
  values,
  kind,
  onChange,
}: {
  icon: typeof Users;
  label: string;
  placeholder: string;
  values: string[];
  kind: ChipKind;
  onChange: (next: string[]) => void;
}) {
  const { chipSuggestions } = useEditor();
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const matches = useMemo(() => {
    const q = draft.trim().toLowerCase();
    if (!q) return [];
    const taken = new Set(values.map((v) => v.toLowerCase()));
    return (chipSuggestions[kind] ?? [])
      .filter((s) => !taken.has(s.toLowerCase()) && s.toLowerCase().includes(q))
      .sort((a, b) => {
        const aStarts = a.toLowerCase().startsWith(q) ? 0 : 1;
        const bStarts = b.toLowerCase().startsWith(q) ? 0 : 1;
        return aStarts - bStarts || a.localeCompare(b, "nl");
      })
      .slice(0, 6);
  }, [chipSuggestions, draft, kind, values]);

  function commit(raw: string) {
    const nextLabel = raw.trim();
    setDraft("");
    setOpen(false);
    setActive(0);
    if (!nextLabel) return;
    const exists = values.some((v) => v.toLowerCase() === nextLabel.toLowerCase());
    if (exists) return;
    onChange([...values, nextLabel]);
  }

  return (
    <div className="flex min-w-0 items-start gap-1.5">
      <Icon className="mt-1 h-3.5 w-3.5 shrink-0 text-[#151f28]/35" />
      <span className="sr-only">{label}</span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 flex-wrap items-center gap-1">
        <AnimatePresence initial={false} mode="popLayout">
        {values.map((value) => {
          const tone = chipColor(value, kind);
          return (
            <motion.span
              key={`${kind}-${value.toLowerCase()}`}
              layout="position"
              initial={{ opacity: 0, scale: 0.82 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.82 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex max-w-full origin-left items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[12px] font-semibold leading-tight"
              style={{ backgroundColor: tone.bg, color: tone.text }}
            >
              <span className="truncate">{value}</span>
              <button
                type="button"
                className="nodrag nopan shrink-0 text-[12px] leading-none opacity-70 hover:opacity-100"
                aria-label={`Verwijder ${value}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(values.filter((v) => v !== value));
                }}
              >
                ×
              </button>
            </motion.span>
          );
        })}
        </AnimatePresence>
        <div className="relative min-w-[5rem] flex-1">
          <input
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setActive(0);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (open && matches.length && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
                e.preventDefault();
                e.stopPropagation();
                const delta = e.key === "ArrowDown" ? 1 : -1;
                setActive((n) => (n + delta + matches.length) % matches.length);
                return;
              }
              if (e.key === "Escape") {
                e.preventDefault();
                setOpen(false);
                return;
              }
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                e.stopPropagation();
                commit(open && matches[active] ? matches[active] : draft);
              } else if (e.key === "Backspace" && !draft && values.length) {
                e.preventDefault();
                onChange(values.slice(0, -1));
              }
            }}
            onBlur={() => {
              window.setTimeout(() => {
                setOpen(false);
                commit(draft);
              }, 80);
            }}
            placeholder={values.length ? "…" : placeholder}
            className="nodrag w-full bg-transparent text-[13px] text-[#151f28]/85 outline-none placeholder:text-[#151f28]/30"
          />
          {open && matches.length > 0 && (
            <ul className="nodrag nopan nowheel absolute left-0 top-full z-50 mt-1 min-w-full overflow-hidden rounded-lg border border-black/10 bg-white py-0.5 shadow-lg">
              {matches.map((match, i) => {
                const tone = chipColor(match, kind);
                return (
                  <li key={match.toLowerCase()}>
                    <button
                      type="button"
                      className={`flex w-full items-center px-2 py-1 text-left text-[12px] font-semibold ${
                        i === active ? "bg-[#151f28]/6" : "hover:bg-[#151f28]/4"
                      }`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        commit(match);
                      }}
                      onMouseEnter={() => setActive(i)}
                    >
                      <span
                        className="truncate rounded-full px-1.5 py-0.5"
                        style={{ backgroundColor: tone.bg, color: tone.text }}
                      >
                        {match}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

function handleClass(kind: "source" | "target") {
  return kind === "source"
    ? "!h-2.5 !w-2.5 !border-2 !border-white !bg-[#1125ff]"
    : "!h-2.5 !w-2.5 !border-2 !border-white !bg-[#151f28]";
}

function StepNode({ id, data, selected }: NodeProps<Node<PrepStep>>) {
  const { patchStep, deleteStep, durationUnit, hidePainPoints } = useEditor();
  const boxRef = useReportHeight(id);
  const isPain = !hidePainPoints && data.painPoint === true;
  const collapsed = data.collapsed === true;
  const { leaving, exit } = useExitThen(() => deleteStep(id));
  const metaBits = [
    data.duration
      ? `${data.duration}${durationUnit === "minutes" ? " min" : " u"}`
      : null,
    ...asChipList(data.tools).slice(0, 2),
  ].filter(Boolean);

  return (
    <div ref={boxRef} className="prep-pop-in w-[272px]">
    <div
      className={`prep-card rounded-xl border px-3.5 shadow-sm ${
        collapsed ? "py-2.5" : "py-3"
      } ${leaving ? "is-leaving" : ""} ${
        isPain ? "border-rose-200 bg-[#fff8f6]" : "border-black/8 bg-white"
      } ${selected ? "ring-2 ring-[#151f28]/15" : ""}`}
    >
      <Handle type="target" position={Position.Left} id="l" className={handleClass("target")} />
      <Handle type="target" position={Position.Top} id="t" className={handleClass("target")} />
      <Handle type="source" position={Position.Right} id="r" className={handleClass("source")} />
      <Handle type="source" position={Position.Bottom} id="b" className={handleClass("source")} />

      <div className="flex items-start gap-1.5">
        <button
          type="button"
          className="step-drag mt-0.5 cursor-grab rounded p-0.5 text-[#151f28]/30 hover:text-[#151f28]/70"
          aria-label="Sleep stap"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            patchStep(id, { collapsed: !collapsed });
          }}
          className="nodrag mt-0.5 rounded p-0.5 text-[#151f28]/35 hover:text-[#151f28]/75"
          aria-label={collapsed ? "Uitklappen" : "Inklappen"}
          title={collapsed ? "Uitklappen" : "Inklappen"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {collapsed ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              patchStep(id, { collapsed: false });
            }}
            className="nodrag min-w-0 flex-1 text-left"
          >
            <p className="truncate text-[14px] font-semibold leading-snug text-[#151f28]">
              {data.title.trim() || "Naamloze stap"}
            </p>
            {metaBits.length ? (
              <p className="mt-0.5 truncate text-[11px] text-[#151f28]/45">{metaBits.join(" · ")}</p>
            ) : null}
          </button>
        ) : (
          <textarea
            value={data.title}
            onChange={(e) => patchStep(id, { title: e.target.value })}
            placeholder="Titel van de stap"
            rows={2}
            className="nodrag min-w-0 flex-1 resize-none bg-transparent text-[15px] font-semibold leading-snug text-[#151f28] outline-none placeholder:text-[#151f28]/30"
          />
        )}
        {!hidePainPoints && !collapsed ? (
          <button
            type="button"
            aria-pressed={isPain}
            aria-label={isPain ? "Pijnpunt verwijderen" : "Markeer als pijnpunt"}
            title={isPain ? "Pijnpunt — klik om te verwijderen" : "Markeer als pijnpunt (frictie / dubbel werk)"}
            onClick={(e) => {
              e.stopPropagation();
              patchStep(id, { painPoint: !isPain });
            }}
            className={`step-pain nodrag rounded p-0.5 ${
              isPain
                ? "is-pain text-rose-600 hover:text-rose-700"
                : "text-[#151f28]/25 hover:text-[#151f28]/70"
            }`}
          >
            <FaceExpressionless className="h-3.5 w-3.5" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={exit}
          className="step-trash nodrag rounded p-0.5 text-[#151f28]/25 hover:text-red-500"
          aria-label="Stap verwijderen"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {!collapsed ? (
        <>
          <div className="mt-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#151f28]/35">
              Toelichting
            </p>
            <p className="mt-0.5 text-[11px] leading-snug text-[#151f28]/40">
              Wat gebeurt er precies? Sleep de rechteronderhoek om groter te maken.
            </p>
            <textarea
              value={data.description}
              onChange={(e) => patchStep(id, { description: e.target.value })}
              placeholder="Bijv. wie doet wat, in welk systeem, wat lever je op…"
              rows={3}
              className="nodrag nowheel mt-1.5 min-h-[4.5rem] w-full resize-y bg-transparent text-[13px] leading-snug text-[#151f28]/75 outline-none placeholder:text-[#151f28]/30"
            />
          </div>

          <div className="mt-2.5 space-y-2 border-t border-black/6 pt-2.5">
            <label className="flex min-w-0 items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0 text-[#151f28]/35" />
              <span className="sr-only">
                Duur in {durationUnit === "minutes" ? "minuten" : "uren"}
              </span>
              <span className="flex items-baseline gap-1">
                <input
                  type="number"
                  min={0}
                  step={durationUnit === "minutes" ? 1 : 0.5}
                  inputMode="decimal"
                  value={data.duration}
                  onChange={(e) => patchStep(id, { duration: e.target.value })}
                  placeholder="0"
                  className="nodrag nowheel bg-transparent text-[13px] tabular-nums text-[#151f28]/85 outline-none placeholder:text-[#151f28]/30 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  style={{ width: `${Math.max(String(data.duration || "0").length, 1) + 0.4}ch` }}
                />
                <span className="text-[13px] text-[#151f28]/45">
                  {durationUnit === "minutes" ? "min" : "uur"}
                </span>
              </span>
            </label>
            <ChipInput
              icon={Users}
              label="Persoon"
              placeholder="Persoon · intern"
              values={asChipList(data.people)}
              kind="person"
              onChange={(people) => patchStep(id, { people })}
            />
            <ChipInput
              icon={Building2}
              label="Partij"
              placeholder="Partij · extern"
              values={asChipList(data.parties)}
              kind="party"
              onChange={(parties) => patchStep(id, { parties })}
            />
            <ChipInput
              icon={Wrench}
              label="Tools"
              placeholder="Tools"
              values={asChipList(data.tools)}
              kind="tool"
              onChange={(tools) => patchStep(id, { tools })}
            />
            <ChipInput
              icon={FileType}
              label="Formaat"
              placeholder="Formaat"
              values={asChipList(data.formats)}
              kind="format"
              onChange={(formats) => patchStep(id, { formats })}
            />
          </div>
        </>
      ) : null}
    </div>
    </div>
  );
}

function AddStepNode(_props: NodeProps<Node<AddData>>) {
  return (
    <div className="nodrag flex h-[44px] w-[252px] items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-[#151f28]/20 bg-white text-[12px] font-semibold text-[#151f28]/70 transition-colors duration-200 hover:border-[#151f28]/40 hover:bg-[#151f28]/[0.03]">
      <Plus className="h-3.5 w-3.5" /> Stap toevoegen
    </div>
  );
}

function RevealAiNode({ data }: NodeProps<Node<RevealData>>) {
  return (
    <div className="nodrag flex h-[52px] w-[252px] flex-col justify-end">
      <div className="mx-3 h-px bg-[#151f28]/15" />
      <div
        className={`mt-2 flex h-[36px] items-center justify-center gap-1.5 rounded-xl text-[11px] font-semibold transition-colors duration-200 ${
          data.open
            ? "bg-white text-[#151f28]/55 ring-1 ring-black/10 hover:bg-[#151f28]/[0.03]"
            : "bg-[#ceff00] text-[#151f28] shadow-sm hover:bg-[#d8ff33]"
        }`}
      >
        <Sparkles className="h-3.5 w-3.5" />
        {data.open ? "Verberg AI-kansen" : "Toon AI-kansen"}
        {!data.open && data.count > 0 ? (
          <span className="rounded-full bg-[#151f28]/10 px-1.5 py-px font-mono text-[10px]">{data.count}</span>
        ) : null}
      </div>
    </div>
  );
}

function AiIdeaNode({ id, data, selected }: NodeProps<Node<PrepAiIdea>>) {
  const { patchAi, deleteAi } = useEditor();
  const boxRef = useReportHeight(id);
  const { leaving, exit } = useExitThen(() => deleteAi(id));

  return (
    <div ref={boxRef} className="prep-pop-in w-[252px]">
    <div
      className={`prep-card rounded-xl border px-3 py-2.5 shadow-sm ${
        leaving ? "is-leaving" : ""
      } ${
        selected
          ? "border-[#151f28] bg-[#ceff00] ring-2 ring-[#ceff00]/40"
          : "border-[#ceff00]/80 bg-[#f3ff9a]"
      }`}
    >
      <div className="flex items-start gap-1">
        <button
          type="button"
          className="ai-drag mt-0.5 cursor-grab rounded p-0.5 text-[#151f28]/35 hover:text-[#151f28]/70"
          aria-label="Sleep AI-kans"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <Sparkles className="h-3 w-3 shrink-0 text-[#151f28]/70" />
            <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#151f28]/55">
              AI-kans
            </span>
            {data.known && (
              <span className="rounded-full bg-[#151f28]/10 px-1.5 py-px text-[9px] font-semibold text-[#151f28]/70">
                Sophista
              </span>
            )}
          </div>
          <input
            value={data.title}
            onChange={(e) => patchAi(id, { title: e.target.value })}
            placeholder="Titel van de AI-kans"
            className="nodrag mt-1 w-full bg-transparent text-[13px] font-semibold text-[#151f28] outline-none placeholder:text-[#151f28]/35"
          />
        </div>
        <button
          type="button"
          onClick={exit}
          className="nodrag rounded p-0.5 text-[#151f28]/30 hover:text-red-600"
          aria-label="AI-kans verwijderen"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <textarea
        value={data.body}
        onChange={(e) => patchAi(id, { body: e.target.value })}
        placeholder="Wat kan AI hier doen?"
        rows={3}
        className="nodrag mt-1.5 w-full resize-none bg-transparent text-[11px] leading-snug text-[#151f28]/80 outline-none placeholder:text-[#151f28]/35"
      />
      <input
        value={data.sources}
        onChange={(e) => patchAi(id, { sources: e.target.value })}
        placeholder="Bronnen · bijv. Company.info"
        className="nodrag mt-1 w-full bg-transparent font-mono text-[10px] text-[#151f28]/55 outline-none placeholder:text-[#151f28]/30"
      />
    </div>
    </div>
  );
}

function AddAiNode(_props: NodeProps<Node<AddData>>) {
  return (
    <div className="nodrag flex h-[36px] w-[252px] items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-[#151f28]/25 bg-[#ceff00]/35 text-[11px] font-semibold text-[#151f28]/75 transition-colors duration-200 hover:border-[#151f28]/40 hover:bg-[#ceff00]/50">
      <Sparkles className="h-3.5 w-3.5" /> AI-kans
    </div>
  );
}

function stickyTilt(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 33 + id.charCodeAt(i)) >>> 0;
  return (hash % 7) - 3;
}

function StickyNode({ id, data, selected }: NodeProps<Node<PrepSticky>>) {
  const { patchSticky, deleteSticky } = useEditor();
  const { leaving, exit } = useExitThen(() => deleteSticky(id));
  const boxRef = useReportHeight(id);
  const tilt = stickyTilt(id);

  return (
    <div ref={boxRef} className="prep-pop-in w-[176px]">
      <div
        className={`prep-sticky-paper prep-card relative rounded-[2px] px-2.5 pb-2 pt-2 ${
          leaving ? "is-leaving" : ""
        } ${selected ? "ring-2 ring-[#151f28]/35" : ""}`}
        style={{ backgroundColor: data.color, transform: `rotate(${tilt}deg)` }}
      >
        <div className="flex items-start gap-1">
          <button
            type="button"
            className="mt-0.5 cursor-grab rounded p-0.5 text-[#151f28]/35 hover:text-[#151f28]/70"
            aria-label="Sleep sticky"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
          <textarea
            value={data.text}
            onChange={(e) => patchSticky(id, { text: e.target.value })}
            placeholder="Notitie…"
            rows={5}
            className="nodrag min-h-[88px] w-full resize-none bg-transparent text-[12px] leading-snug text-[#151f28]/90 outline-none placeholder:text-[#151f28]/35"
          />
          <button
            type="button"
            onClick={exit}
            className="nodrag rounded p-0.5 text-[#151f28]/30 hover:text-red-600"
            aria-label="Sticky verwijderen"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="nodrag nopan mt-1.5 flex items-center justify-center gap-1">
          {STICKY_COLORS.map((color) => {
            const active = data.color === color;
            return (
              <button
                key={color}
                type="button"
                aria-label={`Kleur ${color}`}
                onClick={(e) => {
                  e.stopPropagation();
                  patchSticky(id, { color });
                }}
                className={`h-2.5 w-2.5 rounded-full ring-1 ring-[#151f28]/20 ${
                  active ? "scale-110 ring-2 ring-[#151f28]/50" : "opacity-80 hover:opacity-100"
                }`}
                style={{ backgroundColor: color }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SketchEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  selected,
}: EdgeProps) {
  const { deleteConnection } = useEditor();
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16,
  });
  const btn = 24;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        interactionWidth={36}
        style={{
          ...style,
          strokeWidth: selected ? 3 : Number(style?.strokeWidth) || 2,
        }}
      />
      <foreignObject
        width={btn}
        height={btn}
        x={labelX - btn / 2}
        y={labelY - btn / 2}
        className="prep-edge-delete-fo"
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <button
          type="button"
          aria-label="Verbinding verwijderen"
          className="nodrag nopan flex h-6 w-6 items-center justify-center rounded-full border border-black/10 bg-white text-[#151f28]/55 shadow-sm hover:border-red-300 hover:text-red-600"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            deleteConnection(id);
          }}
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </foreignObject>
    </>
  );
}

const nodeTypes = {
  lane: LaneNode,
  "hours-band": HoursBandNode,
  milestone: MilestoneNode,
  "add-milestone": AddMilestoneNode,
  "prep-step": StepNode,
  "add-step": AddStepNode,
  "reveal-ai": RevealAiNode,
  "ai-idea": AiIdeaNode,
  "add-ai": AddAiNode,
  sticky: StickyNode,
};

const edgeTypes = {
  sketch: SketchEdge,
};

function toRfEdges(connections: PrepConnection[], steps: PrepStep[], prev: Edge[] = []): Edge[] {
  return connections.map((c) => {
    const from = steps.find((s) => s.id === c.source);
    const to = steps.find((s) => s.id === c.target);
    const cross = Boolean(from && to && from.milestoneId !== to.milestoneId);
    const previous = prev.find((e) => e.id === c.id);
    return {
      id: c.id,
      type: "sketch",
      source: c.source,
      target: c.target,
      sourceHandle: c.sourceHandle ?? undefined,
      targetHandle: c.targetHandle ?? undefined,
      animated: cross,
      selected: previous?.selected,
      deletable: true,
      interactionWidth: 36,
      style: {
        stroke: cross ? "#1125ff" : "#151f28",
        strokeWidth: previous?.selected ? 3 : 2,
        strokeDasharray: cross ? "7 5" : undefined,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: cross ? "#1125ff" : "#151f28",
        width: 16,
        height: 16,
      },
    };
  });
}

function fromRfEdges(edges: Edge[]): PrepConnection[] {
  return edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
  }));
}

const HISTORY_LIMIT = 50;
const COALESCE_MS = 800;

function cloneSketch(doc: PrepPhaseSketch): PrepPhaseSketch {
  return structuredClone(doc);
}

function reindexColumn<T extends { milestoneId: PrepMilestoneId; order: number }>(
  items: T[],
  milestoneId: PrepMilestoneId
): T[] {
  const col = items
    .filter((s) => s.milestoneId === milestoneId)
    .sort((a, b) => a.order - b.order)
    .map((s, i) => ({ ...s, order: i }));
  return [...items.filter((s) => s.milestoneId !== milestoneId), ...col];
}

function insertIndexFromY(
  items: { id: string }[],
  y: number,
  startY: number,
  heights: Record<string, number>,
  fallbackH: number,
  gap: number
) {
  let cursor = startY;
  for (let i = 0; i < items.length; i += 1) {
    const h = measured(heights, items[i].id, fallbackH);
    if (y < cursor + h / 2) return i;
    cursor += h + gap;
  }
  return items.length;
}

function snapToColumn(x: number, milestones: PrepMilestone[]): PrepMilestoneId {
  const cols = [...milestones].sort((a, b) => a.order - b.order);
  if (!cols.length) return "strategie";
  let col = Math.round((x + STEP_W / 2 - ORIGIN_X - COL_W / 2) / (COL_W + COL_GAP));
  col = Math.max(0, Math.min(cols.length - 1, col));
  return cols[col].id;
}

function milestoneInsertAt(x: number, milestones: PrepMilestone[], excludeId: string): number {
  const rest = milestones.filter((m) => m.id !== excludeId).sort((a, b) => a.order - b.order);
  const centerX = x + 130;
  let cursor = ORIGIN_X;
  for (let i = 0; i < rest.length; i += 1) {
    if (centerX < cursor + COL_W / 2) return i;
    cursor += COL_W + COL_GAP;
  }
  return rest.length;
}

function reorderMilestones(list: PrepMilestone[], id: string, insertAt: number): PrepMilestone[] {
  const sorted = [...list].sort((a, b) => a.order - b.order);
  const moving = sorted.find((m) => m.id === id);
  if (!moving) return list;
  const rest = sorted.filter((m) => m.id !== id);
  const at = Math.max(0, Math.min(rest.length, insertAt));
  rest.splice(at, 0, moving);
  return rest.map((m, i) => ({ ...m, order: i }));
}

function stepFallbackH(step: { collapsed?: boolean }) {
  return step.collapsed ? STEP_COLLAPSED_H : STEP_H;
}

function stepsBlockHeight(
  heights: Record<string, number>,
  steps: PrepStep[]
) {
  let h = 0;
  for (const step of steps) h += measured(heights, step.id, stepFallbackH(step)) + STEP_GAP;
  return h + ADD_H + 8 + REVEAL_H + 8;
}

function dropSlot(
  node: Node,
  steps: PrepStep[],
  ideas: PrepAiIdea[],
  heights: Record<string, number>,
  milestones: PrepMilestone[],
  showAiKansen: boolean,
  revealedIds: string[]
): { kind: "prep-step" | "ai-idea"; milestoneId: PrepMilestoneId; insertAt: number } | null {
  const milestoneId = snapToColumn(node.position.x, milestones);
  if (node.type === "prep-step") {
    const siblings = steps
      .filter((s) => s.milestoneId === milestoneId && s.id !== node.id)
      .sort((a, b) => a.order - b.order);
    const startY = columnContentY(heights, milestoneId);
    const moving = steps.find((s) => s.id === node.id);
    const ownH = measured(heights, node.id, stepFallbackH(moving ?? {}));
    const centerY = node.position.y + ownH / 2;
    let cursor = startY;
    let insertAt = siblings.length;
    for (let i = 0; i < siblings.length; i += 1) {
      const h = measured(heights, siblings[i].id, stepFallbackH(siblings[i]));
      if (centerY < cursor + h / 2) {
        insertAt = i;
        break;
      }
      cursor += h + STEP_GAP;
    }
    return {
      kind: "prep-step",
      milestoneId,
      insertAt,
    };
  }
  if (node.type === "ai-idea") {
    if (!isAiOpen(milestoneId, showAiKansen, revealedIds)) return null;
    const colSteps = steps
      .filter((s) => s.milestoneId === milestoneId)
      .sort((a, b) => a.order - b.order);
    const siblings = ideas
      .filter((a) => a.milestoneId === milestoneId && a.id !== node.id)
      .sort((a, b) => a.order - b.order);
    const startY = columnContentY(heights, milestoneId) + stepsBlockHeight(heights, colSteps);
    const centerY = node.position.y + measured(heights, node.id, AI_H) / 2;
    return {
      kind: "ai-idea",
      milestoneId,
      insertAt: insertIndexFromY(siblings, centerY, startY, heights, AI_H, AI_GAP),
    };
  }
  return null;
}

function placeInColumn<T extends { id: string; milestoneId: PrepMilestoneId; order: number }>(
  items: T[],
  id: string,
  milestoneId: PrepMilestoneId,
  insertAt: number
): T[] {
  const moving = items.find((s) => s.id === id);
  if (!moving) return items;
  const rest = items.filter((s) => s.id !== id);
  const inTarget = rest.filter((s) => s.milestoneId === milestoneId).sort((a, b) => a.order - b.order);
  const at = Math.max(0, Math.min(inTarget.length, insertAt));
  const placed = [...inTarget];
  placed.splice(at, 0, { ...moving, milestoneId });
  const reindexedTarget = placed.map((s, i) => ({ ...s, order: i }));
  const others = rest.filter((s) => s.milestoneId !== milestoneId);
  const sourceReindexed =
    moving.milestoneId === milestoneId ? others : reindexColumn(others, moving.milestoneId);
  return [...sourceReindexed.filter((s) => s.milestoneId !== milestoneId), ...reindexedTarget];
}

type Props = {
  initial: PrepPhaseSketch;
  remote?: PrepPhaseSketch | null;
  onSave: (doc: PrepPhaseSketch, touched: SketchPatchKey[]) => void;
  sketchLabel?: string;
  sketchHelp?: {
    title: string;
    body: string[];
    expect?: string[];
  };
  hideAiToggle?: boolean;
  hidePainPoints?: boolean;
};

function minimapNodeColor(n: Node) {
  if (n.type === "lane") return laneMinimapColor((n.data as LaneData).index);
  if (n.type === "hours-band" || n.type === "milestone") return "#151f28";
  if (n.type === "prep-step") {
    const step = n.data as PrepStep;
    if (step.painPoint) return "#fff4f0";
    return "#ffffff";
  }
  if (n.type === "ai-idea") return "#f3ff9a";
  if (n.type === "sticky") return (n.data as PrepSticky).color || "#FDE047";
  if (n.type === "reveal-ai") return (n.data as RevealData).open ? "#ffffff" : "#ceff00";
  if (n.type === "add-ai") return "rgba(206, 255, 0, 0.35)";
  if (n.type === "add-step" || n.type === "add-milestone") return "#ffffff";
  return "transparent";
}

function minimapNodeStroke(n: Node) {
  if (n.type === "prep-step") {
    const step = n.data as PrepStep;
    if (asChipList(step.parties).length) return "#fb923c";
    if (step.painPoint) return "#fda4af";
    return "rgba(21, 31, 40, 0.16)";
  }
  if (n.type === "ai-idea") return "rgba(206, 255, 0, 0.9)";
  if (n.type === "sticky") return "rgba(21, 31, 40, 0.12)";
  if (n.type === "add-step" || n.type === "add-milestone" || n.type === "add-ai") {
    return "rgba(21, 31, 40, 0.22)";
  }
  if (n.type === "reveal-ai") return "rgba(21, 31, 40, 0.12)";
  return "rgba(21, 31, 40, 0.08)";
}

function SketchMiniMap() {
  const paneW = useStore((s) => s.width);
  const paneH = useStore((s) => s.height);
  const aspect = paneW > 1 && paneH > 1 ? paneW / paneH : 16 / 9;
  const height = 112;
  const width = Math.round(Math.min(340, Math.max(168, height * aspect)));

  return (
    <MiniMap
      pannable
      zoomable
      ariaLabel="Overzicht van de schets"
      offsetScale={2}
      bgColor={BOARD_BG}
      maskColor="rgba(21, 31, 40, 0.22)"
      maskStrokeColor="#1125ff"
      maskStrokeWidth={1.5}
      nodeBorderRadius={6}
      nodeColor={minimapNodeColor}
      nodeStrokeColor={minimapNodeStroke}
      style={{ width, height }}
      className="!bottom-3 !right-3 !m-0 !rounded-xl !bg-[#f3f1eb] !shadow-lg"
    />
  );
}

function carryNodeState(next: Node[], prev: Node[], draggingId: string | null): Node[] {
  const prevById = new Map(prev.map((n) => [n.id, n]));
  return next.map((n) => {
    const old = prevById.get(n.id);
    if (!old) return n;
    return {
      ...n,
      measured: old.measured,
      selected: old.selected,
      position: draggingId === n.id ? old.position : n.position,
    };
  });
}

function FlowCanvas({
  initial,
  remote,
  onSave,
  sketchLabel = "Processen",
  sketchHelp,
  hideAiToggle = false,
  hidePainPoints = false,
}: Props) {
  const { fitView, screenToFlowPosition, zoomIn, zoomOut } = useReactFlow();
  const fitToScreen = useCallback(() => {
    fitView({ padding: 0.08, duration: 220 });
  }, [fitView]);
  const [stepList, setStepList] = useState<PrepStep[]>(() => initial.steps.map(normalizePrepStep));
  const [aiList, setAiList] = useState<PrepAiIdea[]>(() => initial.aiIdeas ?? []);
  const [milestones, setMilestones] = useState<PrepMilestone[]>(
    () => initial.milestones ?? createDefaultPrepMilestones()
  );
  const [stickyList, setStickyList] = useState<PrepSticky[]>(() => initial.stickies ?? []);
  const [showAiKansen, setShowAiKansen] = useState(() => initial.showAiKansen === true);
  const [revealedAiIds, setRevealedAiIds] = useState<string[]>(
    () => initial.revealedAiMilestoneIds ?? []
  );
  const [durationUnit, setDurationUnitState] = useState<DurationUnit>(
    () => (initial.durationUnit === "minutes" ? "minutes" : "hours")
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(toRfEdges(initial.connections, initial.steps));
  const [nodes, setNodes, onNodesChange] = useNodesState(
    layoutNodes(
      initial.milestones ?? createDefaultPrepMilestones(),
      initial.steps.map(normalizePrepStep),
      initial.aiIdeas ?? [],
      {},
      initial.stickies ?? [],
      initial.showAiKansen === true,
      initial.revealedAiMilestoneIds ?? []
    )
  );
  const dragging = useRef(false);
  const flowWrapRef = useRef<HTMLDivElement>(null);
  const dragId = useRef<string | null>(null);
  const lastSlot = useRef("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyKeys = useRef(new Set<SketchPatchKey>());
  const saveGen = useRef(0);
  const statusRef = useRef<HTMLSpanElement>(null);
  const ready = useRef(false);
  const stepsRef = useRef(stepList);
  const aiRef = useRef(aiList);
  const milestonesRef = useRef(milestones);
  const stickiesRef = useRef(stickyList);
  const showAiRef = useRef(showAiKansen);
  const revealedAiRef = useRef(revealedAiIds);
  const durationUnitRef = useRef(durationUnit);
  const edgesRef = useRef(edges);
  const heightsRef = useRef<Record<string, number>>({});
  const pendingStickyFocus = useRef<string | null>(null);
  const firstSketchActive = useRef(true);
  const historyRef = useRef<{ past: PrepPhaseSketch[]; future: PrepPhaseSketch[] }>({
    past: [],
    future: [],
  });
  const coalesceRef = useRef<{ key: string; at: number } | null>(null);
  const skipHistory = useRef(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [showSketchTips, setShowSketchTips] = useState(false);
  const tipsRef = useRef<HTMLDivElement>(null);
  const [heightRev, setHeightRev] = useState(0);
  stepsRef.current = stepList;
  aiRef.current = aiList;
  milestonesRef.current = milestones;
  stickiesRef.current = stickyList;
  showAiRef.current = showAiKansen;
  revealedAiRef.current = revealedAiIds;
  durationUnitRef.current = durationUnit;
  edgesRef.current = edges;

  const reportHeight = useCallback((id: string, height: number) => {
    const next = Math.max(40, Math.round(height));
    if (heightsRef.current[id] === next) return;
    heightsRef.current = { ...heightsRef.current, [id]: next };
    if (!dragging.current) setHeightRev((n) => n + 1);
  }, []);

  const persist = useCallback((...keys: SketchPatchKey[]) => {
    if (!ready.current) return;
    for (const key of keys) dirtyKeys.current.add(key);
    saveGen.current += 1;
    const gen = saveGen.current;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (statusRef.current) statusRef.current.textContent = "Opslaan…";
    saveTimer.current = setTimeout(() => {
      const touched = [...dirtyKeys.current];
      saveTimer.current = null;
      onSave(
        {
          type: "prep-phase-v1",
          steps: stepsRef.current,
          connections: fromRfEdges(edgesRef.current),
          aiIdeas: aiRef.current,
          milestones: milestonesRef.current,
          stickies: stickiesRef.current,
          showAiKansen: showAiRef.current,
          revealedAiMilestoneIds: revealedAiRef.current,
        },
        touched
      );
      if (statusRef.current) statusRef.current.textContent = "Opgeslagen";
      window.setTimeout(() => {
        if (gen !== saveGen.current) return;
        dirtyKeys.current.clear();
      }, 800);
    }, 400);
  }, [onSave]);

  const snapshotFromRefs = useCallback((): PrepPhaseSketch => {
    return {
      type: "prep-phase-v1",
      steps: stepsRef.current,
      connections: fromRfEdges(edgesRef.current),
      aiIdeas: aiRef.current,
      milestones: milestonesRef.current,
      stickies: stickiesRef.current,
      showAiKansen: showAiRef.current,
      revealedAiMilestoneIds: revealedAiRef.current,
      durationUnit: durationUnitRef.current,
    };
  }, []);

  const pushHistory = useCallback(
    (coalesceKey?: string) => {
      if (skipHistory.current) return;
      const now = Date.now();
      if (
        coalesceKey &&
        coalesceRef.current &&
        coalesceRef.current.key === coalesceKey &&
        now - coalesceRef.current.at < COALESCE_MS
      ) {
        coalesceRef.current.at = now;
        return;
      }
      coalesceRef.current = coalesceKey ? { key: coalesceKey, at: now } : null;
      const snap = cloneSketch(snapshotFromRefs());
      const past = historyRef.current.past;
      const last = past[past.length - 1];
      if (last && sketchFingerprint(last) === sketchFingerprint(snap)) return;
      past.push(snap);
      if (past.length > HISTORY_LIMIT) past.shift();
      historyRef.current.future = [];
      setCanUndo(true);
      setCanRedo(false);
    },
    [snapshotFromRefs]
  );

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== "ws-sketch-active") return;
      if (!event.data.active) return;
      if (firstSketchActive.current) {
        firstSketchActive.current = false;
        return;
      }
      const root = flowWrapRef.current;
      if (!root) return;
      root.querySelectorAll<HTMLElement>(".react-flow__node").forEach((node, i) => {
        node.style.setProperty("--view-i", String(Math.min(i, 12)));
      });
      root.classList.remove("is-view-enter");
      void root.offsetWidth;
      root.classList.add("is-view-enter");
      window.setTimeout(() => {
        root.classList.remove("is-view-enter");
      }, 420);
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const structureKey = [
    milestones.map((m) => `${m.id}:${m.order}`).join("|"),
    stepList.map((s) => `${s.id}:${s.milestoneId}:${s.order}:${s.collapsed ? "c" : "o"}`).join("|"),
    aiList.map((a) => `${a.id}:${a.milestoneId}:${a.order}`).join("|"),
    stickyList.map((s) => s.id).join("|"),
    showAiKansen ? "ai-on" : "ai-off",
    revealedAiIds.join(","),
  ].join("||");

  const applyLayout = useCallback(() => {
    const laidOut = layoutNodes(
      milestonesRef.current,
      stepsRef.current,
      aiRef.current,
      heightsRef.current,
      stickiesRef.current,
      showAiRef.current,
      revealedAiRef.current
    );
    const id = dragId.current;
    setNodes((prev) => carryNodeState(laidOut, prev, dragging.current && id ? id : null));
  }, [setNodes]);

  const applyDoc = useCallback(
    (doc: PrepPhaseSketch, opts?: { force?: boolean }) => {
      const skip = opts?.force ? new Set<SketchPatchKey>() : dirtyKeys.current;
      const steps = skip.has("steps") ? stepsRef.current : doc.steps.map(normalizePrepStep);
      const ai = skip.has("aiIdeas") ? aiRef.current : (doc.aiIdeas ?? []);
      const miles = skip.has("milestones")
        ? milestonesRef.current
        : (doc.milestones ?? createDefaultPrepMilestones());
      const stickies = skip.has("stickies") ? stickiesRef.current : (doc.stickies ?? []);
      const showAi = skip.has("showAiKansen") ? showAiRef.current : doc.showAiKansen === true;
      const revealed = skip.has("revealedAiMilestoneIds")
        ? revealedAiRef.current
        : (doc.revealedAiMilestoneIds ?? []);
      const unit = skip.has("durationUnit")
        ? durationUnitRef.current
        : doc.durationUnit === "minutes"
          ? "minutes"
          : "hours";
      const connections = skip.has("connections") ? fromRfEdges(edgesRef.current) : doc.connections;

      stepsRef.current = steps;
      aiRef.current = ai;
      milestonesRef.current = miles;
      stickiesRef.current = stickies;
      showAiRef.current = showAi;
      revealedAiRef.current = revealed;
      durationUnitRef.current = unit;

      setStepList(steps);
      setAiList(ai);
      setMilestones(miles);
      setStickyList(stickies);
      setShowAiKansen(showAi);
      setRevealedAiIds(revealed);
      setDurationUnitState(unit);

      const styled = toRfEdges(connections, steps, edgesRef.current);
      edgesRef.current = styled;
      setEdges(styled);
      applyLayout();
    },
    [applyLayout, setEdges]
  );

  const restoreSketch = useCallback(
    (doc: PrepPhaseSketch) => {
      skipHistory.current = true;
      applyDoc(doc, { force: true });
      persist(...SKETCH_PATCH_KEYS);
      skipHistory.current = false;
    },
    [applyDoc, persist]
  );

  const undoSketch = useCallback(() => {
    const { past, future } = historyRef.current;
    if (!past.length) return;
    coalesceRef.current = null;
    const current = cloneSketch(snapshotFromRefs());
    const prev = past.pop()!;
    future.push(current);
    restoreSketch(prev);
    setCanUndo(past.length > 0);
    setCanRedo(true);
    if (statusRef.current) statusRef.current.textContent = "Ongedaan gemaakt";
  }, [restoreSketch, snapshotFromRefs]);

  const redoSketch = useCallback(() => {
    const { past, future } = historyRef.current;
    if (!future.length) return;
    coalesceRef.current = null;
    const current = cloneSketch(snapshotFromRefs());
    const next = future.pop()!;
    past.push(current);
    restoreSketch(next);
    setCanUndo(true);
    setCanRedo(future.length > 0);
    if (statusRef.current) statusRef.current.textContent = "Opnieuw toegepast";
  }, [restoreSketch, snapshotFromRefs]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.isComposing) return;
      const mod = event.metaKey || event.ctrlKey;
      if (!mod) return;
      const key = event.key.toLowerCase();
      if (key !== "z" && key !== "y") return;
      const wantRedo = (key === "z" && event.shiftKey) || (key === "y" && !event.shiftKey);
      event.preventDefault();
      event.stopPropagation();
      if (wantRedo) redoSketch();
      else undoSketch();
    }
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [redoSketch, undoSketch]);

  useEffect(() => {
    if (!showSketchTips) return;
    function onPointerDown(event: PointerEvent) {
      if (tipsRef.current?.contains(event.target as globalThis.Node)) return;
      setShowSketchTips(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setShowSketchTips(false);
    }
    document.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [showSketchTips]);

  useEffect(() => {
    if (!remote) return;
    if (dragging.current) return;
    const local: PrepPhaseSketch = {
      type: "prep-phase-v1",
      steps: stepsRef.current,
      connections: fromRfEdges(edgesRef.current),
      aiIdeas: aiRef.current,
      milestones: milestonesRef.current,
      stickies: stickiesRef.current,
      showAiKansen: showAiRef.current,
      revealedAiMilestoneIds: revealedAiRef.current,
      durationUnit: durationUnitRef.current,
    };
    if (sketchFingerprint(remote) === sketchFingerprint(local)) return;
    if (dirtyKeys.current.size > 0) return;
    applyDoc(remote);
    historyRef.current = { past: [], future: [] };
    coalesceRef.current = null;
    setCanUndo(false);
    setCanRedo(false);
  }, [applyDoc, remote]);

  useEffect(() => {
    applyLayout();
  }, [applyLayout, structureKey, heightRev]);

  useEffect(() => {
    const id = pendingStickyFocus.current;
    if (!id) return;
    const t = window.setTimeout(() => {
      if (pendingStickyFocus.current !== id) return;
      pendingStickyFocus.current = null;
      const el = document.querySelector(`[data-id="${CSS.escape(id)}"] textarea`);
      if (el instanceof HTMLTextAreaElement) el.focus();
    }, 60);
    return () => window.clearTimeout(t);
  }, [structureKey]);

  useEffect(() => {
    setEdges((eds) => {
      const styled = toRfEdges(fromRfEdges(eds), stepsRef.current, eds);
      edgesRef.current = styled;
      return styled;
    });
  }, [setEdges, structureKey]);

  useEffect(() => {
    ready.current = true;
    const t = window.setTimeout(() => {
      fitView({ padding: 0.08, duration: 240 });
    }, 120);
    return () => window.clearTimeout(t);
  }, [fitView]);

  const patchStep = useCallback(
    (id: string, partial: Partial<PrepStep>) => {
      pushHistory(`step:${id}:${Object.keys(partial).sort().join(",")}`);
      setStepList((prev) => {
        const next = prev.map((s) => (s.id === id ? { ...s, ...partial } : s));
        stepsRef.current = next;
        return next;
      });
      setNodes((prev) =>
        prev.map((n) =>
          n.id === id && n.type === "prep-step"
            ? { ...n, data: { ...(n.data as PrepStep), ...partial } }
            : n
        )
      );
      persist("steps");
    },
    [persist, pushHistory, setNodes]
  );

  const patchAi = useCallback(
    (id: string, partial: Partial<PrepAiIdea>) => {
      pushHistory(`ai:${id}:${Object.keys(partial).sort().join(",")}`);
      setAiList((prev) => {
        const next = prev.map((s) => (s.id === id ? { ...s, ...partial } : s));
        aiRef.current = next;
        return next;
      });
      setNodes((prev) =>
        prev.map((n) =>
          n.id === id && n.type === "ai-idea"
            ? { ...n, data: { ...(n.data as PrepAiIdea), ...partial } }
            : n
        )
      );
      persist("aiIdeas");
    },
    [persist, pushHistory, setNodes]
  );

  const deleteStep = useCallback(
    (id: string) => {
      pushHistory();
      setStepList((prev) => {
        const gone = prev.find((s) => s.id === id);
        if (!gone) return prev;
        const next = reindexColumn(
          prev.filter((s) => s.id !== id),
          gone.milestoneId
        );
        stepsRef.current = next;
        return next;
      });
      setEdges((eds) => {
        const next = eds.filter((e) => e.source !== id && e.target !== id);
        edgesRef.current = next;
        return next;
      });
      persist("steps", "connections");
    },
    [persist, pushHistory, setEdges]
  );

  const deleteAi = useCallback(
    (id: string) => {
      pushHistory();
      setAiList((prev) => {
        const gone = prev.find((s) => s.id === id);
        if (!gone) return prev;
        const next = reindexColumn(
          prev.filter((s) => s.id !== id),
          gone.milestoneId
        );
        aiRef.current = next;
        return next;
      });
      persist("aiIdeas");
    },
    [persist, pushHistory]
  );

  const addStep = useCallback(
    (milestoneId: PrepMilestoneId) => {
      pushHistory();
      setStepList((prev) => {
        const order = prev.filter((s) => s.milestoneId === milestoneId).length;
        const next = [
          ...prev,
          {
            id: `st-${nanoid(8)}`,
            milestoneId,
            title: "",
            description: "",
            duration: "",
            people: [],
            parties: [],
            tools: [],
            formats: [],
            painPoint: false,
            collapsed: false,
            order,
          },
        ];
        stepsRef.current = next;
        return next;
      });
      persist("steps");
    },
    [persist, pushHistory]
  );

  const addAi = useCallback(
    (milestoneId: PrepMilestoneId) => {
      pushHistory();
      setAiList((prev) => {
        const order = prev.filter((s) => s.milestoneId === milestoneId).length;
        const next = [
          ...prev,
          {
            id: `ai-${nanoid(8)}`,
            milestoneId,
            title: "",
            body: "",
            sources: "",
            known: false,
            order,
          },
        ];
        aiRef.current = next;
        return next;
      });
      persist("aiIdeas");
    },
    [persist, pushHistory]
  );

  const patchMilestone = useCallback(
    (id: string, partial: Partial<PrepMilestone>) => {
      pushHistory(`milestone:${id}:${Object.keys(partial).sort().join(",")}`);
      setMilestones((prev) => {
        const next = prev.map((m) => (m.id === id ? { ...m, ...partial } : m));
        milestonesRef.current = next;
        return next;
      });
      setNodes((prev) =>
        prev.map((n) =>
          n.type === "milestone" && (n.data as PrepMilestone).id === id
            ? { ...n, data: { ...(n.data as MilestoneData), ...partial } }
            : n
        )
      );
      persist("milestones");
    },
    [persist, pushHistory, setNodes]
  );

  const addMilestone = useCallback(() => {
    pushHistory();
    setMilestones((prev) => {
      const next = [
        ...prev,
        {
          id: `ms-${nanoid(8)}`,
          short: "Nieuw proces",
          title: "",
          order: prev.length,
        },
      ];
      milestonesRef.current = next;
      return next;
    });
    persist("milestones");
  }, [persist, pushHistory]);

  const deleteMilestone = useCallback(
    (id: string) => {
      if (milestonesRef.current.length <= 1) return;
      pushHistory();
      const removedStepIds = new Set(
        stepsRef.current.filter((s) => s.milestoneId === id).map((s) => s.id)
      );
      setMilestones((prev) => {
        const next = prev
          .filter((m) => m.id !== id)
          .sort((a, b) => a.order - b.order)
          .map((m, i) => ({ ...m, order: i }));
        milestonesRef.current = next;
        return next;
      });
      setStepList((prev) => {
        const next = prev.filter((s) => s.milestoneId !== id);
        stepsRef.current = next;
        return next;
      });
      setAiList((prev) => {
        const next = prev.filter((s) => s.milestoneId !== id);
        aiRef.current = next;
        return next;
      });
      setEdges((prev) => {
        const next = prev.filter(
          (e) => !removedStepIds.has(e.source) && !removedStepIds.has(e.target)
        );
        edgesRef.current = next;
        return next;
      });
      setRevealedAiIds((prev) => {
        const next = prev.filter((mid) => mid !== id);
        revealedAiRef.current = next;
        return next;
      });
      persist("milestones", "steps", "aiIdeas", "connections", "revealedAiMilestoneIds");
    },
    [persist, pushHistory, setEdges]
  );

  const [deletePrompt, setDeletePrompt] = useState<{
    id: string;
    title: string;
    stepCount: number;
  } | null>(null);

  const requestDeleteMilestone = useCallback((id: string) => {
    if (milestonesRef.current.length <= 1) return;
    const mile = milestonesRef.current.find((m) => m.id === id);
    if (!mile) return;
    const stepCount = stepsRef.current.filter((s) => s.milestoneId === id).length;
    setDeletePrompt({
      id,
      title: mile.short.trim() || mile.title.trim() || "Dit proces",
      stepCount,
    });
  }, []);

  const setStepsCollapsed = useCallback(
    (collapsed: boolean) => {
      pushHistory("collapse-all");
      setStepList((prev) => {
        const next = prev.map((s) => ({ ...s, collapsed }));
        stepsRef.current = next;
        return next;
      });
      persist("steps");
    },
    [persist, pushHistory]
  );

  const patchSticky = useCallback(
    (id: string, partial: Partial<PrepSticky>) => {
      pushHistory(`sticky:${id}:${Object.keys(partial).sort().join(",")}`);
      setStickyList((prev) => {
        const next = prev.map((s) => (s.id === id ? { ...s, ...partial } : s));
        stickiesRef.current = next;
        return next;
      });
      setNodes((prev) =>
        prev.map((n) =>
          n.id === id && n.type === "sticky"
            ? { ...n, data: { ...(n.data as PrepSticky), ...partial } }
            : n
        )
      );
      persist("stickies");
    },
    [persist, pushHistory, setNodes]
  );

  const deleteSticky = useCallback(
    (id: string) => {
      pushHistory();
      setStickyList((prev) => {
        const next = prev.filter((s) => s.id !== id);
        stickiesRef.current = next;
        return next;
      });
      persist("stickies");
    },
    [persist, pushHistory]
  );

  const deleteConnection = useCallback(
    (id: string) => {
      pushHistory("connections");
      setEdges((eds) => {
        const next = eds.filter((e) => e.id !== id);
        edgesRef.current = next;
        return next;
      });
      persist("connections");
    },
    [persist, pushHistory, setEdges]
  );

  const addStickyAt = useCallback(
    (position: { x: number; y: number }) => {
      pushHistory();
      const n = stickiesRef.current.length;
      const sticky: PrepSticky = {
        id: `sk-${nanoid(8)}`,
        text: "",
        color: STICKY_COLORS[n % STICKY_COLORS.length],
        x: position.x,
        y: position.y,
      };
      pendingStickyFocus.current = sticky.id;
      setStickyList((prev) => {
        const next = [...prev, sticky];
        stickiesRef.current = next;
        return next;
      });
      persist("stickies");
    },
    [persist, pushHistory]
  );

  const addStickyInView = useCallback(() => {
    const rect = flowWrapRef.current?.getBoundingClientRect();
    const n = stickiesRef.current.length;
    const pos = screenToFlowPosition({
      x: (rect?.left ?? 0) + 132 + (n % 5) * 18,
      y: (rect?.top ?? 0) + 92 + (n % 5) * 18,
    });
    addStickyAt(pos);
  }, [addStickyAt, screenToFlowPosition]);

  const hoursByMilestone = useMemo(() => {
    const totals = {} as Record<PrepMilestoneId, number>;
    for (const m of milestones) totals[m.id] = 0;
    for (const step of stepList) {
      totals[step.milestoneId] = (totals[step.milestoneId] ?? 0) + parseDuration(step.duration);
    }
    return totals;
  }, [milestones, stepList]);

  const peopleByMilestone = useMemo(
    () => uniqueChipsByMilestone(milestones, stepList, (s) => asChipList(s.people)),
    [milestones, stepList]
  );

  const partiesByMilestone = useMemo(
    () => uniqueChipsByMilestone(milestones, stepList, (s) => asChipList(s.parties)),
    [milestones, stepList]
  );

  const toolsByMilestone = useMemo(
    () => uniqueChipsByMilestone(milestones, stepList, (s) => asChipList(s.tools)),
    [milestones, stepList]
  );

  const formatsByMilestone = useMemo(
    () => uniqueChipsByMilestone(milestones, stepList, (s) => asChipList(s.formats)),
    [milestones, stepList]
  );

  const chipSuggestions = useMemo<Record<ChipKind, string[]>>(() => {
    const enteredFormats = uniqueChipList(stepList, (s) => asChipList(s.formats));
    const haveFormat = new Set(enteredFormats.map((s) => s.toLowerCase()));
    return {
      person: uniqueChipList(stepList, (s) => asChipList(s.people)),
      party: uniqueChipList(stepList, (s) => asChipList(s.parties)),
      tool: uniqueChipList(stepList, (s) => asChipList(s.tools)),
      format: [
        ...enteredFormats,
        ...FORMAT_PRESETS.filter((p) => !haveFormat.has(p.toLowerCase())),
      ],
    };
  }, [stepList]);

  const aiCountByMilestone = useMemo(() => {
    const totals = {} as Record<PrepMilestoneId, number>;
    for (const m of milestones) totals[m.id] = 0;
    for (const idea of aiList) {
      totals[idea.milestoneId] = (totals[idea.milestoneId] ?? 0) + 1;
    }
    return totals;
  }, [aiList, milestones]);

  const painCountByMilestone = useMemo(() => {
    const totals = {} as Record<PrepMilestoneId, number>;
    for (const m of milestones) totals[m.id] = 0;
    for (const step of stepList) {
      if (step.painPoint) totals[step.milestoneId] = (totals[step.milestoneId] ?? 0) + 1;
    }
    return totals;
  }, [milestones, stepList]);

  const toggleAiColumn = useCallback(
    (milestoneId: PrepMilestoneId) => {
      pushHistory(`ai-col:${milestoneId}`);
      if (showAiRef.current) {
        showAiRef.current = false;
        setShowAiKansen(false);
        const next = milestonesRef.current.map((m) => m.id).filter((id) => id !== milestoneId);
        revealedAiRef.current = next;
        setRevealedAiIds(next);
      } else if (revealedAiRef.current.includes(milestoneId)) {
        const next = revealedAiRef.current.filter((id) => id !== milestoneId);
        revealedAiRef.current = next;
        setRevealedAiIds(next);
      } else {
        const next = [...revealedAiRef.current, milestoneId];
        revealedAiRef.current = next;
        setRevealedAiIds(next);
      }
      persist("showAiKansen", "revealedAiMilestoneIds");
    },
    [persist, pushHistory]
  );

  const setDurationUnit = useCallback(
    (next: DurationUnit) => {
      const prev = durationUnitRef.current;
      if (prev === next) return;
      pushHistory("duration-unit");
      setStepList((list) => {
        const converted = list.map((step) => ({
          ...step,
          duration: convertDurationValue(step.duration, prev, next),
        }));
        stepsRef.current = converted;
        return converted;
      });
      durationUnitRef.current = next;
      setDurationUnitState(next);
      persist("durationUnit", "steps");
    },
    [persist, pushHistory]
  );

  const ctx = useMemo<EditorCtx>(
    () => ({
      patchStep,
      deleteStep,
      addStep,
      patchAi,
      deleteAi,
      addAi,
      hoursByMilestone,
      aiCountByMilestone,
      painCountByMilestone,
      peopleByMilestone,
      partiesByMilestone,
      toolsByMilestone,
      formatsByMilestone,
      showAiKansen,
      revealedAiMilestoneIds: revealedAiIds,
      toggleAiColumn,
      reportHeight,
      patchMilestone,
      addMilestone,
      requestDeleteMilestone,
      canDeleteMilestone: milestones.length > 1,
      setStepsCollapsed,
      patchSticky,
      deleteSticky,
      deleteConnection,
      chipSuggestions,
      durationUnit,
      hidePainPoints,
    }),
    [
      addAi,
      addMilestone,
      requestDeleteMilestone,
      setStepsCollapsed,
      addStep,
      aiCountByMilestone,
      chipSuggestions,
      deleteAi,
      deleteConnection,
      deleteStep,
      deleteSticky,
      durationUnit,
      formatsByMilestone,
      hidePainPoints,
      hoursByMilestone,
      milestones.length,
      painCountByMilestone,
      patchAi,
      patchMilestone,
      patchStep,
      patchSticky,
      peopleByMilestone,
      partiesByMilestone,
      revealedAiIds,
      reportHeight,
      showAiKansen,
      toggleAiColumn,
      toolsByMilestone,
    ]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target || connection.source === connection.target) return;
      pushHistory("connections");
      setEdges((eds) => {
        const dup = eds.some((e) => e.source === connection.source && e.target === connection.target);
        if (dup) return eds;
        const next = addEdge({ ...connection, id: `e-${nanoid(6)}` }, eds);
        const styled = toRfEdges(fromRfEdges(next), stepsRef.current, next);
        edgesRef.current = styled;
        persist("connections");
        return styled;
      });
    },
    [persist, pushHistory, setEdges]
  );

  const previewDrag = useCallback((node: Node, shouldPersist: boolean) => {
    if (node.type === "milestone") {
      const id = (node.data as MilestoneData).id;
      const insertAt = milestoneInsertAt(node.position.x, milestonesRef.current, id);
      const slot = `ms:${id}:${insertAt}`;
      if (lastSlot.current !== slot) {
        lastSlot.current = slot;
        setMilestones((prev) => {
          const next = reorderMilestones(prev, id, insertAt);
          milestonesRef.current = next;
          return next;
        });
      }
      if (shouldPersist) persist("milestones");
      return;
    }
    const slotInfo = dropSlot(
      node,
      stepsRef.current,
      aiRef.current,
      heightsRef.current,
      milestonesRef.current,
      showAiRef.current,
      revealedAiRef.current
    );
    if (!slotInfo) return;
    const slot = `${slotInfo.kind}:${node.id}:${slotInfo.milestoneId}:${slotInfo.insertAt}`;
    if (lastSlot.current !== slot) {
      lastSlot.current = slot;
      if (slotInfo.kind === "prep-step") {
        setStepList((prev) => {
          const next = placeInColumn(prev, node.id, slotInfo.milestoneId, slotInfo.insertAt);
          stepsRef.current = next;
          return next;
        });
      } else {
        setAiList((prev) => {
          const next = placeInColumn(prev, node.id, slotInfo.milestoneId, slotInfo.insertAt);
          aiRef.current = next;
          return next;
        });
      }
    }
    if (shouldPersist) persist(slotInfo.kind === "prep-step" ? "steps" : "aiIdeas");
  }, [persist]);

  const defaultEdgeOptions = useMemo(
    () => ({
      type: "sketch" as const,
      interactionWidth: 36,
      style: { stroke: "#151f28", strokeWidth: 2 },
    }),
    []
  );

  return (
    <EditorContext.Provider value={ctx}>
      <div ref={flowWrapRef} className="prep-flow relative h-full w-full bg-[#f3f1eb]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={(chs) => {
            if (chs.some((c) => c.type === "remove" || c.type === "add")) {
              pushHistory("connections");
            }
            onEdgesChange(chs);
            const removed = chs.filter((c) => c.type === "remove");
            if (removed.length) {
              const ids = new Set(removed.map((c) => c.id));
              edgesRef.current = edgesRef.current.filter((e) => !ids.has(e.id));
            }
            if (removed.length || chs.some((c) => c.type === "add")) {
              persist("connections");
            }
          }}
          onEdgesDelete={(deleted) => {
            if (!deleted.length) return;
            pushHistory("connections");
            const ids = new Set(deleted.map((e) => e.id));
            edgesRef.current = edgesRef.current.filter((e) => !ids.has(e.id));
            persist("connections");
          }}
          onConnect={onConnect}
          onEdgeDoubleClick={(_, edge) => deleteConnection(edge.id)}
          edgeTypes={edgeTypes}
          onConnectStart={() => {
            flowWrapRef.current?.classList.add("is-connecting");
          }}
          onConnectEnd={() => {
            flowWrapRef.current?.classList.remove("is-connecting");
          }}
          onNodeClick={(_, node) => {
            if (node.type === "add-step") {
              addStep((node.data as AddData).milestoneId);
            }
            if (node.type === "add-ai") {
              addAi((node.data as AddData).milestoneId);
            }
            if (node.type === "add-milestone") {
              addMilestone();
            }
            if (node.type === "reveal-ai") {
              toggleAiColumn((node.data as RevealData).milestoneId);
            }
          }}
          onPaneClick={(e) => {
            if (e.detail !== 2) return;
            const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
            addStickyAt({ x: pos.x - STICKY_W / 2, y: pos.y - 24 });
          }}
          onBeforeDelete={async ({ nodes: going, edges: goingEdges }) => ({
            nodes: going.filter(
              (n) => n.type === "prep-step" || n.type === "ai-idea" || n.type === "sticky"
            ),
            edges: goingEdges,
          })}
          onNodesDelete={(deleted) => {
            for (const n of deleted) {
              if (n.type === "prep-step") deleteStep(n.id);
              if (n.type === "ai-idea") deleteAi(n.id);
              if (n.type === "sticky") deleteSticky(n.id);
            }
          }}
          onNodeDragStart={(_, node) => {
            if (
              node.type === "prep-step" ||
              node.type === "ai-idea" ||
              node.type === "milestone" ||
              node.type === "sticky"
            ) {
              pushHistory();
              dragging.current = true;
              flowWrapRef.current?.classList.add("is-dragging");
              dragId.current = node.id;
              lastSlot.current = "";
            }
          }}
          onNodeDrag={(_, node) => {
            if (
              node.type === "prep-step" ||
              node.type === "ai-idea" ||
              node.type === "milestone"
            ) {
              previewDrag(node, false);
            }
          }}
          onNodeDragStop={(_, node) => {
            if (node.type === "sticky") {
              setStickyList((prev) => {
                const next = prev.map((s) =>
                  s.id === node.id ? { ...s, x: node.position.x, y: node.position.y } : s
                );
                stickiesRef.current = next;
                return next;
              });
              persist("stickies");
            } else if (
              node.type === "prep-step" ||
              node.type === "ai-idea" ||
              node.type === "milestone"
            ) {
              previewDrag(node, true);
            }
            dragging.current = false;
            flowWrapRef.current?.classList.remove("is-dragging");
            dragId.current = null;
            lastSlot.current = "";
            applyLayout();
          }}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          elevateEdgesOnSelect
          connectionLineStyle={{ stroke: "#1125ff", strokeWidth: 2 }}
          deleteKeyCode={["Backspace", "Delete"]}
          minZoom={0.28}
          maxZoom={1.35}
          panOnScroll
          panOnScrollMode={PanOnScrollMode.Free}
          panOnScrollSpeed={1}
          zoomOnScroll={false}
          zoomOnPinch
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={20} color="#d9d5cd" />
          <SketchMiniMap />
        </ReactFlow>

        <div className="pointer-events-none absolute left-3 top-3 z-20 flex max-w-[min(360px,calc(100%-1.5rem))] flex-col gap-2">
          {sketchHelp ? (
            <div className="pointer-events-auto rounded-2xl bg-white px-4 py-3.5 text-[#151f28] shadow-lg ring-1 ring-black/8">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#151f28]/40">
                {sketchHelp.title}
              </p>
              <ul className="mt-2 space-y-1.5 text-[12px] leading-relaxed text-[#151f28]/75">
                {sketchHelp.body.map((line) => (
                  <li key={line} className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#151f28]/35" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              {sketchHelp.expect?.length ? (
                <>
                  <p className="mt-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#151f28]/40">
                    Vul per stap in
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-[#151f28]/65">
                    {sketchHelp.expect.join(" · ")}
                  </p>
                </>
              ) : null}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <div className="rounded-full bg-[#151f28] px-3 py-1.5 text-[11px] text-white shadow-lg">
              <span className="font-medium">{sketchLabel}</span>
              <span
                ref={statusRef}
                className="font-mono text-[10px] uppercase tracking-wider text-[#ceff00] empty:hidden before:mx-2 before:text-white/25 before:content-['|']"
              />
            </div>
            <button
              type="button"
              onClick={fitToScreen}
              className="pointer-events-auto rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-[#151f28] shadow-lg ring-1 ring-black/10"
            >
              Alles tonen
            </button>
            <button
              type="button"
              onClick={addStickyInView}
              className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-[#151f28] shadow-lg ring-1 ring-black/10"
            >
              <StickyNote className="h-3.5 w-3.5" /> Sticky
            </button>
            <button
              type="button"
              onClick={() => setStepsCollapsed(true)}
              className="pointer-events-auto rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-[#151f28] shadow-lg ring-1 ring-black/10"
            >
              Inklappen
            </button>
            <button
              type="button"
              onClick={() => setStepsCollapsed(false)}
              className="pointer-events-auto rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-[#151f28] shadow-lg ring-1 ring-black/10"
            >
              Uitklappen
            </button>
            <div className="pointer-events-auto inline-flex items-center rounded-full bg-white p-0.5 text-[11px] font-semibold shadow-lg ring-1 ring-black/10">
              <button
                type="button"
                onClick={() => setDurationUnit("minutes")}
                className={`rounded-full px-2.5 py-1 transition ${
                  durationUnit === "minutes"
                    ? "bg-[#151f28] text-white"
                    : "text-[#151f28]/55 hover:text-[#151f28]"
                }`}
              >
                Min
              </button>
              <button
                type="button"
                onClick={() => setDurationUnit("hours")}
                className={`rounded-full px-2.5 py-1 transition ${
                  durationUnit === "hours"
                    ? "bg-[#151f28] text-white"
                    : "text-[#151f28]/55 hover:text-[#151f28]"
                }`}
              >
                Uur
              </button>
            </div>
            {!hideAiToggle ? (
              <button
                type="button"
                onClick={() => {
                  pushHistory("show-ai");
                  const next = !showAiRef.current;
                  showAiRef.current = next;
                  setShowAiKansen(next);
                  persist("showAiKansen");
                }}
                className={`pointer-events-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold shadow-lg ring-1 ${
                  showAiKansen
                    ? "bg-[#ceff00] text-[#151f28] ring-black/10"
                    : "bg-white text-[#151f28]/70 ring-black/10"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                {showAiKansen ? "Alle AI-kansen" : "Toon AI-kansen"}
              </button>
            ) : null}
          </div>
        </div>

        <div ref={tipsRef} className="pointer-events-none absolute bottom-3 left-3 z-20 flex items-end gap-2">
          <div className="pointer-events-auto flex flex-col overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-black/10">
            <button
              type="button"
              aria-label="Ongedaan maken"
              title="Ongedaan maken (⌘Z)"
              disabled={!canUndo}
              onClick={undoSketch}
              className="flex h-9 w-9 items-center justify-center text-[#151f28] transition-colors hover:bg-black/[0.05] focus-visible:bg-black/[0.05] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-30"
            >
              <Undo2 className="h-4 w-4" strokeWidth={2.25} />
            </button>
            <button
              type="button"
              aria-label="Opnieuw"
              title="Opnieuw (⌘⇧Z)"
              disabled={!canRedo}
              onClick={redoSketch}
              className="flex h-9 w-9 items-center justify-center text-[#151f28] transition-colors hover:bg-black/[0.05] focus-visible:bg-black/[0.05] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-30"
            >
              <Redo2 className="h-4 w-4" strokeWidth={2.25} />
            </button>
            <div className="mx-2 h-px bg-black/10" />
            <button
              type="button"
              aria-label="Inzoomen"
              onClick={() => zoomIn({ duration: 160 })}
              className="flex h-9 w-9 items-center justify-center text-[#151f28] transition-colors hover:bg-black/[0.05] focus-visible:bg-black/[0.05] focus-visible:outline-none"
            >
              <Plus className="h-4 w-4" strokeWidth={2.25} />
            </button>
            <button
              type="button"
              aria-label="Uitzoomen"
              onClick={() => zoomOut({ duration: 160 })}
              className="flex h-9 w-9 items-center justify-center text-[#151f28] transition-colors hover:bg-black/[0.05] focus-visible:bg-black/[0.05] focus-visible:outline-none"
            >
              <Minus className="h-4 w-4" strokeWidth={2.25} />
            </button>
            <div className="mx-2 h-px bg-black/10" />
            <button
              type="button"
              aria-label="Passend in beeld"
              onClick={fitToScreen}
              className="flex h-9 w-9 items-center justify-center text-[#151f28] transition-colors hover:bg-black/[0.05] focus-visible:bg-black/[0.05] focus-visible:outline-none"
            >
              <Scan className="h-4 w-4" strokeWidth={2.25} />
            </button>
            <div className="mx-2 h-px bg-black/10" />
            <button
              type="button"
              aria-label="Tips"
              aria-expanded={showSketchTips}
              aria-controls="sketch-tips"
              title="Tips"
              onClick={() => setShowSketchTips((open) => !open)}
              className={`flex h-9 w-9 items-center justify-center transition-colors hover:bg-black/[0.05] focus-visible:bg-black/[0.05] focus-visible:outline-none ${
                showSketchTips ? "bg-black/[0.06] text-[#151f28]" : "text-[#151f28]"
              }`}
            >
              <Info className="h-4 w-4" strokeWidth={2.25} />
            </button>
          </div>
          {showSketchTips ? (
            <div
              id="sketch-tips"
              role="note"
              className="pointer-events-auto w-[228px] rounded-xl bg-white px-3 py-2.5 text-[11px] leading-relaxed text-[#151f28]/75 shadow-lg ring-1 ring-black/10"
            >
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#151f28]/40">
                Tips
              </p>
              <ul className="space-y-1.5">
                <li>Sleep bolletjes om te verbinden</li>
                <li>Dubbelklik op het bord voor een sticky</li>
                <li>⌘Z ongedaan maken · ⌘⇧Z opnieuw</li>
              </ul>
            </div>
          ) : null}
        </div>

        {deletePrompt ? (
          <div
            className="absolute inset-0 z-50 flex items-center justify-center bg-[#151f28]/45 px-4 backdrop-blur-[2px]"
            role="presentation"
            onClick={() => setDeletePrompt(null)}
          >
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="delete-milestone-title"
              aria-describedby="delete-milestone-desc"
              className="w-full max-w-sm rounded-2xl bg-white p-5 text-[#151f28] shadow-2xl ring-1 ring-black/10"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#151f28]/40">
                Verwijderen
              </p>
              <h2 id="delete-milestone-title" className="mt-2 text-lg font-semibold tracking-tight">
                {deletePrompt.title} verwijderen?
              </h2>
              <p id="delete-milestone-desc" className="mt-2 text-[13px] leading-relaxed text-[#151f28]/65">
                {deletePrompt.stepCount > 0
                  ? `${deletePrompt.stepCount} stap${deletePrompt.stepCount === 1 ? "" : "pen"} in dit proces gaan mee weg. Dit kun je daarna nog ongedaan maken met ⌘Z.`
                  : "Dit proces verdwijnt van het bord. Je kunt het daarna nog ongedaan maken met ⌘Z."}
              </p>
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeletePrompt(null)}
                  className="rounded-full bg-[#151f28]/6 px-4 py-2 text-[12px] font-semibold text-[#151f28] hover:bg-[#151f28]/10"
                >
                  Annuleren
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const id = deletePrompt.id;
                    setDeletePrompt(null);
                    deleteMilestone(id);
                  }}
                  className="rounded-full bg-[#151f28] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#151f28]/90"
                >
                  Verwijderen
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </EditorContext.Provider>
  );
}

export default function PrepPhaseEditor(props: Props) {
  return (
    <ReactFlowProvider>
      <FlowCanvas {...props} />
    </ReactFlowProvider>
  );
}
