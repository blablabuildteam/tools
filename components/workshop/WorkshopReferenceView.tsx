"use client";

import {
  SOPHISTA_AI_DIRECTIONS,
  SOPHISTA_IM_STRUCTURE,
  SOPHISTA_LATER_PHASES,
} from "@/lib/workshop-types";

export default function WorkshopReferenceView() {
  return (
    <div className="h-full overflow-y-auto bg-[#0f1419] text-white">
      <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#ceff00]">
          Naslag · Sophista docs
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">AI-richtingen</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/50">
          Terugblik uit hun AI-toepassingen (voorbereidingsfase). Gebruik dit om snel te
          prioriteren — scope vandaag blijft info verzamelen → eerste gestandaardiseerde output.
        </p>

        <div className="mt-8 grid gap-4">
          {SOPHISTA_AI_DIRECTIONS.map((uc) => (
            <article
              key={uc.id}
              className={`rounded-2xl border p-5 sm:p-6 ${
                uc.inScopeToday
                  ? "border-[#1125ff]/35 bg-[#161d26]"
                  : "border-white/8 bg-[#121820] opacity-80"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-white/35">
                  {uc.phase}
                </span>
                {uc.inScopeToday ? (
                  <span className="rounded-full bg-[#ceff00]/15 px-2 py-0.5 text-[10px] font-semibold text-[#ceff00]">
                    Relevant vandaag
                  </span>
                ) : (
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/35">
                    Later / uitbreiding
                  </span>
                )}
              </div>
              <h2 className="mt-2 text-lg font-semibold tracking-tight">{uc.title}</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-white/75">{uc.blurb}</p>
              <p className="mt-3 font-mono text-[11px] text-white/35">{uc.sources}</p>
            </article>
          ))}
        </div>

        <section className="mt-10 rounded-2xl border border-white/10 bg-[#161d26] p-5 sm:p-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ceff00]">
            IM-structuur (prompt)
          </h2>
          <p className="mt-2 text-sm text-white/45">
            Als de eerste output richting IM/rapport gaat — dit is hun gewenste slide-opbouw.
          </p>
          <ol className="mt-4 columns-1 gap-x-8 space-y-1.5 sm:columns-2">
            {SOPHISTA_IM_STRUCTURE.map((item, i) => (
              <li key={item} className="break-inside-avoid text-[13px] text-white/80">
                <span className="mr-2 font-mono text-white/30">{i + 1}.</span>
                {item}
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-5 rounded-2xl border border-white/10 bg-[#161d26] p-5 sm:p-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ceff00]">
            Later in het verkoopproces
          </h2>
          <p className="mt-2 text-sm text-white/45">Kort meenemen voor uitbreidbaarheid — niet bouwen vandaag.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {SOPHISTA_LATER_PHASES.map((p) => (
              <div key={p.title} className="rounded-xl border border-white/8 bg-black/25 p-4">
                <p className="text-sm font-semibold">{p.title}</p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-white/50">{p.items}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
