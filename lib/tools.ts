export type ToolId = "ai-matrix" | "workshop";

export type ToolMeta = {
  id: ToolId;
  href: string;
  title: string;
  subtitle: string;
  blurb: string;
  badge: string;
};

export const TOOLS: ToolMeta[] = [
  {
    id: "ai-matrix",
    href: "/tools/ai-matrix",
    title: "AI Use Case Matrix",
    subtitle: "Prioriteren",
    blurb: "Use cases verzamelen, scoren en prioriteren in één workshop.",
    badge: "Openen →",
  },
  {
    id: "workshop",
    href: "/tools/workshop",
    title: "Process Workshop",
    subtitle: "Proces & schets",
    blurb: "Proces uitwerken op het bord, vrij schetsen waar nodig.",
    badge: "Openen →",
  },
];
