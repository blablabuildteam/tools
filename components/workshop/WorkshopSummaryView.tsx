"use client";

type Summary = {
  validatedProcess: string;
  priorityOne: string;
  techContour: string;
  openQuestions: string;
  nextStepsOut: string;
};

type Props = {
  summary: Summary;
  onChange: (next: Summary) => void;
};

const FIELDS: {
  key: keyof Summary;
  label: string;
  hint: string;
  rows: number;
}[] = [
  {
    key: "validatedProcess",
    label: "Gevalideerd proces",
    hint: "Hoe loopt info → analyse → eerste rapport écht? Wat is bijgetekend op de schets?",
    rows: 4,
  },
  {
    key: "priorityOne",
    label: "Prioriteit #1",
    hint: "Welke AI-kans eerst, en waarom die?",
    rows: 3,
  },
  {
    key: "techContour",
    label: "Tech-contour",
    hint: "Bronnen, templates, review-stap, output-formaat, constraints, uitbreidbaarheid",
    rows: 4,
  },
  {
    key: "openQuestions",
    label: "Open vragen / input nodig",
    hint: "Wat moet Sophista nog aanleveren of beslissen?",
    rows: 3,
  },
  {
    key: "nextStepsOut",
    label: "Next steps",
    hint: "Wat gebeurt er na vandaag? (bouwvoorstel = onderdeel B, later)",
    rows: 3,
  },
];

export default function WorkshopSummaryView({ summary, onChange }: Props) {
  return (
    <div className="h-full overflow-y-auto bg-[#0f1419] text-white">
      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-12">
        <div data-view-item>
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#ceff00]">
            Afronding
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Succes vandaag</h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/50">
            Vul dit aan het eind in — dit is jullie gezamenlijke resultaat (A): gevalideerd proces +
            prioriteit #1 + eerste tech-contour. Wordt automatisch opgeslagen.
          </p>
        </div>

        <div className="mt-8 space-y-5">
          {FIELDS.map((field) => (
            <section
              key={field.key}
              data-view-item
              className="rounded-2xl border border-white/10 bg-[#161d26] p-5 sm:p-6"
            >
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#ceff00]">
                  {field.label}
                </span>
                <span className="mt-1 block text-[12px] text-white/40">{field.hint}</span>
                <textarea
                  value={summary[field.key]}
                  onChange={(e) => onChange({ ...summary, [field.key]: e.target.value })}
                  rows={field.rows}
                  placeholder="Typ hier…"
                  className="mt-4 w-full resize-y rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-[15px] leading-relaxed text-white/90 outline-none placeholder:text-white/25 focus:border-[#1125ff]/50"
                />
              </label>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
