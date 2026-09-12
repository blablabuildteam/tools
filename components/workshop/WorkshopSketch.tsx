"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Plus, Trash2 } from "lucide-react";

export type FlowNode = {
  id: string;
  lane: "main" | "inputs" | "side" | "later";
  title: string;
  body: string;
  tone: "yellow" | "blue" | "violet" | "green" | "orange" | "grey";
};

export type ProcessFlowData = {
  type: "process-flow";
  version: 1;
  title: string;
  subtitle: string;
  nodes: FlowNode[];
};

type Props = {
  initial: unknown | null;
  onSave: (data: ProcessFlowData) => void;
};

const TONES: Record<FlowNode["tone"], string> = {
  yellow: "border-amber-300/80 bg-amber-50 text-amber-950",
  blue: "border-sky-300/80 bg-sky-50 text-sky-950",
  violet: "border-violet-300/80 bg-violet-50 text-violet-950",
  green: "border-emerald-300/80 bg-emerald-50 text-emerald-950",
  orange: "border-orange-300/80 bg-orange-50 text-orange-950",
  grey: "border-stone-300/80 bg-stone-50 text-stone-800",
};

export function createSophistaFlow(): ProcessFlowData {
  return {
    type: "process-flow",
    version: 1,
    title: "Sophista — aanname proces (ter validatie)",
    subtitle: "Scope: informatie verzamelen → analyse → eerste gestandaardiseerde rapport",
    nodes: [
      {
        id: "b1",
        lane: "main",
        title: "1. Intake / trigger",
        body: "Nieuwe deal of verkooptraject start",
        tone: "yellow",
      },
      {
        id: "b2",
        lane: "main",
        title: "2. Informatie verzamelen",
        body: "Klant + intern + extern\n(nu: handmatig / traag)",
        tone: "blue",
      },
      {
        id: "b3",
        lane: "main",
        title: "3. Verwerken & analyseren",
        body: "Structureren, checken, aanvullen, interpreteren",
        tone: "violet",
      },
      {
        id: "b4",
        lane: "main",
        title: "4. Eerste standaardrapport",
        body: "Gestandaardiseerde output (fase-1 doel)",
        tone: "green",
      },
      {
        id: "in1",
        lane: "inputs",
        title: "Klantinput",
        body: "Dossier / gesprekken",
        tone: "grey",
      },
      {
        id: "in2",
        lane: "inputs",
        title: "Intern",
        body: "IMs, templates, kennisbank",
        tone: "grey",
      },
      {
        id: "in3",
        lane: "inputs",
        title: "Extern",
        body: "Company.info / Gain.pro / publiek",
        tone: "grey",
      },
      {
        id: "pain",
        lane: "side",
        title: "Hypothese pijn",
        body: "Tijd & inconsistentie in verzamelen + schrijven → te valideren",
        tone: "orange",
      },
      {
        id: "ask",
        lane: "side",
        title: "Workshop-vraag",
        body: "Klopt deze flow?\nWat mist / anders?\nWaar AI eerst helpen?",
        tone: "yellow",
      },
      {
        id: "l1",
        lane: "later",
        title: "Marketing",
        body: "Teaser / shortlist / NDA",
        tone: "grey",
      },
      {
        id: "l2",
        lane: "later",
        title: "Due diligence",
        body: "VDR / Q&A",
        tone: "grey",
      },
      {
        id: "l3",
        lane: "later",
        title: "Signing & closing",
        body: "SPA / notaris",
        tone: "grey",
      },
    ],
  };
}

function parseFlow(raw: unknown): ProcessFlowData {
  if (raw && typeof raw === "object" && (raw as ProcessFlowData).type === "process-flow") {
    const data = raw as ProcessFlowData;
    if (Array.isArray(data.nodes) && data.nodes.length > 0) return data;
  }
  // Old tldraw snapshots (or empty) → use Sophista default flowchart
  return createSophistaFlow();
}

function NodeCard({
  node,
  onChange,
  onRemove,
}: {
  node: FlowNode;
  onChange: (next: FlowNode) => void;
  onRemove: () => void;
}) {
  return (
    <article
      className={`group relative flex min-h-[110px] w-full flex-col rounded-2xl border-2 p-3 shadow-sm ${TONES[node.tone]}`}
    >
      <button
        type="button"
        onClick={onRemove}
        className="absolute right-2 top-2 rounded-md p-1 opacity-0 transition hover:bg-black/5 group-hover:opacity-60"
        aria-label="Verwijder blok"
        title="Verwijder"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
      <input
        value={node.title}
        onChange={(e) => onChange({ ...node, title: e.target.value })}
        className="w-full bg-transparent pr-6 text-sm font-bold outline-none placeholder:opacity-40"
        placeholder="Titel"
      />
      <textarea
        value={node.body}
        onChange={(e) => onChange({ ...node, body: e.target.value })}
        rows={3}
        className="mt-1 w-full flex-1 resize-none bg-transparent text-[12px] leading-relaxed outline-none placeholder:opacity-35"
        placeholder="Notitie / correctie…"
      />
    </article>
  );
}

/**
 * Stable HTML process map — no canvas engine.
 * Editable nodes, autosave, never blanks out.
 */
