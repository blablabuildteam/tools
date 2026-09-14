"use client";

import {
  addEdge,
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  MarkerType,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AnimatePresence, motion } from "framer-motion";
import { Building2, Clock, GripVertical, Plus, Sparkles, StickyNote, Trash2, Users, Wrench } from "lucide-react";
import { nanoid } from "nanoid";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  asChipList,
  createDefaultPrepMilestones,
  normalizePrepStep,
  sketchFingerprint,
  STICKY_COLORS,
  type PrepAiIdea,
  type PrepConnection,
  type PrepMilestone,
  type PrepMilestoneId,
  type PrepPhaseSketch,
  type PrepStep,
  type PrepSticky,
  type SketchPatchKey,
} from "@/lib/workshop-types";

const COL_W = 280;
const COL_GAP = 20;
const ORIGIN_X = 36;
const ORIGIN_Y = 28;
const HEADER_H = 168;
const STEP_W = 252;
const STEP_H = 236;
const STEP_GAP = 8;
const ADD_H = 44;
const LANE_PAD = 14;
const AI_H = 158;
const AI_GAP = 10;
const ADD_AI_H = 36;
const REVEAL_H = 52;
const STICKY_W = 176;

const LANE_TONES = [
  "bg-[#ceff00]/12",
  "bg-sky-400/10",
  "bg-violet-400/10",
  "bg-amber-400/10",
  "bg-emerald-400/10",
  "bg-orange-400/10",
  "bg-pink-400/10",
  "bg-cyan-400/10",
  "bg-lime-400/10",
];

type LaneData = { index: number };
type MilestoneData = PrepMilestone & { index: number };
type AddData = { milestoneId: PrepMilestoneId };
type RevealData = { milestoneId: PrepMilestoneId; open: boolean; count: number };
type ChipKind = "person" | "party" | "tool";

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
  patchSticky: (id: string, partial: Partial<PrepSticky>) => void;
  deleteSticky: (id: string) => void;
  hoursByMilestone: Record<PrepMilestoneId, number>;
  aiCountByMilestone: Record<PrepMilestoneId, number>;
  peopleByMilestone: Record<PrepMilestoneId, string[]>;
  partiesByMilestone: Record<PrepMilestoneId, string[]>;
  toolsByMilestone: Record<PrepMilestoneId, string[]>;
  showAiKansen: boolean;
  revealedAiMilestoneIds: string[];
  toggleAiColumn: (milestoneId: PrepMilestoneId) => void;
};

const EditorContext = createContext<EditorCtx | null>(null);

function useEditor() {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error("PrepPhaseEditor context missing");
  return ctx;
}

function parseHours(raw: string): number {
  const n = Number(String(raw).trim().replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function formatHours(n: number): string {
  if (n <= 0) return "0 uur";
  const label = Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10).replace(".", ",");
  return `${label} uur`;
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
      columnNodes.push({
        id: step.id,
        type: "prep-step",
        position: { x, y },
        data: step,
        dragHandle: ".step-drag",
        style: { zIndex: 2, width: STEP_W },
      });
      y += measured(heights, step.id, STEP_H) + STEP_GAP;
    });
    columnNodes.push({
      id: `add-${m.id}`,
      type: "add-step",
      position: { x, y },
      data: { milestoneId: m.id },
      draggable: false,
      selectable: true,
      connectable: false,
      className: "nopan",
      style: { zIndex: 4, width: STEP_W, height: ADD_H },
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
      className: "nopan",
      style: { zIndex: 4, width: STEP_W, height: REVEAL_H },
    });
    y += REVEAL_H + (aiOpen ? 8 : LANE_PAD);
    if (aiOpen) {
      ideas.forEach((idea) => {
        columnNodes.push({
          id: idea.id,
          type: "ai-idea",
          position: { x, y },
          data: idea,
          dragHandle: ".ai-drag",
          style: { zIndex: 3, width: STEP_W },
        });
        y += measured(heights, idea.id, AI_H) + AI_GAP;
      });
      columnNodes.push({
        id: `add-ai-${m.id}`,
        type: "add-ai",
        position: { x, y },
        data: { milestoneId: m.id },
        draggable: false,
        selectable: true,
        connectable: false,
        className: "nopan",
        style: { zIndex: 4, width: STEP_W, height: ADD_AI_H },
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
      style: { width: COL_W, height, zIndex: 0, pointerEvents: "none" },
    });
    nodes.push({
      id: `ms-${m.id}`,
      type: "milestone",
      position: { x: colX(i) + 10, y: ORIGIN_Y + 10 },
      data: { ...m, index: i },
      dragHandle: ".ms-drag",
      connectable: false,
      style: { zIndex: 5, width: 260 },
    });
    nodes.push(...columnNodes);
  });
  nodes.push({
    id: "add-milestone",
    type: "add-milestone",
    position: { x: colX(cols.length), y: ORIGIN_Y + 10 },
    data: {},
    draggable: false,
    selectable: true,
    connectable: false,
    className: "nopan",
    style: { zIndex: 5, width: COL_W },
  });
  for (const sticky of stickies) {
    nodes.push({
      id: sticky.id,
      type: "sticky",
      position: { x: sticky.x, y: sticky.y },
      data: sticky,
      connectable: false,
      style: { zIndex: 8, width: STICKY_W },
    });
  }
  return nodes;
}

