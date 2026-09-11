"use client";

import { useState } from "react";
import { Check, Plus, UserPlus, X } from "lucide-react";
import type { WorkshopAttendee, WorkshopIntro } from "@/lib/workshop-types";

type Props = {
  intro: WorkshopIntro;
  author: string;
  onChange: (intro: WorkshopIntro) => void;
  onStartBoard: () => void;
};

export default function WorkshopIntroView({ intro, author, onChange, onStartBoard }: Props) {
  const [name, setName] = useState(author || "");
  const [org, setOrg] = useState("");
  const [role, setRole] = useState("");

  function checkIn() {
    const n = name.trim();
    if (!n) return;
    if (intro.attendees.some((a) => a.name.toLowerCase() === n.toLowerCase())) {
      onStartBoard();
      return;
    }
    const attendee: WorkshopAttendee = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: n,
      org: org.trim() || undefined,
      role: role.trim() || undefined,
      joinedAt: new Date().toISOString(),
    };
    onChange({ ...intro, attendees: [...intro.attendees, attendee] });
    onStartBoard();
  }

  function removeAttendee(id: string) {
    onChange({ ...intro, attendees: intro.attendees.filter((a) => a.id !== id) });
  }

  function updateList(
    key: "discover" | "nextSteps" | "agenda",
    index: number,
    value: string
  ) {
    const list = [...intro[key]];
    list[index] = value;
    onChange({ ...intro, [key]: list });
  }

  function addListItem(key: "discover" | "nextSteps" | "agenda") {
    onChange({ ...intro, [key]: [...intro[key], ""] });
  }

  function removeListItem(key: "discover" | "nextSteps" | "agenda", index: number) {
    onChange({ ...intro, [key]: intro[key].filter((_, i) => i !== index) });
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-bla-lime">Intro</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Welkom</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/50">
          Korte kick-off vóór het bord: wie is er, wat willen we vandaag, en wat is de follow-up.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:col-span-2">
          <h2 className="text-sm font-semibold text-white">Doel vandaag</h2>
          <textarea
            value={intro.todayGoal}
            onChange={(e) => onChange({ ...intro, todayGoal: e.target.value })}
            rows={3}
            className="mt-3 w-full resize-y rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm leading-relaxed outline-none focus:border-bla-lime/50"
            placeholder="Wat willen we vandaag bereiken?"
          />
        </section>

        <ListBlock
          title="Wat willen we achterhalen?"
          items={intro.discover}
          onChange={(i, v) => updateList("discover", i, v)}
          onAdd={() => addListItem("discover")}
          onRemove={(i) => removeListItem("discover", i)}
        />
        <ListBlock
          title="Next steps"
          items={intro.nextSteps}
          onChange={(i, v) => updateList("nextSteps", i, v)}
          onAdd={() => addListItem("nextSteps")}
          onRemove={(i) => removeListItem("nextSteps", i)}
        />
        <ListBlock
          title="Agenda"
          items={intro.agenda}
          onChange={(i, v) => updateList("agenda", i, v)}
          onAdd={() => addListItem("agenda")}
          onRemove={(i) => removeListItem("agenda", i)}
          className="md:col-span-2"
        />

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-white">Aanwezig</h2>
            <span className="text-[11px] text-white/40">{intro.attendees.length} personen</span>
          </div>

          {intro.attendees.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {intro.attendees.map((a) => (
                <li
                  key={a.id}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1 pl-3 pr-1.5 text-xs"
                >
                  <span>
                    {a.name}
                    {a.org ? <span className="text-white/40"> · {a.org}</span> : null}
                    {a.role ? <span className="text-white/35"> ({a.role})</span> : null}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAttendee(a.id)}
                    className="rounded-full p-1 text-white/35 hover:bg-white/10 hover:text-white"
                    aria-label={`Verwijder ${a.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jouw naam"
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-bla-lime/50"
            />
            <input
              value={org}
              onChange={(e) => setOrg(e.target.value)}
              placeholder="Organisatie (optioneel)"
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-bla-lime/50"
            />
            <input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Rol (optioneel)"
              className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-bla-lime/50"
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={checkIn}
              disabled={!name.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-bla-lime px-4 py-2.5 text-sm font-semibold text-bla-dark disabled:opacity-40"
            >
              <UserPlus className="h-4 w-4" /> Check in & start bord
            </button>
            <button
              type="button"
              onClick={onStartBoard}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm text-white/70 hover:border-white/30 hover:text-white"
            >
              <Check className="h-4 w-4" /> Direct naar bord
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function ListBlock({
  title,
  items,
  onChange,
  onAdd,
  onRemove,
  className = "",
}: {
  title: string;
  items: string[];
  onChange: (index: number, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-white/10 bg-white/[0.03] p-5 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-bla-lime hover:bg-bla-lime/10"
        >
          <Plus className="h-3.5 w-3.5" /> Item
        </button>
      </div>
      <ul className="mt-3 space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-bla-lime/70" />
            <input
              value={item}
              onChange={(e) => onChange(i, e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/20 px-2.5 py-2 text-sm outline-none focus:border-bla-lime/40"
            />
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="shrink-0 rounded-lg p-2 text-white/30 hover:text-red-300"
              aria-label="Verwijder"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
        {items.length === 0 && (
          <p className="text-xs text-white/30">Nog leeg — voeg items toe.</p>
        )}
      </ul>
    </section>
  );
}
