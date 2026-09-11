export type ToolId = "ai-matrix" | "workshop";

export type ToolMeta = {
  id: ToolId;
  href: string;
  title: string;
  subtitle: string;
  blurb: string;
  badge: string;
  accent: string;
};

export const TOOLS: ToolMeta[] = [
  {
    id: "ai-matrix",
    href: "/tools/ai-matrix",
    title: "AI Use Case Matrix",
    subtitle: "Workshop scoring & prioritering",
    blurb:
      "Verzamel use cases live, plot impact × effort, prioriteer clusters en bouw roadmap + Claude-cases.",
    badge: "Live",
    accent: "#CEFF00",
  },
  {
    id: "workshop",
    href: "/tools/workshop",
    title: "Process Workshop",
    subtitle: "Bord + schets",
    blurb:
      "Gestructureerd workshopbord van proces → oplossingen → tech-contouren, plus een vrij schetsvlak.",
    badge: "Nieuw",
    accent: "#7DD3FC",
  },
];