function LaneNode({ data }: NodeProps<Node<LaneData>>) {
  return (
    <div
      className={`pointer-events-none h-full w-full rounded-2xl ring-1 ring-black/8 ${LANE_TONES[data.index % LANE_TONES.length] ?? "bg-white/40"}`}
    />
  );
}

const PERSON_PALETTE = [
  { bg: "#CEFF00", text: "#151f28" },
  { bg: "#7DD3FC", text: "#0c4a6e" },
  { bg: "#F9A8D4", text: "#831843" },
  { bg: "#FCD34D", text: "#78350f" },
  { bg: "#C4B5FD", text: "#4c1d95" },
  { bg: "#FDBA74", text: "#9a3412" },
  { bg: "#86EFAC", text: "#14532d" },
  { bg: "#FDA4AF", text: "#9f1239" },
];

const TOOL_PALETTE = [
  { bg: "#1125ff", text: "#ffffff" },
  { bg: "#151f28", text: "#ceff00" },
  { bg: "#0ea5e9", text: "#ffffff" },
  { bg: "#059669", text: "#ffffff" },
  { bg: "#7c3aed", text: "#ffffff" },
  { bg: "#db2777", text: "#ffffff" },
  { bg: "#ea580c", text: "#ffffff" },
  { bg: "#4338ca", text: "#ffffff" },
];

const PARTY_PALETTE = [
  { bg: "#ea580c", text: "#ffffff" },
  { bg: "#f97316", text: "#ffffff" },
  { bg: "#c2410c", text: "#ffffff" },
  { bg: "#fb923c", text: "#7c2d12" },
  { bg: "#b45309", text: "#ffffff" },
  { bg: "#fdba74", text: "#7c2d12" },
  { bg: "#9a3412", text: "#fff7ed" },
  { bg: "#d97706", text: "#ffffff" },
];

function chipColor(label: string, kind: ChipKind) {
  const palette = kind === "person" ? PERSON_PALETTE : kind === "party" ? PARTY_PALETTE : TOOL_PALETTE;
  const key = label.trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 33 + key.charCodeAt(i)) >>> 0;
  return palette[hash % palette.length];
}

function columnContentY(heights: Record<string, number>, milestoneId: PrepMilestoneId) {
  const cardH = measured(heights, `ms-${milestoneId}`, HEADER_H - 18);
  return ORIGIN_Y + 10 + cardH + 8;
}

