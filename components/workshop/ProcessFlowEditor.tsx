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
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { Plus } from "lucide-react";

export type StepData = {
  title: string;
  body: string;
  tone: "yellow" | "blue" | "violet" | "green" | "orange" | "grey";
};

export type FlowSketch = {
  nodes: Node<StepData>[];
  edges: Edge[];
};

const TONE_CLASS: Record<StepData["tone"], string> = {
  yellow: "border-amber-400 bg-amber-50",
  blue: "border-sky-400 bg-sky-50",
  violet: "border-violet-400 bg-violet-50",
  green: "border-emerald-400 bg-emerald-50",
  orange: "border-orange-400 bg-orange-50",
  grey: "border-stone-300 bg-stone-50",
};

function StepNode({ id, data, selected }: NodeProps<Node<StepData>>) {
  const { updateNodeData } = useReactFlow();

  return (
    <div
      className={`min-w-[180px] max-w-[240px] rounded-xl border-2 px-3 py-2 shadow-sm ${TONE_CLASS[data.tone]} ${
        selected ? "ring-2 ring-[#1125ff]/40" : ""
      }`}
    >
      <Handle type="target" position={Position.Left} className="!h-2.5 !w-2.5 !border-2 !border-white !bg-[#151f28]" />
      <Handle
        type="target"
        position={Position.Top}
        id="t"
        className="!h-2.5 !w-2.5 !border-2 !border-white !bg-[#151f28]"
      />
      <input
        className="nodrag w-full bg-transparent text-sm font-bold text-[#151f28] outline-none"
        value={data.title}
        onChange={(e) => updateNodeData(id, { title: e.target.value })}
        placeholder="Stap"
      />
      <textarea
        className="nodrag nowheel mt-1 w-full resize-none bg-transparent text-[11px] leading-snug text-[#151f28]/75 outline-none"
        rows={3}
        value={data.body}
        onChange={(e) => updateNodeData(id, { body: e.target.value })}
        placeholder="Toelichting…"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2.5 !w-2.5 !border-2 !border-white !bg-[#1125ff]"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="b"
        className="!h-2.5 !w-2.5 !border-2 !border-white !bg-[#1125ff]"
      />
    </div>
  );
}

const nodeTypes = { step: StepNode };

export function createDefaultSophistaFlow(): FlowSketch {
  return {
    nodes: [
      {
        id: "b1",
        type: "step",
        position: { x: 40, y: 80 },
        data: {
          title: "1. Intake / trigger",
          body: "Nieuwe deal of verkooptraject start",
          tone: "yellow",
        },
      },
      {
        id: "b2",
        type: "step",
        position: { x: 300, y: 80 },
        data: {
          title: "2. Informatie verzamelen",
          body: "Klant + intern + extern (nu: handmatig / traag)",
          tone: "blue",
        },
      },
      {
        id: "b3",
        type: "step",
        position: { x: 580, y: 80 },
        data: {
          title: "3. Verwerken & analyseren",
          body: "Structureren, checken, aanvullen, interpreteren",
          tone: "violet",
        },
      },
      {
        id: "b4",
        type: "step",
        position: { x: 860, y: 80 },
        data: {
          title: "4. Eerste standaardrapport",
          body: "Gestandaardiseerde output (fase-1 doel)",
          tone: "green",
        },
      },
      {
        id: "pain",
        type: "step",
        position: { x: 40, y: 280 },
        data: {
          title: "Hypothese pijn",
          body: "Tijd & inconsistentie in verzamelen + schrijven → valideren",
          tone: "orange",
        },
      },
      {
        id: "in1",
        type: "step",
        position: { x: 300, y: 280 },
        data: { title: "Klantinput", body: "Dossier / gesprekken", tone: "grey" },
      },
      {
        id: "in2",
        type: "step",
        position: { x: 520, y: 280 },
        data: { title: "Intern", body: "IMs, templates, kennisbank", tone: "grey" },
      },
      {
        id: "in3",
        type: "step",
        position: { x: 740, y: 280 },
        data: { title: "Extern", body: "Company.info / Gain.pro / publiek", tone: "grey" },
      },
      {
        id: "ask",
        type: "step",
        position: { x: 980, y: 280 },
        data: {
          title: "Workshop-vraag",
          body: "Klopt deze flow? Wat mist? Waar AI eerst?",
          tone: "yellow",
        },
      },
      {
        id: "l1",
        type: "step",
        position: { x: 40, y: 460 },
        data: { title: "Later: Marketing", body: "Teaser / shortlist / NDA", tone: "grey" },
      },
      {
        id: "l2",
        type: "step",
        position: { x: 300, y: 460 },
        data: { title: "Later: Due diligence", body: "VDR / Q&A", tone: "grey" },
      },
      {
        id: "l3",
        type: "step",
        position: { x: 560, y: 460 },
        data: { title: "Later: Signing & closing", body: "SPA / notaris", tone: "grey" },
      },
    ],
    edges: [
      { id: "e1", source: "b1", target: "b2", animated: true },
      { id: "e2", source: "b2", target: "b3", animated: true },
      { id: "e3", source: "b3", target: "b4", animated: true },
      { id: "e4", source: "in1", target: "b2", sourceHandle: "b", targetHandle: "t" },
      { id: "e5", source: "in2", target: "b2", sourceHandle: "b", targetHandle: "t" },
      { id: "e6", source: "in3", target: "b2", sourceHandle: "b", targetHandle: "t" },
      { id: "e7", source: "l1", target: "l2" },
      { id: "e8", source: "l2", target: "l3" },
    ],
  };
}

type Props = {
  initial: FlowSketch;
  onSave: (flow: FlowSketch) => void;
};

function FlowCanvas({ initial, onSave }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
  const { fitView } = useReactFlow();
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusRef = useRef<HTMLSpanElement>(null);
  const ready = useRef(false);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  nodesRef.current = nodes;
  edgesRef.current = edges;

  useEffect(() => {
    const t = window.setTimeout(() => {
      fitView({ padding: 0.14, duration: 200 });
      ready.current = true;
      if (statusRef.current) statusRef.current.textContent = "Sleep pijl van blauw → zwart";
    }, 100);
    return () => window.clearTimeout(t);
  }, [fitView]);

  const scheduleSave = useCallback(() => {
    if (!ready.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    if (statusRef.current) statusRef.current.textContent = "Opslaan…";
    saveTimer.current = setTimeout(() => {
      onSave({ nodes: nodesRef.current, edges: edgesRef.current });
      if (statusRef.current) statusRef.current.textContent = "Opgeslagen";
    }, 450);
  }, [onSave]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => {
        const next = addEdge(
          {
            ...connection,
            id: `e-${connection.source}-${connection.target}-${Date.now()}`,
          },
          eds
        );
        edgesRef.current = next;
        scheduleSave();
        return next;
      });
    },
    [scheduleSave, setEdges]
  );

  function addStep() {
    const id = `n-${Date.now().toString(36)}`;
    setNodes((prev) => {
      const next: Node<StepData>[] = [
        ...prev,
        {
          id,
          type: "step",
          position: { x: 140 + (prev.length % 5) * 40, y: 140 + Math.floor(prev.length / 5) * 40 },
          data: { title: "Nieuwe stap", body: "", tone: "blue" },
        },
      ];
      nodesRef.current = next;
      scheduleSave();
      return next;
    });
  }

  const defaultEdgeOptions = useMemo(
    () => ({
      style: { stroke: "#151f28", strokeWidth: 2 },
      type: "smoothstep" as const,
    }),
    []
  );

  return (
    <div className="relative h-full w-full bg-[#f3f1eb]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={(chs) => {
          onNodesChange(chs);
          // Persist after drag/data changes settle
          scheduleSave();
        }}
        onEdgesChange={(chs) => {
          onEdgesChange(chs);
          scheduleSave();
        }}
        onConnect={onConnect}
        onNodeDragStop={() => scheduleSave()}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        deleteKeyCode={["Backspace", "Delete"]}
        connectionLineStyle={{ stroke: "#1125ff", strokeWidth: 2 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={18} color="#d6d3cd" />
        <Controls showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          className="!rounded-xl !border !border-black/10 !bg-white/90"
          nodeColor="#ceff00"
        />
      </ReactFlow>

      <div className="pointer-events-none absolute left-3 top-3 z-20 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-2">
        <div className="pointer-events-auto rounded-full bg-[#151f28] px-3 py-1.5 text-[11px] text-white shadow-lg">
          <span className="font-medium">Proces</span>
          <span className="mx-2 text-white/25">|</span>
          <span ref={statusRef} className="font-mono text-[10px] uppercase tracking-wider text-[#ceff00]">
            …
          </span>
        </div>
        <button
          type="button"
          onClick={addStep}
          className="pointer-events-auto inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-[#151f28] shadow-lg ring-1 ring-black/10"
        >
          <Plus className="h-3.5 w-3.5" /> Stap
        </button>
        <button
          type="button"
          onClick={() => fitView({ padding: 0.14, duration: 200 })}
          className="pointer-events-auto rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-[#151f28] shadow-lg ring-1 ring-black/10"
        >
          Alles tonen
        </button>
        <p className="self-center rounded-full bg-white/85 px-3 py-1.5 text-[11px] text-[#151f28]/55 ring-1 ring-black/5">
          Sleep vanaf blauw bolletje naar zwart bolletje · Delete = weg
        </p>
      </div>
    </div>
  );
}

export default function ProcessFlowEditor(props: Props) {
  return (
    <ReactFlowProvider>
      <FlowCanvas {...props} />
    </ReactFlowProvider>
  );
}
