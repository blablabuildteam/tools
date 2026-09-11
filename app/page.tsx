"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Lock, Sparkles, Wrench } from "lucide-react";
import { TOOLS } from "@/lib/tools";

export default function ToolsHub() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-bla-dark text-bla-white">
      <div
        className="pointer-events-none absolute inset-0 bg-grid-faint bg-grid opacity-40"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-32 top-0 h-[420px] w-[420px] rounded-full bg-bla-lime/10 blur-[120px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-0 h-[380px] w-[380px] rounded-full bg-bla-blue/30 blur-[110px]"
        aria-hidden
      />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 pb-4 pt-8 sm:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bla-lime text-bla-dark">
            <Wrench className="h-5 w-5" strokeWidth={2.25} />
          </div>
          <div>
            <p className="font-display text-lg font-bold tracking-tight">BlaBlaBuild</p>
            <p className="text-xs uppercase tracking-[0.22em] text-bla-text-muted">Tools</p>
          </div>
        </div>
        <p className="hidden text-sm text-bla-text-muted sm:block">
          Workshops · presentaties · interne sessies
        </p>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-10 sm:px-10 sm:pt-16">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-3xl"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-bla-text-light">
            <Sparkles className="h-3.5 w-3.5 text-bla-lime" />
            tools.blablabuild.com
          </div>
          <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            Kies je
            <span className="text-bla-lime"> tool</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-bla-text-muted sm:text-lg">
            Interne speeltuin voor workshops en klantsessies. Open een tool, deel de sessiecode,
            en werk live mee — zonder rommel in de marketing site.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {TOOLS.map((tool, i) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                href={tool.href}
                className="group relative block overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-6 transition hover:border-bla-lime/40 hover:shadow-glow sm:p-8"
              >
                <div
                  className="absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-20 blur-2xl transition group-hover:opacity-40"
                  style={{ background: tool.accent }}
                  aria-hidden
                />
                <div className="relative flex items-start justify-between gap-4">
                  <div>
                    <span
                      className="inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-bla-dark"
                      style={{ background: tool.accent }}
                    >
                      {tool.badge}
                    </span>
                    <h2 className="mt-4 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                      {tool.title}
                    </h2>
                    <p className="mt-1 text-sm text-bla-lime/90">{tool.subtitle}</p>
                    <p className="mt-4 max-w-md text-sm leading-relaxed text-bla-text-muted">
                      {tool.blurb}
                    </p>
                  </div>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 transition group-hover:border-bla-lime group-hover:bg-bla-lime group-hover:text-bla-dark">
                    <ArrowUpRight className="h-5 w-5" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <p className="mt-10 flex items-center gap-2 text-xs text-bla-text-muted">
          <Lock className="h-3.5 w-3.5" />
          Hub is open. Client-sessies kunnen optioneel met wachtwoord.
        </p>
      </main>
    </div>
  );
}
