"use client";

import Image from "next/image";
import { attendeePhotoUrl } from "@/lib/workshop-types";

type Attendee = {
  id: string;
  name: string;
  org?: string;
  role?: string;
  photo?: string;
};

const AGENDA = [
  "Focus op het huidige proces",
  "AI-kansen identificeren",
  "Eerste technische aanpak van een oplossing vormgeven",
  "Recap en vervolgstappen",
];

type Props = {
  intro: {
    todayGoal: string;
    discover: string[];
    nextSteps: string[];
    agenda: string[];
    attendees: Attendee[];
  };
  onContinue: () => void;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function AttendeeRow({ attendee }: { attendee: Attendee }) {
  const photo = attendeePhotoUrl(attendee);
  return (
    <li className="flex items-center gap-3">
      {photo ? (
        <Image
          src={photo}
          alt=""
          width={40}
          height={40}
          className="h-10 w-10 shrink-0 rounded-full object-cover object-top ring-1 ring-white/15"
        />
      ) : (
        <span
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-semibold text-white/70 ring-1 ring-white/10"
        >
          {initials(attendee.name)}
        </span>
      )}
      <span>
        {attendee.name}
        {attendee.role ? <span className="text-white/45"> · {attendee.role}</span> : null}
      </span>
    </li>
  );
}

export default function WorkshopIntroView({ intro, onContinue }: Props) {
  return (
    <div className="h-full overflow-y-auto bg-bla-dark text-white">
      <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 sm:py-14">
        <div data-view-item>
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-bla-lime">
            Workshop intro
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Sophista × blablabuild
          </h1>
          <p className="mt-2 text-sm text-white/55">Dinsdag · 15:00–18:00</p>
        </div>

        <section data-view-item className="mt-10 rounded-2xl border border-white/12 bg-[#1a222c] p-5 sm:p-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-bla-lime">
            Doel vandaag
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-white/90">{intro.todayGoal}</p>
        </section>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <section data-view-item className="rounded-2xl border border-white/12 bg-[#1a222c] p-5 sm:p-6">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-bla-lime">
              Wat willen we achterhalen?
            </h2>
            <ul className="mt-4 space-y-3">
              {intro.discover.map((item) => (
                <li key={item} className="flex gap-3 text-[14px] leading-relaxed text-white/85">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-bla-lime" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section data-view-item className="rounded-2xl border border-white/12 bg-[#1a222c] p-5 sm:p-6">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-bla-lime">
              Klaar als
            </h2>
            <ul className="mt-4 space-y-3">
              {intro.nextSteps.map((item) => (
                <li key={item} className="flex gap-3 text-[14px] leading-relaxed text-white/85">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-bla-lime" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section data-view-item className="mt-5 rounded-2xl border border-white/12 bg-[#1a222c] p-5 sm:p-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-bla-lime">
            Agenda
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed text-white/60">
            We hebben 3 uur beschikbaar (15:00–18:00). Waarschijnlijk hebben we niet alle tijd nodig.
          </p>
          <ol className="mt-4 space-y-2.5">
            {AGENDA.map((item, index) => (
              <li
                key={item}
                className="flex items-start gap-3 rounded-xl border border-white/8 bg-black/25 px-4 py-3 text-[14px] leading-relaxed text-white/90"
              >
                <span className="mt-0.5 font-mono text-[12px] font-semibold text-bla-lime">
                  {index + 1}.
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </section>

        <section data-view-item className="mt-5 rounded-2xl border border-white/12 bg-[#1a222c] p-5 sm:p-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-bla-lime">
            Aanwezig
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-white/45">Sophista</p>
              <ul className="mt-3 space-y-2.5 text-[14px] text-white/90">
                {intro.attendees
                  .filter((a) => a.org === "Sophista")
                  .map((a) => (
                    <AttendeeRow key={a.id} attendee={a} />
                  ))}
              </ul>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-white/45">BlaBlaBuild</p>
              <ul className="mt-3 space-y-2.5 text-[14px] text-white/90">
                {intro.attendees
                  .filter((a) => a.org === "BlaBlaBuild")
                  .map((a) => (
                    <AttendeeRow key={a.id} attendee={a} />
                  ))}
              </ul>
            </div>
          </div>
        </section>

        <div data-view-item className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={onContinue}
            className="rounded-xl bg-bla-lime px-5 py-3 text-sm font-semibold text-bla-dark"
          >
            Door naar schets →
          </button>
        </div>
      </div>
    </div>
  );
}
