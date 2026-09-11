"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Copy,
  LayoutGrid,
  Lock,
  Pencil,
  Plus,
  RefreshCw,
  Share2,
  Unlock,
  BookOpen,
} from "lucide-react";
import { nanoid } from "nanoid";
import {
  CARD_COLORS,
  WORKSHOP_COLUMNS,
  createEmptyIntro,
  type WorkshopCard,
  type WorkshopColumnId,
  type WorkshopIntro,
  type WorkshopMeta,
} from "@/lib/workshop-types";
import WorkshopBoard from "@/components/workshop/WorkshopBoard";
import WorkshopSketch from "@/components/workshop/WorkshopSketch";
import WorkshopIntroView from "@/components/workshop/WorkshopIntroView";

type Tab = "intro" | "board" | "sketch";

type SessionPayload = {
  meta: Omit<WorkshopMeta, "passwordHash">;
  cards: WorkshopCard[];
  sketch: unknown | null;
  kv: boolean;
  unlocked: boolean;
  requiresPassword: boolean;
};

function makeSessionId(company: string) {
  const slug = company
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
  const code = nanoid(6).toLowerCase();
  return slug ? `${slug}-${code}` : `workshop-${code}`;
}

export default function WorkshopTool() {
  const [landing, setLanding] = useState(true);
  const [sessionId, setSessionId] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("Process workshop");
  const [author, setAuthor] = useState("");
  const [password, setPassword] = useState("");
  const [unlockPassword, setUnlockPassword] = useState("");
  const [tab, setTab] = useState<Tab>("intro");
  const [meta, setMeta] = useState<Omit<WorkshopMeta, "passwordHash"> | null>(null);
  const [cards, setCards] = useState<WorkshopCard[]>([]);
  const [sketch, setSketch] = useState<unknown | null>(null);
  const [kv, setKv] = useState(true);
  const [locked, setLocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const skipPoll = useRef(false);
  const tabRef = useRef<Tab>("intro");
  const sketchDirty = useRef(false);

  useEffect(() => {
    tabRef.current = tab;
  }, [tab]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get("s");
    const name = params.get("name");
    if (name) setAuthor(name);
    if (s) {
      setJoinCode(s);
      void joinSession(s);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyPayload = useCallback((data: SessionPayload, opts?: { keepLocalSketch?: boolean }) => {
    setMeta(data.meta);
    setCards(data.cards ?? []);
    if (!(opts?.keepLocalSketch && sketchDirty.current)) {
      setSketch(data.sketch ?? null);
    }
    setKv(Boolean(data.kv));
    setLocked(Boolean(data.requiresPassword));
  }, []);

  const loadSession = useCallback(
    async (sid: string) => {
      const res = await fetch(`/api/workshop-sessions/${sid}`);
      const data = (await res.json()) as SessionPayload;
      applyPayload(data);
      return data;
    },
    [applyPayload]
  );

  async function joinSession(sidRaw?: string) {
    const sid = (sidRaw ?? joinCode).trim();
    if (!sid) return;
    setBusy(true);
    setError(null);
    try {
      const data = await loadSession(sid);
      setSessionId(sid);
      setLanding(false);
      if (!data.requiresPassword) {
        const url = new URL(window.location.href);
        url.searchParams.set("s", sid);
        window.history.replaceState({}, "", url.toString());
      }
    } catch {
      setError("Sessie laden mislukt");
    } finally {
      setBusy(false);
    }
  }

  async function createSession() {
    const sid = makeSessionId(company || "sessie");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/workshop-sessions/${sid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bootstrap",
          password: password.trim() || undefined,
          meta: {
            title: title.trim() || "Process workshop",
            company: company.trim(),
            goal: "Van binnenkomende informatie → verwerking & analyse → eerste gestandaardiseerde rapport",
          },
        }),
      });
      const data = (await res.json()) as SessionPayload & { ok?: boolean };
      if (!res.ok || data.ok === false) throw new Error("create failed");
      applyPayload(data);
      setSessionId(sid);
      setLanding(false);
      const url = new URL(window.location.href);
      url.searchParams.set("s", sid);
      window.history.replaceState({}, "", url.toString());
    } catch {
      setError("Sessie aanmaken mislukt — check KV env vars");
    } finally {
      setBusy(false);
    }
  }

  async function unlock() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/workshop-sessions/${sessionId || joinCode}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unlock", password: unlockPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError("Onjuist wachtwoord");
        return;
      }
      applyPayload(data as SessionPayload);
      setLanding(false);
      const sid = sessionId || joinCode;
      setSessionId(sid);
      const url = new URL(window.location.href);
      url.searchParams.set("s", sid);
      window.history.replaceState({}, "", url.toString());
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (landing || !sessionId || locked) return;
    const t = setInterval(async () => {
      if (skipPoll.current) return;
      try {
        const data = await loadSession(sessionId);
        if (!data.requiresPassword) {
          // Never clobber an in-progress sketch from a poll
          applyPayload(data, {
            keepLocalSketch: tabRef.current === "sketch" || sketchDirty.current,
          });
        }
      } catch {
        /* ignore */
      }
    }, 5000);
    return () => clearInterval(t);
  }, [landing, sessionId, locked, loadSession, applyPayload]);

  const persistCards = useCallback(
    async (next: WorkshopCard[]) => {
      setCards(next);
      if (!sessionId) return;
      skipPoll.current = true;
      try {
        await fetch(`/api/workshop-sessions/${sessionId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "replace-cards", cards: next }),
        });
      } finally {
        setTimeout(() => {
          skipPoll.current = false;
        }, 800);
      }
    },
    [sessionId]
  );

  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const upsertCard = useCallback(
    (card: WorkshopCard, opts?: { immediate?: boolean }) => {
      setCards((prev) => {
        const idx = prev.findIndex((c) => c.id === card.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = card;
          return copy;
        }
        return [...prev, card];
      });
      if (!sessionId) return;

      const flush = () => {
        skipPoll.current = true;
        void fetch(`/api/workshop-sessions/${sessionId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "upsert-card", card }),
        }).finally(() => {
          setTimeout(() => {
            skipPoll.current = false;
          }, 800);
        });
      };

      if (opts?.immediate) {
        if (saveTimers.current[card.id]) clearTimeout(saveTimers.current[card.id]);
        flush();
        return;
      }

      if (saveTimers.current[card.id]) clearTimeout(saveTimers.current[card.id]);
      saveTimers.current[card.id] = setTimeout(flush, 450);
    },
    [sessionId]
  );

  const deleteCard = useCallback(
    async (id: string) => {
      const next = cards.filter((c) => c.id !== id);
      setCards(next);
      if (!sessionId) return;
      skipPoll.current = true;
      try {
        await fetch(`/api/workshop-sessions/${sessionId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete-card", id }),
        });
      } finally {
        setTimeout(() => {
          skipPoll.current = false;
        }, 800);
      }
    },
    [cards, sessionId]
  );

  const saveSketch = useCallback(
    async (nextSketch: unknown) => {
      sketchDirty.current = true;
      // Keep parent sketch in sync for first load only — don't force remount
      if (!sessionId) return;
      skipPoll.current = true;
      try {
        await fetch(`/api/workshop-sessions/${sessionId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "save-sketch", sketch: nextSketch }),
        });
      } finally {
        setTimeout(() => {
          skipPoll.current = false;
        }, 1500);
      }
    },
    [sessionId]
  );

  const saveIntro = useCallback(
    (intro: WorkshopIntro) => {
      setMeta((prev) => (prev ? { ...prev, intro } : prev));
      if (!sessionId) return;
      skipPoll.current = true;
      void fetch(`/api/workshop-sessions/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update-intro", intro }),
      }).finally(() => {
        setTimeout(() => {
          skipPoll.current = false;
        }, 800);
      });
    },
    [sessionId]
  );

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined" || !sessionId) return "";
    return `${window.location.origin}/tools/workshop?s=${sessionId}`;
  }, [sessionId]);

  async function copyShare() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  function addCard(columnId: WorkshopColumnId) {
    const now = new Date().toISOString();
    const inCol = cards.filter((c) => c.columnId === columnId);
    const card: WorkshopCard = {
      id: nanoid(10),
      columnId,
      title: "",
      body: "",
      author: author || "anon",
      votes: [],
      color: CARD_COLORS[inCol.length % CARD_COLORS.length],
      order: inCol.length,
      createdAt: now,
      updatedAt: now,
    };
    upsertCard(card, { immediate: true });
  }

  if (landing || locked) {
    return (
      <div className="min-h-screen bg-bla-dark text-bla-white">
        <div className="mx-auto max-w-lg px-6 py-12">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm text-bla-text-muted hover:text-bla-lime"
          >
            <ArrowLeft className="h-4 w-4" /> Alle tools
          </Link>

          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Process Workshop
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-bla-text-muted">
            Bord voor proces → oplossingen → tech-contouren, plus een vrij schetsvlak. Deel de
            sessiecode met de groep.
          </p>

          {locked ? (
            <div className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-2 text-sm text-bla-lime">
                <Lock className="h-4 w-4" /> Deze sessie is beveiligd
              </div>
              <input
                type="password"
                value={unlockPassword}
                onChange={(e) => setUnlockPassword(e.target.value)}
                placeholder="Wachtwoord"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-bla-lime"
              />
              <button
                type="button"
                disabled={busy || !unlockPassword}
                onClick={() => void unlock()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-bla-lime px-4 py-3 text-sm font-semibold text-bla-dark disabled:opacity-50"
              >
                <Unlock className="h-4 w-4" /> Ontgrendel
              </button>
            </div>
          ) : (
            <div className="mt-8 space-y-8">
              <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-bla-text-muted">
                  Nieuwe sessie
                </h2>
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Bedrijf / klant (bijv. Sophista)"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-bla-lime"
                />
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Titel"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-bla-lime"
                />
                <input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Jouw naam"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-bla-lime"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Optioneel wachtwoord (voor klantsessies)"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-bla-lime"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void createSession()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-bla-lime px-4 py-3 text-sm font-semibold text-bla-dark disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" /> Start workshop
                </button>
              </section>

              <section className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-bla-text-muted">
                  Join sessie
                </h2>
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Sessiecode"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-bla-lime"
                />
                <input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Jouw naam"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none focus:border-bla-lime"
                />
                <button
                  type="button"
                  disabled={busy || !joinCode.trim()}
                  onClick={() => void joinSession()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-bla-lime/40 px-4 py-3 text-sm font-semibold text-bla-lime disabled:opacity-50"
                >
                  Join
                </button>
              </section>
            </div>
          )}

          {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-bla-dark text-bla-white">
      <header className="z-20 shrink-0 border-b border-white/10 bg-bla-dark/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-bla-text-muted hover:text-bla-lime"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Hub
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold tracking-tight">
              {meta?.title || "Process workshop"}
              {meta?.company ? (
                <span className="ml-2 text-sm font-medium text-bla-lime">{meta.company}</span>
              ) : null}
            </p>
            <p className="truncate text-[11px] text-bla-text-muted">
              {sessionId}
              {!kv && " · dit device only (geen KV)"}
              {meta?.passwordProtected && " · beveiligd"}
            </p>
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setTab("intro")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                tab === "intro" ? "bg-bla-lime text-bla-dark" : "text-bla-text-muted hover:text-white"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" /> Intro
            </button>
            <button
              type="button"
              onClick={() => setTab("board")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                tab === "board" ? "bg-bla-lime text-bla-dark" : "text-bla-text-muted hover:text-white"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Bord
            </button>
            <button
              type="button"
              onClick={() => setTab("sketch")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                tab === "sketch" ? "bg-bla-lime text-bla-dark" : "text-bla-text-muted hover:text-white"
              }`}
            >
              <Pencil className="h-3.5 w-3.5" /> Schets
            </button>
          </div>

          <button
            type="button"
            onClick={() => void copyShare()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs text-bla-text-light hover:border-bla-lime/40"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-bla-lime" /> : <Share2 className="h-3.5 w-3.5" />}
            {copied ? "Gekopieerd" : "Deel"}
          </button>
          <button
            type="button"
            onClick={() => void loadSession(sessionId)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs text-bla-text-muted hover:text-white"
            title="Ververs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard.writeText(sessionId);
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            }}
            className="hidden items-center gap-1 rounded-xl border border-white/10 px-3 py-2 text-xs text-bla-text-muted sm:inline-flex"
          >
            <Copy className="h-3.5 w-3.5" /> Code
          </button>
        </div>
      </header>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div className={`h-full overflow-y-auto ${tab === "intro" ? "" : "hidden"}`}>
          <WorkshopIntroView
            intro={meta?.intro ?? createEmptyIntro()}
            author={author}
            onChange={saveIntro}
            onStartBoard={() => setTab("board")}
          />
        </div>

        <div className={`h-full overflow-x-auto ${tab === "board" ? "" : "hidden"}`}>
          <WorkshopBoard
            columns={[...WORKSHOP_COLUMNS]}
            cards={cards}
            author={author || "anon"}
            onAdd={addCard}
            onChange={(card) => upsertCard(card)}
            onDelete={(id) => void deleteCard(id)}
            onMove={(next) => void persistCards(next)}
          />
        </div>

        {/* Keep sketch mounted to avoid tldraw teardown / blank screen */}
        <div className={`absolute inset-0 ${tab === "sketch" ? "" : "pointer-events-none invisible"}`}>
          <WorkshopSketch
            sessionId={sessionId}
            initialSketch={sketch}
            onSave={(s) => void saveSketch(s)}
            active={tab === "sketch"}
          />
        </div>
      </div>
    </div>
  );
}
