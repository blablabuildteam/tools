"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { BlablaLogo } from "@/components/BlablaLogo";
import { TOOLS } from "@/lib/tools";

export default function ToolsHub() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-bla-dark text-bla-white">
      <div
        className="pointer-events-none absolute inset-0 bg-grid-faint bg-grid opacity-40"
        aria-hidden
      />
      {/* Explicit blue / lime atmosphere (not only opacity utilities) */}
      <div
        className="pointer-events-none absolute -left-32 top-0 h-[480px] w-[480px] rounded-full blur-[120px]"
        style={{ background: "rgba(206, 255, 0, 0.12)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 -top-10 h-[520px] w-[520px] rounded-full blur-[100px]"
        style={{ background: "rgba(17, 37, 255, 0.45)" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/4 h-[360px] w-[360px] rounded-full blur-[110px]"
        style={{ background: "rgba(17, 37, 255, 0.28)" }}
        aria-hidden
      />

      <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-6 pt-8 sm:px-10">
        <Link href="/" className="flex items-center gap-2.5">
          <BlablaLogo className="h-8 w-8" />
          <span className="text-base tracking-tight text-white">
            <span className="font-light text-white/70">blabla</span>
            <span className="font-bold">build</span>
          </span>
        </Link>
        <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/40">
          Tools
        </span>
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-6 pb-20 pt-16 sm:px-10 sm:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="max-w-xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl">
            Workshop tools
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/50">
            Sessie starten, code delen, live samenwerken.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-4 md:grid-cols-2">
          {TOOLS.map((tool, i) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                href={tool.href}
                className="group flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-bla-lime/40 hover:bg-white/[0.06] hover:shadow-glow sm:p-7"
              >
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-bla-lime/80">
                    {tool.subtitle}
                  </p>
                  <h2 className="mt-3 text-xl font-bold tracking-tight sm:text-2xl">
                    {tool.title}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-white/45">{tool.blurb}</p>
                </div>
                <div className="mt-8 flex items-center justify-between">
                  <span className="text-xs text-white/35">{tool.badge}</span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/12 text-white/60 transition group-hover:border-bla-lime group-hover:bg-bla-lime group-hover:text-bla-dark">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
