"use client";

import {
  BookOpen,
  Check,
  ClipboardCheck,
  LayoutGrid,
  Lock,
  Pencil,
  Plus,
  Share2,
  Sparkles,
  Unlock,
  ArrowLeft,
  User,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { nanoid } from "nanoid";
import {
  CARD_COLORS,
  createDefaultColumns,
  createEmptyIntro,
  createEmptySummary,
  normalizeColumns,
  type WorkshopCard,
  type WorkshopColumn,
  type WorkshopColumnId,
  type WorkshopMeta,
  type WorkshopSummary,
} from "@/lib/workshop-types";
import {
  fetchWorkshopSession,
  isEditingTextField,
  readWorkshopDisplayName,
  reportWorkshopSync,
  startWorkshopPoll,
  writeWorkshopDisplayName,
  type WorkshopClientPayload,
} from "@/lib/workshop-sync";
import WorkshopBoard from "@/components/workshop/WorkshopBoard";
import WorkshopSketch from "@/components/workshop/WorkshopSketch";
import WorkshopIntroView from "@/components/workshop/WorkshopIntroView";
import WorkshopSummaryView from "@/components/workshop/WorkshopSummaryView";
import WorkshopReferenceView from "@/components/workshop/WorkshopReferenceView";
import WorkshopSyncNotice from "@/components/workshop/WorkshopSyncNotice";
import { ViewEnter } from "@/components/workshop/ViewEnter";
import { BlablaLogo } from "@/components/BlablaLogo";

type Tab = "intro" | "sketch" | "board" | "reference" | "wrap";

type SessionPayload = WorkshopClientPayload;

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
  const [columns, setColumns] = useState<WorkshopColumn[]>(createDefaultColumns);
  const [sketch, setSketch] = useState<unknown | null>(null);
  const [sketchOpened, setSketchOpened] = useState(false);
  const [sketchGen, setSketchGen] = useState(0);
  const [kv, setKv] = useState(true);
  const [locked, setLocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const skipPoll = useRef(false);
  const sketchDirty = useRef(false);
  const summaryDirty = useRef(false);
  const columnsDirty = useRef(false);
  const tabRef = useRef<Tab>("intro");
  const boardRef = useRef<HTMLDivElement>(null);
  const revRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    tabRef.current = tab;
  }, [tab]);

  function openSketch() {
    sketchDirty.current = true;
    const fromKansen = tabRef.current === "reference";
    setSketchOpened(true);
    setTab("sketch");
    if (fromKansen) {
      window.setTimeout(() => setSketchGen((g) => g + 1), 500);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get("s");
    const name = (params.get("name") || readWorkshopDisplayName()).trim();
    if (name) {
      setAuthor(name);
      writeWorkshopDisplayName(name);
    }
    if (s) {
      setJoinCode(s);
      void joinSession(s);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (author.trim()) writeWorkshopDisplayName(author);
  }, [author]);

  const applyPayload = useCallback(
    (data: SessionPayload, opts?: { keepLocalSketch?: boolean; poll?: boolean }) => {
      if (data.unchanged) return;
      if (data.requiresPassword) {
        setLocked(true);
        return;
      }
      setLocked(false);
      setKv(Boolean(data.kv));

      const skipBoard = Boolean(
        opts?.poll &&
          (columnsDirty.current ||
            (tabRef.current === "board" &&
              Boolean(boardRef.current?.contains(document.activeElement)) &&
              isEditingTextField()))
      );
      const skipSummary = Boolean(
        opts?.poll && (summaryDirty.current || (tabRef.current === "wrap" && isEditingTextField()))
      );

      if (!skipBoard) {
        setCards(data.cards ?? []);
        setColumns(normalizeColumns(data.columns));
      }

      if (skipSummary) {
        setMeta((prev) => (prev ? { ...data.meta, summary: prev.summary } : data.meta));
      } else {
        setMeta(data.meta);
      }

      const prevRev = revRef.current;
      if (!skipBoard && !skipSummary) {
        if (typeof data.rev === "number") revRef.current = data.rev;
      }

      if (
        opts?.poll &&
        !skipBoard &&
        !skipSummary &&
        typeof data.rev === "number" &&
        data.rev !== prevRev
      ) {
        reportWorkshopSync("incoming");
      }

      if (opts?.keepLocalSketch || sketchDirty.current) return;
      if (!opts?.poll) setSketch(data.sketch ?? null);
    },
    []
  );

  const loadSession = useCallback(
    async (sid: string, opts?: { poll?: boolean }) => {
      const data = await fetchWorkshopSession(sid, opts?.poll ? { rev: revRef.current } : undefined);
      applyPayload(data, opts);
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
    return startWorkshopPoll({
      sessionId,
      getRev: () => revRef.current,
      shouldSkip: () => skipPoll.current,
      onPayload: (data) => applyPayload(data, { poll: true }),
    });
  }, [landing, sessionId, locked, applyPayload]);

  const columnsDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistColumns = useCallback(
    async (next: WorkshopColumn[]) => {
      if (columnsDebounce.current) clearTimeout(columnsDebounce.current);
      setColumns(next);
      if (!sessionId) return;
      skipPoll.current = true;
      columnsDirty.current = true;
      reportWorkshopSync("saving");
      try {
        const res = await fetch(`/api/workshop-sessions/${sessionId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "replace-columns", columns: next }),
        });
        const data = (await res.json()) as SessionPayload;
        if (typeof data.rev === "number") revRef.current = data.rev;
      } finally {
        setTimeout(() => {
          skipPoll.current = false;
          columnsDirty.current = false;
        }, 800);
      }
    },
    [sessionId]
  );

  const onChangeColumn = useCallback(
    (column: WorkshopColumn) => {
      columnsDirty.current = true;
      setColumns((prev) => {
        const next = prev.map((c) => (c.id === column.id ? column : c));
        if (columnsDebounce.current) clearTimeout(columnsDebounce.current);
        columnsDebounce.current = setTimeout(() => {
          void persistColumns(next);
        }, 450);
        return next;
      });
    },
    [persistColumns]
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
        reportWorkshopSync("saving");
        void fetch(`/api/workshop-sessions/${sessionId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "upsert-card", card }),
        })
          .then(async (res) => {
            const data = (await res.json()) as SessionPayload;
            if (typeof data.rev === "number") revRef.current = data.rev;
          })
          .finally(() => {
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
      reportWorkshopSync("saving");
      try {
        const res = await fetch(`/api/workshop-sessions/${sessionId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete-card", id }),
        });
        const data = (await res.json()) as SessionPayload;
        if (typeof data.rev === "number") revRef.current = data.rev;
      } finally {
        setTimeout(() => {
          skipPoll.current = false;
        }, 800);
      }
    },
    [cards, sessionId]
  );

  const saveSummary = useCallback(
    (summary: WorkshopSummary) => {
      setMeta((prev) => (prev ? { ...prev, summary } : prev));
      if (!sessionId) return;
      skipPoll.current = true;
      summaryDirty.current = true;
      reportWorkshopSync("saving");
      void fetch(`/api/workshop-sessions/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update-summary", summary }),
      })
        .then(async (res) => {
          const data = (await res.json()) as SessionPayload;
          if (typeof data.rev === "number") revRef.current = data.rev;
        })
        .finally(() => {
          setTimeout(() => {
            skipPoll.current = false;
            summaryDirty.current = false;
          }, 800);
        });
    },
    [sessionId]
  );

  const summaryDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSummaryChange = useCallback(
    (summary: WorkshopSummary) => {
      summaryDirty.current = true;
      setMeta((prev) => (prev ? { ...prev, summary } : prev));
      if (summaryDebounce.current) clearTimeout(summaryDebounce.current);
      summaryDebounce.current = setTimeout(() => saveSummary(summary), 500);
    },
    [saveSummary]
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
    const accent = columns.find((c) => c.id === columnId)?.color ?? CARD_COLORS[0];
    const card: WorkshopCard = {
      id: nanoid(10),
      columnId,
      title: "",
      body: "",
      author: author.trim() || readWorkshopDisplayName() || "anon",
      votes: [],
      color: accent,
      order: inCol.length,
      createdAt: now,
      updatedAt: now,
    };
    upsertCard(card, { immediate: true });
  }

  function addColumn() {
    const col: WorkshopColumn = {
      id: nanoid(10),
      title: "",
      hint: "",
      color: CARD_COLORS[columns.length % CARD_COLORS.length],
      order: columns.length,
    };
    void persistColumns([...columns, col]);
  }

  function deleteColumn(id: WorkshopColumnId) {
    const next = columns
      .filter((c) => c.id !== id)
      .map((c, i) => ({ ...c, order: i }));
    setCards((prev) => prev.filter((c) => c.columnId !== id));
    void persistColumns(next);
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
          {!kv && landing && (
            <p className="mt-3 text-xs text-amber-200/80">Let op: KV niet beschikbaar — sessies blijven lokaal.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden overscroll-none bg-[#0f1419] text-bla-white">
      <header className="z-30 shrink-0 border-b border-white/[0.07] bg-[#0f1419]/90 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-3 py-2.5 sm:gap-4 sm:px-5">
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2.5 rounded-xl pr-1 transition hover:opacity-90"
            title="Terug naar hub"
          >
            <BlablaLogo className="h-7 w-7" />
            <span className="hidden text-[11px] font-medium text-white/35 group-hover:text-white/55 sm:inline">
              Hub
            </span>
          </Link>

          <div className="hidden h-6 w-px bg-white/10 sm:block" />

          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold tracking-tight text-white">
              {meta?.company || meta?.title || "Process workshop"}
            </p>
            <p className="truncate font-mono text-[10px] text-white/30">
              {meta?.title && meta?.company ? meta.title : sessionId}
            </p>
          </div>

          <nav className="flex max-w-[min(100%,420px)] items-center overflow-x-auto rounded-full bg-white/[0.04] p-1 ring-1 ring-white/10 sm:max-w-none">
            {(
              [
                { id: "intro" as const, label: "Intro", icon: BookOpen },
                { id: "sketch" as const, label: "Schets", icon: Pencil },
                { id: "board" as const, label: "Notities", icon: LayoutGrid },
                { id: "reference" as const, label: "AI-kansen", icon: Sparkles },
                { id: "wrap" as const, label: "Afronding", icon: ClipboardCheck },
              ] as const
            ).map(({ id, label, icon: Icon }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => (id === "sketch" ? openSketch() : setTab(id))}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-medium transition sm:px-3 ${
                    active
                      ? "bg-[#ceff00] text-[#151f28] shadow-sm"
                      : "text-white/45 hover:text-white"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">{label}</span>
                </button>
              );
            })}
          </nav>

          <label className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-white/[0.04] px-2.5 py-1.5 ring-1 ring-white/10 sm:px-3">
            <User className="h-3.5 w-3.5 shrink-0 text-white/35" />
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Jouw naam"
              aria-label="Jouw naam"
              className="w-[6.5rem] bg-transparent text-[11px] text-white/80 outline-none placeholder:text-white/30 sm:w-[7.5rem]"
            />
          </label>

          <button
            type="button"
            onClick={() => void copyShare()}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.04] px-3 py-1.5 text-[11px] text-white/70 ring-1 ring-white/10 transition hover:bg-white/[0.08] hover:text-white"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-[#ceff00]" /> : <Share2 className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{copied ? "Link gekopieerd" : "Deel"}</span>
          </button>
        </div>
      </header>

      <div className="relative min-h-0 flex-1 overflow-hidden bg-[#0f1419]">
        <ViewEnter active={tab === "intro"} className="h-full overflow-y-auto">
          <WorkshopIntroView
            intro={meta?.intro ?? createEmptyIntro()}
            onContinue={openSketch}
          />
        </ViewEnter>

        <ViewEnter active={tab === "board"} className="h-full overflow-x-auto">
          <div ref={boardRef} className="h-full">
          <div data-view-item className="border-b border-white/8 px-5 py-3 sm:px-6">
            <p className="text-sm font-semibold text-white">Notities naast de schets</p>
            <p className="text-[12px] text-white/40">
              Vrije secties — titel en beschrijving kun je zelf invullen.
            </p>
          </div>
          <WorkshopBoard
            columns={columns}
            cards={cards.filter((c) => columns.some((col) => col.id === c.columnId))}
            author={author.trim() || readWorkshopDisplayName() || "anon"}
            active={tab === "board"}
            onAdd={addCard}
            onChange={(card) => upsertCard(card)}
            onDelete={(id) => void deleteCard(id)}
            onChangeColumn={onChangeColumn}
            onAddColumn={addColumn}
            onDeleteColumn={deleteColumn}
          />
          </div>
        </ViewEnter>

        <ViewEnter active={tab === "reference"} className="h-full overflow-y-auto">
          <WorkshopReferenceView sessionId={sessionId} active={tab === "reference"} />
        </ViewEnter>

        <ViewEnter active={tab === "wrap"} className="h-full overflow-y-auto">
          <WorkshopSummaryView
            summary={meta?.summary ?? createEmptySummary()}
            onChange={onSummaryChange}
          />
        </ViewEnter>

        {sketchOpened && (
          <div
            className={
              tab === "sketch"
                ? "absolute inset-0 z-10"
                : "pointer-events-none invisible absolute inset-0 z-0"
            }
            aria-hidden={tab !== "sketch"}
          >
            <WorkshopSketch
              key={sketchGen}
              sessionId={sessionId}
              active={tab === "sketch"}
              reloadToken={sketchGen}
            />
          </div>
        )}
      </div>
      {tab !== "sketch" ? <WorkshopSyncNotice variant="dark" corner="bottom-right" /> : null}
    </div>
  );
}