function MilestoneNode({ id, data, selected }: NodeProps<Node<MilestoneData>>) {
  const {
    hoursByMilestone,
    aiCountByMilestone,
    peopleByMilestone,
    partiesByMilestone,
    toolsByMilestone,
    patchMilestone,
    showAiKansen,
    revealedAiMilestoneIds,
  } = useEditor();
  const boxRef = useReportHeight(id);
  const hours = hoursByMilestone[data.id] ?? 0;
  const aiCount = aiCountByMilestone[data.id] ?? 0;
  const people = peopleByMilestone[data.id] ?? [];
  const parties = partiesByMilestone[data.id] ?? [];
  const tools = toolsByMilestone[data.id] ?? [];
  const n = data.index + 1;
  const aiOpen = isAiOpen(data.id, showAiKansen, revealedAiMilestoneIds);

  return (
    <div
      ref={boxRef}
      className={`prep-pop-in w-[260px] rounded-xl bg-[#151f28] px-3 py-3 text-white shadow-sm transition-shadow duration-200 ${
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
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#ceff00]">
            {String(n).padStart(2, "0")} · voorbereiding
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {aiOpen && aiCount > 0 && (
            <p className="rounded-full bg-[#ceff00]/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#ceff00]">
              {aiCount} AI
            </p>
          )}
          <p className="rounded-full bg-[#ceff00] px-2 py-0.5 font-mono text-[10px] font-semibold text-[#151f28]">
            {formatHours(hours)}
          </p>
        </div>
      </div>
      <input
        value={data.short}
        onChange={(e) => patchMilestone(data.id, { short: e.target.value })}
        placeholder="Naam milestone"
        className="nodrag nowheel mt-1.5 w-full bg-transparent text-[14px] font-semibold leading-tight tracking-tight text-white outline-none placeholder:text-white/30"
      />
      <textarea
        value={data.title}
        onChange={(e) => patchMilestone(data.id, { title: e.target.value })}
        placeholder="Beschrijving"
        rows={2}
        className="nodrag nowheel mt-1 w-full resize-none bg-transparent text-[11px] leading-snug text-white/55 outline-none placeholder:text-white/30"
      />
      {(people.length > 0 || parties.length > 0 || tools.length > 0) && (
        <div className="mt-2 space-y-1.5 border-t border-white/10 pt-2">
          <RollupChips icon={Users} values={people} kind="person" />
          <RollupChips icon={Building2} values={parties} kind="party" />
          <RollupChips icon={Wrench} values={tools} kind="tool" />
        </div>
      )}
    </div>
  );
}

function RollupChips({
  icon: Icon,
  values,
  kind,
}: {
  icon: typeof Users;
  values: string[];
  kind: ChipKind;
}) {
  if (!values.length) return null;
  return (
    <div className="flex min-w-0 items-start gap-1.5">
      <Icon className="mt-0.5 h-3 w-3 shrink-0 text-white/40" />
      <div className="flex min-w-0 flex-wrap gap-1">
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
                className="inline-flex max-w-full truncate rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-tight"
                style={{ backgroundColor: tone.bg, color: tone.text }}
              >
                {value}
              </motion.span>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

function AddMilestoneNode() {
  return (
    <div className="nodrag nopan flex h-[118px] w-[260px] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[#151f28]/25 bg-white/80 px-3 text-center text-[#151f28]/65 transition-colors duration-200 hover:border-[#151f28]/45 hover:bg-white">
      <Plus className="h-5 w-5" />
      <span className="text-[12px] font-semibold">Milestone toevoegen</span>
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
  const [draft, setDraft] = useState("");

  function commit(raw: string) {
    const nextLabel = raw.trim();
    if (!nextLabel) return;
    const exists = values.some((v) => v.toLowerCase() === nextLabel.toLowerCase());
    setDraft("");
    if (exists) return;
    onChange([...values, nextLabel]);
  }

  return (
    <div className="flex min-w-0 items-start gap-1.5">
      <Icon className="mt-1 h-3 w-3 shrink-0 text-[#151f28]/35" />
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
              className="inline-flex max-w-full origin-left items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-tight"
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
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              e.stopPropagation();
              commit(draft);
            } else if (e.key === "Backspace" && !draft && values.length) {
              e.preventDefault();
              onChange(values.slice(0, -1));
            }
          }}
          onBlur={() => commit(draft)}
          placeholder={values.length ? "Enter…" : placeholder}
          className="nodrag nowheel min-w-[5rem] flex-1 bg-transparent text-[11px] text-[#151f28]/85 outline-none placeholder:text-[#151f28]/30"
        />
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
  const { patchStep, deleteStep } = useEditor();
  const boxRef = useReportHeight(id);
  const hasParty = asChipList(data.parties).length > 0;
  const { leaving, exit } = useExitThen(() => deleteStep(id));

  return (
    <div ref={boxRef} className="prep-pop-in w-[252px]">
    <div
      className={`prep-card rounded-xl border-2 bg-white px-3 py-2.5 shadow-sm ${
        leaving ? "is-leaving" : ""
      } ${
        hasParty
          ? selected
            ? "border-orange-500 ring-2 ring-orange-400/40"
            : "border-orange-400"
          : selected
            ? "border-[#1125ff]/50 ring-2 ring-[#1125ff]/20"
            : "border-black/10"
      }`}
    >
      <Handle type="target" position={Position.Left} id="l" className={handleClass("target")} />
      <Handle type="target" position={Position.Top} id="t" className={handleClass("target")} />
      <Handle type="source" position={Position.Right} id="r" className={handleClass("source")} />
      <Handle type="source" position={Position.Bottom} id="b" className={handleClass("source")} />

      <div className="flex items-start gap-1">
        <button
          type="button"
          className="step-drag mt-0.5 cursor-grab rounded p-0.5 text-[#151f28]/30 hover:text-[#151f28]/70"
          aria-label="Sleep stap"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <input
          value={data.title}
          onChange={(e) => patchStep(id, { title: e.target.value })}
          placeholder="Titel van de stap"
          className="nodrag min-w-0 flex-1 bg-transparent text-[13px] font-semibold text-[#151f28] outline-none placeholder:text-[#151f28]/30"
        />
        <button
          type="button"
          onClick={exit}
          className="nodrag rounded p-0.5 text-[#151f28]/25 hover:text-red-500"
          aria-label="Stap verwijderen"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <textarea
        value={data.description}
        onChange={(e) => patchStep(id, { description: e.target.value })}
        placeholder="Beschrijving — wat gebeurt hier?"
        rows={3}
        className="nodrag nowheel mt-1.5 w-full resize-none bg-transparent text-[11px] leading-snug text-[#151f28]/75 outline-none placeholder:text-[#151f28]/30"
      />

      <div className="mt-2 space-y-1 border-t border-black/6 pt-2">
        <label className="flex min-w-0 items-center gap-1.5">
          <Clock className="h-3 w-3 shrink-0 text-[#151f28]/35" />
          <span className="sr-only">Duur in uren</span>
          <input
            type="number"
            min={0}
            step={0.5}
            inputMode="decimal"
            value={data.duration}
            onChange={(e) => patchStep(id, { duration: e.target.value })}
            placeholder="0"
            className="nodrag nowheel w-14 bg-transparent text-[11px] text-[#151f28]/85 outline-none placeholder:text-[#151f28]/30"
          />
          <span className="text-[11px] text-[#151f28]/45">uur</span>
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
          placeholder="Tools · Enter voor chip"
          values={asChipList(data.tools)}
          kind="tool"
          onChange={(tools) => patchStep(id, { tools })}
        />
      </div>
    </div>
    </div>
  );
}

function AddStepNode(_props: NodeProps<Node<AddData>>) {
  return (
    <div className="nodrag nopan nowheel flex h-[44px] w-[252px] items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-[#151f28]/20 bg-white text-[12px] font-semibold text-[#151f28]/70 transition-colors duration-200 hover:border-[#151f28]/40 hover:bg-[#151f28]/[0.03]">
      <Plus className="h-3.5 w-3.5" /> Stap toevoegen
    </div>
  );
}

function RevealAiNode({ data }: NodeProps<Node<RevealData>>) {
  return (
    <div className="nodrag nopan nowheel flex h-[52px] w-[252px] flex-col justify-end">
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
        className="nodrag nowheel mt-1.5 w-full resize-none bg-transparent text-[11px] leading-snug text-[#151f28]/80 outline-none placeholder:text-[#151f28]/35"
      />
      <input
        value={data.sources}
        onChange={(e) => patchAi(id, { sources: e.target.value })}
        placeholder="Bronnen · bijv. Company.info"
        className="nodrag nowheel mt-1 w-full bg-transparent font-mono text-[10px] text-[#151f28]/55 outline-none placeholder:text-[#151f28]/30"
      />
    </div>
    </div>
  );
}

function AddAiNode(_props: NodeProps<Node<AddData>>) {
  return (
    <div className="nodrag nopan nowheel flex h-[36px] w-[252px] items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-[#151f28]/25 bg-[#ceff00]/35 text-[11px] font-semibold text-[#151f28]/75 transition-colors duration-200 hover:border-[#151f28]/40 hover:bg-[#ceff00]/50">
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
  const tilt = stickyTilt(id);

  return (
    <div className="prep-pop-in w-[176px]">
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
            className="nodrag nowheel min-h-[88px] w-full resize-none bg-transparent text-[12px] leading-snug text-[#151f28]/90 outline-none placeholder:text-[#151f28]/35"
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

const nodeTypes = {
  lane: LaneNode,
  milestone: MilestoneNode,
  "add-milestone": AddMilestoneNode,
  "prep-step": StepNode,
  "add-step": AddStepNode,
  "reveal-ai": RevealAiNode,
  "ai-idea": AiIdeaNode,
  "add-ai": AddAiNode,
  sticky: StickyNode,
};

function toRfEdges(connections: PrepConnection[], steps: PrepStep[]): Edge[] {
  return connections.map((c) => {
    const from = steps.find((s) => s.id === c.source);
    const to = steps.find((s) => s.id === c.target);
    const cross = Boolean(from && to && from.milestoneId !== to.milestoneId);
    return {
      id: c.id,
      source: c.source,
      target: c.target,
      sourceHandle: c.sourceHandle ?? undefined,
      targetHandle: c.targetHandle ?? undefined,
      animated: cross,
      style: {
        stroke: cross ? "#1125ff" : "#151f28",
        strokeWidth: 2,
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

function stepsBlockHeight(
  heights: Record<string, number>,
  steps: { id: string }[]
) {
  let h = 0;
  for (const step of steps) h += measured(heights, step.id, STEP_H) + STEP_GAP;
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
    const centerY = node.position.y + measured(heights, node.id, STEP_H) / 2;
    return {
      kind: "prep-step",
      milestoneId,
      insertAt: insertIndexFromY(siblings, centerY, startY, heights, STEP_H, STEP_GAP),
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
};

function FlowCanvas({ initial, remote, onSave }: Props) {
  const { fitView, screenToFlowPosition } = useReactFlow();
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
  const edgesRef = useRef(edges);
  const heightsRef = useRef<Record<string, number>>({});
  const pendingStickyFocus = useRef<string | null>(null);
  const firstSketchActive = useRef(true);
  const [heightRev, setHeightRev] = useState(0);
  stepsRef.current = stepList;
  aiRef.current = aiList;
  milestonesRef.current = milestones;
  stickiesRef.current = stickyList;
  showAiRef.current = showAiKansen;
  revealedAiRef.current = revealedAiIds;
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
    stepList.map((s) => `${s.id}:${s.milestoneId}:${s.order}`).join("|"),
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
    if (!dragging.current || !id) {
      setNodes(laidOut);
      return;
    }
    setNodes((prev) => {
      const current = prev.find((n) => n.id === id);
      return laidOut.map((n) => (n.id === id && current ? { ...n, position: current.position } : n));
    });
  }, [setNodes]);

  const applyDoc = useCallback(
    (doc: PrepPhaseSketch) => {
      const skip = dirtyKeys.current;
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
      const connections = skip.has("connections") ? fromRfEdges(edgesRef.current) : doc.connections;

      stepsRef.current = steps;
      aiRef.current = ai;
      milestonesRef.current = miles;
      stickiesRef.current = stickies;
      showAiRef.current = showAi;
      revealedAiRef.current = revealed;

      setStepList(steps);
      setAiList(ai);
      setMilestones(miles);
      setStickyList(stickies);
      setShowAiKansen(showAi);
      setRevealedAiIds(revealed);

      const styled = toRfEdges(connections, steps);
      edgesRef.current = styled;
      setEdges(styled);
      applyLayout();
    },
    [applyLayout, setEdges]
  );

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
    };
    if (sketchFingerprint(remote) === sketchFingerprint(local)) return;
    applyDoc(remote);
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
      const styled = toRfEdges(fromRfEdges(eds), stepsRef.current);
      edgesRef.current = styled;
      return styled;
    });
  }, [setEdges, structureKey]);

  useEffect(() => {
    ready.current = true;
    const t = window.setTimeout(() => {
      fitView({ padding: 0.08, duration: 240 });
      if (statusRef.current) statusRef.current.textContent = "Sleep bolletjes om te verbinden";
    }, 120);
    return () => window.clearTimeout(t);
  }, [fitView]);

  const patchStep = useCallback(
    (id: string, partial: Partial<PrepStep>) => {
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
    [persist, setNodes]
  );

  const patchAi = useCallback(
    (id: string, partial: Partial<PrepAiIdea>) => {
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
    [persist, setNodes]
  );

  const deleteStep = useCallback(
    (id: string) => {
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
    [persist, setEdges]
  );

  const deleteAi = useCallback(
    (id: string) => {
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
    [persist]
  );

  const addStep = useCallback(
    (milestoneId: PrepMilestoneId) => {
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
            order,
          },
        ];
        stepsRef.current = next;
        return next;
      });
      persist("steps");
    },
    [persist]
  );

  const addAi = useCallback(
    (milestoneId: PrepMilestoneId) => {
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
    [persist]
  );

  const patchMilestone = useCallback(
    (id: string, partial: Partial<PrepMilestone>) => {
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
    [persist, setNodes]
  );

  const addMilestone = useCallback(() => {
    setMilestones((prev) => {
      const next = [
        ...prev,
        {
          id: `ms-${nanoid(8)}`,
          short: "Nieuw milestone",
          title: "",
          order: prev.length,
        },
      ];
      milestonesRef.current = next;
      return next;
    });
    persist("milestones");
  }, [persist]);

  const patchSticky = useCallback(
    (id: string, partial: Partial<PrepSticky>) => {
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
    [persist, setNodes]
  );

  const deleteSticky = useCallback(
    (id: string) => {
      setStickyList((prev) => {
        const next = prev.filter((s) => s.id !== id);
        stickiesRef.current = next;
        return next;
      });
      persist("stickies");
    },
    [persist]
  );

  const addStickyAt = useCallback(
    (position: { x: number; y: number }) => {
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
    [persist]
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
      totals[step.milestoneId] = (totals[step.milestoneId] ?? 0) + parseHours(step.duration);
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

  const aiCountByMilestone = useMemo(() => {
    const totals = {} as Record<PrepMilestoneId, number>;
    for (const m of milestones) totals[m.id] = 0;
    for (const idea of aiList) {
      totals[idea.milestoneId] = (totals[idea.milestoneId] ?? 0) + 1;
    }
    return totals;
  }, [aiList, milestones]);

  const toggleAiColumn = useCallback(
    (milestoneId: PrepMilestoneId) => {
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
    [persist]
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
      peopleByMilestone,
      partiesByMilestone,
      toolsByMilestone,
      showAiKansen,
      revealedAiMilestoneIds: revealedAiIds,
      toggleAiColumn,
      reportHeight,
      patchMilestone,
      addMilestone,
      patchSticky,
      deleteSticky,
    }),
    [
      addAi,
      addMilestone,
      addStep,
      aiCountByMilestone,
      deleteAi,
      deleteStep,
      deleteSticky,
      hoursByMilestone,
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
      setEdges((eds) => {
        const dup = eds.some((e) => e.source === connection.source && e.target === connection.target);
        if (dup) return eds;
        const next = addEdge({ ...connection, id: `e-${nanoid(6)}` }, eds);
        const styled = toRfEdges(fromRfEdges(next), stepsRef.current);
        edgesRef.current = styled;
        persist("connections");
        return styled;
      });
    },
    [persist, setEdges]
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
      type: "smoothstep" as const,
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
            onEdgesChange(chs);
            persist("connections");
          }}
          onConnect={onConnect}
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
          connectionLineStyle={{ stroke: "#1125ff", strokeWidth: 2 }}
          deleteKeyCode={["Backspace", "Delete"]}
          minZoom={0.28}
          maxZoom={1.35}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={20} color="#d9d5cd" />
          <Controls showInteractive={false} />
          <MiniMap
            pannable
            zoomable
            className="!rounded-xl !border !border-black/10 !bg-white/90"
            nodeColor={(n) => {
              if (n.type === "prep-step") {
                return asChipList((n.data as PrepStep).parties).length ? "#f97316" : "#1125ff";
              }
              if (n.type === "milestone") return "#151f28";
              if (n.type === "ai-idea") return "#ceff00";
              if (n.type === "sticky") return (n.data as PrepSticky).color || "#FDE047";
              return "#d6d3cd";
            }}
          />
        </ReactFlow>

        <div className="pointer-events-none absolute left-3 top-3 z-20 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-2">
          <div className="rounded-full bg-[#151f28] px-3 py-1.5 text-[11px] text-white shadow-lg">
            <span className="font-medium">Voorbereidingsfase</span>
            <span className="mx-2 text-white/25">|</span>
            <span ref={statusRef} className="font-mono text-[10px] uppercase tracking-wider text-[#ceff00]">
              …
            </span>
          </div>
          <button
            type="button"
            onClick={() => fitView({ padding: 0.08, duration: 220 })}
            className="pointer-events-auto rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-[#151f28] shadow-lg ring-1 ring-black/10"
          >
            Alle 9 tonen
          </button>
          <button
            type="button"
            onClick={addStickyInView}
            className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-[#FDE047] px-3 py-1.5 text-[11px] font-semibold text-[#151f28] shadow-lg ring-1 ring-black/10"
          >
            <StickyNote className="h-3.5 w-3.5" /> Sticky
          </button>
          <button
            type="button"
            onClick={() => {
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
            {showAiKansen ? "Alle AI-kansen" : "Toon alle AI-kansen"}
          </button>
          <p className="self-center rounded-full bg-white/90 px-3 py-1.5 text-[11px] text-[#151f28]/55 ring-1 ring-black/5">
            Dubbelklik op het bord voor een sticky · Delete verwijdert
          </p>
        </div>
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
