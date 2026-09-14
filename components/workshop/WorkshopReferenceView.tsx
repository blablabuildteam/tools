"use client";

import { FaceExpressionless, Plus, Sparkles, Trash2 } from "lucide-react";
import { nanoid } from "nanoid";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchWorkshopSession,
  isEditingTextField,
  reportWorkshopSync,
  startWorkshopPoll,
  type WorkshopClientPayload,
} from "@/lib/workshop-sync";
import {
  SOPHISTA_IM_STRUCTURE,
  SOPHISTA_LATER_PHASES,
  isPrepPhaseSketch,
  normalizePrepPhase,
  sketchFingerprint,
  type PrepAiIdea,
  type PrepMilestone,
  type PrepMilestoneId,
  type PrepPhaseSketch,
  type PrepStep,
} from "@/lib/workshop-types";

type Props = {
  sessionId: string;
  active: boolean;
};

function formatHours(raw: string): string | null {
  const n = Number(String(raw).trim().replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  const label = Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10).replace(".", ",");
  return `${label} uur`;
}

function reindexAi(ideas: PrepAiIdea[], milestoneId: PrepMilestoneId): PrepAiIdea[] {
  const col = ideas
    .filter((s) => s.milestoneId === milestoneId)
    .sort((a, b) => a.order - b.order)
    .map((s, i) => ({ ...s, order: i }));
  return [...ideas.filter((s) => s.milestoneId !== milestoneId), ...col];
}