export default function WorkshopSketch({ initial, onSave }: Props) {
  const [flow, setFlow] = useState<ProcessFlowData>(() => parseFlow(initial));
  const onSaveRef = useRef(onSave);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState("Klaar");

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  const persist = useCallback((next: ProcessFlowData) => {
    if (timer.current) clearTimeout(timer.current);
    setStatus("Opslaan…");
    timer.current = setTimeout(() => {
      onSaveRef.current(next);
      setStatus("Opgeslagen");
    }, 450);
  }, []);

  const update = useCallback(
    (recipe: (prev: ProcessFlowData) => ProcessFlowData) => {
      setFlow((prev) => {
        const next = recipe(prev);
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const main = flow.nodes.filter((n) => n.lane === "main");
  const inputs = flow.nodes.filter((n) => n.lane === "inputs");
  const side = flow.nodes.filter((n) => n.lane === "side");
  const later = flow.nodes.filter((n) => n.lane === "later");

  function patchNode(id: string, next: FlowNode) {
    update((f) => ({ ...f, nodes: f.nodes.map((n) => (n.id === id ? next : n)) }));
  }

  function removeNode(id: string) {
    update((f) => ({ ...f, nodes: f.nodes.filter((n) => n.id !== id) }));
  }

  function addNode(lane: FlowNode["lane"], tone: FlowNode["tone"]) {
    const id = `n-${Date.now().toString(36)}`;
    update((f) => ({
      ...f,
      nodes: [
        ...f.nodes,
        { id, lane, title: "Nieuw blok", body: "", tone },
      ],
    }));
  }

  return (
    <div className="flex h-full flex-col bg-[#f3f1eb] text-[#151f28]">
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-black/8 bg-white/70 px-5 py-4 backdrop-blur">
        <div className="min-w-0 flex-1">
          <input
            value={flow.title}
            onChange={(e) => update((f) => ({ ...f, title: e.target.value }))}
            className="w-full bg-transparent text-lg font-bold tracking-tight outline-none"
          />
          <input
            value={flow.subtitle}
            onChange={(e) => update((f) => ({ ...f, subtitle: e.target.value }))}
            className="mt-1 w-full bg-transparent text-sm text-[#151f28]/55 outline-none"
          />
        </div>
        <p className="shrink-0 rounded-full bg-[#151f28] px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-[#ceff00]">
          {status}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-5 sm:p-8">
        <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.2em] text-[#151f28]/40">
          Hoofdflow · klik tekst om te corrigeren
        </p>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
          {main.map((node, i) => (
            <div key={node.id} className="flex min-w-0 flex-1 items-center gap-3">
              <div className="min-w-0 flex-1">
                <NodeCard
                  node={node}
                  onChange={(n) => patchNode(node.id, n)}
                  onRemove={() => removeNode(node.id)}
                />
              </div>
              {i < main.length - 1 && (
                <ArrowRight className="hidden h-5 w-5 shrink-0 text-[#151f28]/25 lg:block" />
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => addNode("main", "blue")}
            className="inline-flex shrink-0 items-center justify-center gap-1 self-center rounded-xl border border-dashed border-[#151f28]/20 px-3 py-8 text-xs text-[#151f28]/45 hover:border-[#1125ff]/40 hover:text-[#1125ff] lg:py-0 lg:h-[110px]"
          >
            <Plus className="h-3.5 w-3.5" /> Stap
          </button>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.2fr_1fr]">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#151f28]/40">
                Pijn / side notes
              </p>
              <button
                type="button"
                onClick={() => addNode("side", "orange")}
                className="text-[11px] text-[#151f28]/40 hover:text-[#151f28]"
              >
                + blok
              </button>
            </div>
            <div className="space-y-3">
              {side.map((node) => (
                <NodeCard
                  key={node.id}
                  node={node}
                  onChange={(n) => patchNode(node.id, n)}
                  onRemove={() => removeNode(node.id)}
                />
              ))}
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#151f28]/40">
                Wat komt er typisch binnen?
              </p>
              <button
                type="button"
                onClick={() => addNode("inputs", "grey")}
                className="text-[11px] text-[#151f28]/40 hover:text-[#151f28]"
              >
                + bron
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {inputs.map((node) => (
                <NodeCard
                  key={node.id}
                  node={node}
                  onChange={(n) => patchNode(node.id, n)}
                  onRemove={() => removeNode(node.id)}
                />
              ))}
            </div>
          </section>

          <section>
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.2em] text-[#151f28]/40">
              Tip
            </p>
            <div className="rounded-2xl border border-[#1125ff]/20 bg-[#1125ff]/5 p-4 text-[13px] leading-relaxed text-[#151f28]/70">
              Teken niet opnieuw — <strong className="font-semibold text-[#151f28]">pas de tekst aan</strong> als
              Sophista iets anders beschrijft. Voeg stappen toe waar de flow afwijkt.
            </div>
          </section>
        </div>

        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#151f28]/40">
              Later in het verkoopproces (niet bouwen vandaag)
            </p>
            <button
              type="button"
              onClick={() => addNode("later", "grey")}
              className="text-[11px] text-[#151f28]/40 hover:text-[#151f28]"
            >
              + fase
            </button>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {later.map((node, i) => (
              <div key={node.id} className="flex min-w-0 flex-1 items-center gap-3">
                <div className="min-w-0 flex-1">
                  <NodeCard
                    node={node}
                    onChange={(n) => patchNode(node.id, n)}
                    onRemove={() => removeNode(node.id)}
                  />
                </div>
                {i < later.length - 1 && (
                  <ArrowRight className="hidden h-4 w-4 shrink-0 text-[#151f28]/20 sm:block" />
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