export default function WorkshopReferenceView({ sessionId, active }: Props) {
  const [doc, setDoc] = useState<PrepPhaseSketch | null>(null);
  const [missing, setMissing] = useState(false);
  const [status, setStatus] = useState("…");
  const docRef = useRef<PrepPhaseSketch | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirtyRef = useRef(false);
  const revRef = useRef<number | undefined>(undefined);
  const fingerprintRef = useRef("");
  const rootRef = useRef<HTMLDivElement>(null);
  docRef.current = doc;

  const persist = useCallback(
    (next: PrepPhaseSketch, immediate = false) => {
      setDoc(next);
      docRef.current = next;
      fingerprintRef.current = sketchFingerprint(next);
      if (!sessionId) return;
      dirtyRef.current = true;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      const flush = () => {
        saveTimer.current = null;
        setStatus("Opslaan…");
        reportWorkshopSync("saving");
        void fetch(`/api/workshop-sessions/${encodeURIComponent(sessionId)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "save-sketch",
            sketch: { aiIdeas: next.aiIdeas },
            touched: ["aiIdeas"],
          }),
        })
          .then(async (res) => {
            const data = (await res.json()) as WorkshopClientPayload;
            if (typeof data.rev === "number") revRef.current = data.rev;
            setStatus("Opgeslagen");
          })
          .finally(() => {
            window.setTimeout(() => {
              dirtyRef.current = false;
            }, 800);
          });
      };
      if (immediate) flush();
      else {
        setStatus("Wijzigingen…");
        saveTimer.current = setTimeout(flush, 400);
      }
    },
    [sessionId]
  );

  const load = useCallback(async () => {
    if (!sessionId) return;
    try {
      const data = await fetchWorkshopSession(sessionId);
      if (data.requiresPassword) {
        setMissing(true);
        setDoc(null);
        return;
      }
      const next = normalizePrepPhase(data.sketch);
      if (!next) {
        setMissing(true);
        setDoc(null);
        return;
      }
      if (typeof data.rev === "number") revRef.current = data.rev;
      setMissing(false);
      setDoc(next);
      docRef.current = next;
      fingerprintRef.current = sketchFingerprint(next);
      setStatus("Geladen");
      if (!isPrepPhaseSketch(data.sketch) || !Array.isArray((data.sketch as PrepPhaseSketch).aiIdeas)) {
        persist(next, true);
      }
    } catch {
      setMissing(true);
      setDoc(null);
    }
  }, [persist, sessionId]);

  useEffect(() => {
    if (!active) {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
        const current = docRef.current;
        if (current && sessionId) {
          dirtyRef.current = true;
          void fetch(`/api/workshop-sessions/${encodeURIComponent(sessionId)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "save-sketch",
              sketch: { aiIdeas: current.aiIdeas },
              touched: ["aiIdeas"],
            }),
          }).finally(() => {
            dirtyRef.current = false;
          });
        }
      }
      return;
    }
    const t = window.setTimeout(() => {
      void load();
    }, 450);
    return () => window.clearTimeout(t);
  }, [active, load, sessionId]);

  useEffect(() => {
    if (!active || !sessionId) return;
    return startWorkshopPoll({
      sessionId,
      getRev: () => revRef.current,
      shouldSkip: () =>
        dirtyRef.current ||
        Boolean(saveTimer.current) ||
        (Boolean(rootRef.current?.contains(document.activeElement)) && isEditingTextField()),
      onPayload: (data) => {
        if (data.requiresPassword) return;
        const next = normalizePrepPhase(data.sketch);
        if (!next) return;
        if (typeof data.rev === "number") revRef.current = data.rev;
        const fp = sketchFingerprint(next);
        if (fp === fingerprintRef.current) return;
        fingerprintRef.current = fp;
        setMissing(false);
        setDoc(next);
        docRef.current = next;
        setStatus("Live");
        reportWorkshopSync("incoming");
      },
    });
  }, [active, sessionId]);

  const patchAi = useCallback(
    (id: string, partial: Partial<PrepAiIdea>) => {
      const current = docRef.current;
      if (!current) return;
      persist({
        ...current,
        aiIdeas: current.aiIdeas.map((idea) => (idea.id === id ? { ...idea, ...partial } : idea)),
      });
    },
    [persist]
  );

  const deleteAi = useCallback(
    (id: string) => {
      const current = docRef.current;
      if (!current) return;
      const gone = current.aiIdeas.find((idea) => idea.id === id);
      if (!gone) return;
      persist({
        ...current,
        aiIdeas: reindexAi(
          current.aiIdeas.filter((idea) => idea.id !== id),
          gone.milestoneId
        ),
      });
    },
    [persist]
  );

  const addAi = useCallback(
    (milestoneId: PrepMilestoneId) => {
      const current = docRef.current;
    if (!current) return;
      const order = current.aiIdeas.filter((idea) => idea.milestoneId === milestoneId).length;
      persist({
        ...current,
        aiIdeas: [
          ...current.aiIdeas,
          {
            id: `ai-${nanoid(8)}`,
            milestoneId,
            title: "",
            body: "",
            sources: "",
            known: false,
            order,
          },
        ],
      });
    },
    [persist]
  );

  const milestones = [...(doc?.milestones ?? [])].sort((a, b) => a.order - b.order);

  return (
    <div ref={rootRef} className="h-full overflow-y-auto bg-[#0f1419] text-white">
      <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-12">
        <div data-view-item className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-[#ceff00]">
              Zelfde data als de schets
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">AI-kansen</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/50">
              Milestones en stappen uit de schets, met AI-kansen erop. Toevoegen en schrappen hier
              of op de schets — het is dezelfde lijst.
            </p>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-white/35">{status}</p>
        </div>

        {missing && (
          <p data-view-item className="mt-8 rounded-2xl border border-white/10 bg-[#161d26] px-5 py-4 text-sm text-white/60">
            Nog geen voorbereidingsfase-schets. Open eerst het tabblad Schets.
          </p>
        )}

        <div className="mt-8 space-y-6">
          {milestones.map((milestone, index) => (
            <MilestoneBlock
              key={milestone.id}
              index={index}
              milestone={milestone}
              steps={(doc?.steps ?? [])
                .filter((step) => step.milestoneId === milestone.id)
                .sort((a, b) => a.order - b.order)}
              ideas={(doc?.aiIdeas ?? [])
                .filter((idea) => idea.milestoneId === milestone.id)
                .sort((a, b) => a.order - b.order)}
              onPatch={patchAi}
              onDelete={deleteAi}
              onAdd={() => addAi(milestone.id)}
            />
          ))}
        </div>

        <section data-view-item className="mt-10 rounded-2xl border border-white/10 bg-[#161d26] p-5 sm:p-6">
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

        <section data-view-item className="mt-5 rounded-2xl border border-white/10 bg-[#161d26] p-5 sm:p-6">
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

function MilestoneBlock({
  index,
  milestone,
  steps,
  ideas,
  onPatch,
  onDelete,
  onAdd,
}: {
  index: number;
  milestone: PrepMilestone;
  steps: PrepStep[];
  ideas: PrepAiIdea[];
  onPatch: (id: string, partial: Partial<PrepAiIdea>) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <section
      data-view-item
      style={{ ["--view-i" as string]: Math.min(index + 1, 10) }}
      className="rounded-2xl border border-white/10 bg-[#161d26] p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#ceff00]">
            {String(index + 1).padStart(2, "0")} · milestone
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">{milestone.short}</h2>
          {milestone.title ? (
            <p className="mt-1 text-[13px] leading-snug text-white/50">{milestone.title}</p>
          ) : null}
        </div>
        <p className="rounded-full bg-white/8 px-2 py-0.5 font-mono text-[10px] text-white/45">
          {ideas.length} AI-kans{ideas.length === 1 ? "" : "en"}
        </p>
      </div>

      <div className="mt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">Stappen op de schets</p>
        {steps.length === 0 ? (
          <p className="mt-2 text-[13px] text-white/35">Nog geen stappen.</p>
        ) : (
          <ol className="mt-2 space-y-1.5">
            {steps.map((step, i) => {
              const hours = formatHours(step.duration);
              const who = [...step.people, ...step.parties];
              return (
                <li key={step.id} className="rounded-xl border border-white/8 bg-black/25 px-3 py-2">
                  <p className="flex items-start gap-1.5 text-[13px] font-medium text-white/85">
                    <span className="mr-0.5 font-mono text-[11px] text-white/30">{i + 1}.</span>
                    <span className="min-w-0 flex-1">{step.title.trim() || "Naamloze stap"}</span>
                    {step.painPoint ? (
                      <span
                        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-rose-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-rose-300"
                        title="Pijnpunt"
                      >
                        <FaceExpressionless className="h-3 w-3" />
                        Pijn
                      </span>
                    ) : null}
                  </p>
                  {step.description ? (
                    <p className="mt-0.5 text-[12px] leading-snug text-white/45">{step.description}</p>
                  ) : null}
                  <p className="mt-1 text-[11px] text-white/35">
                    {[hours, who.length ? who.join(" · ") : null, step.tools.length ? step.tools.join(" · ") : null]
                      .filter(Boolean)
                      .join("  ·  ")}
                  </p>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className="mt-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#ceff00]">AI-kansen</p>
        <div className="mt-2 space-y-3">
          {ideas.map((idea) => (
            <article
              key={idea.id}
              className="rounded-xl border border-[#ceff00]/35 bg-[#ceff00]/10 px-3 py-3"
            >
              <div className="flex items-start gap-2">
                <Sparkles className="mt-1 h-3.5 w-3.5 shrink-0 text-[#ceff00]" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-[#ceff00]/80">
                      AI-kans
                    </span>
                    {idea.known && (
                      <span className="rounded-full bg-[#ceff00]/15 px-1.5 py-px text-[9px] font-semibold text-[#ceff00]">
                        Sophista
                      </span>
                    )}
                  </div>
                  <input
                    value={idea.title}
                    onChange={(e) => onPatch(idea.id, { title: e.target.value })}
                    placeholder="Titel van de AI-kans"
                    className="mt-1 w-full bg-transparent text-[15px] font-semibold text-white outline-none placeholder:text-white/30"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(idea.id)}
                  className="rounded p-1 text-white/30 hover:text-red-400"
                  aria-label="AI-kans verwijderen"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <textarea
                value={idea.body}
                onChange={(e) => onPatch(idea.id, { body: e.target.value })}
                placeholder="Wat kan AI hier doen?"
                rows={3}
                className="mt-2 w-full resize-y bg-transparent text-[13px] leading-relaxed text-white/75 outline-none placeholder:text-white/30"
              />
              <input
                value={idea.sources}
                onChange={(e) => onPatch(idea.id, { sources: e.target.value })}
                placeholder="Bronnen · bijv. Company.info"
                className="mt-1 w-full bg-transparent font-mono text-[11px] text-white/40 outline-none placeholder:text-white/25"
              />
            </article>
          ))}
          <button
            type="button"
            onClick={onAdd}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-[#ceff00]/30 bg-[#ceff00]/5 px-3 py-2.5 text-[12px] font-semibold text-[#ceff00]/90 hover:border-[#ceff00]/50 hover:bg-[#ceff00]/10"
          >
            <Plus className="h-3.5 w-3.5" /> AI-kans
          </button>
        </div>
      </div>
    </section>
  );
}
