import { NextRequest, NextResponse } from "next/server";
import { KV_READY, normalizeSessionId, redisCommand } from "@/lib/kv";
import { hashPassword, unlockToken, verifyPassword } from "@/lib/password";
import {
  applySketchPatch,
  createDefaultColumns,
  createEmptyMeta,
  isSketchPatchKey,
  normalizeColumns,
  publicMeta,
  sketchKeysPresent,
  type SketchPatchKey,
  type WorkshopCard,
  type WorkshopColumn,
  type WorkshopIntro,
  type WorkshopMeta,
  type WorkshopSession,
  type WorkshopSummary,
} from "@/lib/workshop-types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const TTL = 60 * 60 * 24 * 90; // 90 days
const KEY = (id: string) => `workshop:${normalizeSessionId(id)}`;

function noStore(data: unknown, init?: { status?: number }) {
  return NextResponse.json(data, {
    status: init?.status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
    },
  });
}

async function getRaw(sessionId: string): Promise<WorkshopSession | null> {
  const key = KEY(sessionId);
  const keyType = await redisCommand("TYPE", key);
  if (keyType !== "string" && keyType !== "hash") return null;
  // We store as JSON string for simplicity
  const raw = await redisCommand("GET", key);
  if (typeof raw !== "string") return null;
  try {
    return JSON.parse(raw) as WorkshopSession;
  } catch {
    return null;
  }
}

async function saveSession(sessionId: string, session: WorkshopSession): Promise<void> {
  const key = KEY(sessionId);
  session.rev = (session.rev ?? 0) + 1;
  session.meta.updatedAt = new Date().toISOString();
  await redisCommand("SET", key, JSON.stringify(session));
  await redisCommand("EXPIRE", key, String(TTL));
}

/** Re-read if another writer landed between load and save (workshop-scale CAS). */
async function mutateSession(
  sessionId: string,
  mutator: (session: WorkshopSession) => void
): Promise<WorkshopSession> {
  let session = (await getRaw(sessionId)) ?? emptySession();
  for (let attempt = 0; attempt < 5; attempt++) {
    const startRev = session.rev ?? 0;
    mutator(session);
    if (attempt < 4) {
      const latest = (await getRaw(sessionId)) ?? emptySession();
      if ((latest.rev ?? 0) !== startRev) {
        session = latest;
        continue;
      }
    }
    await saveSession(sessionId, session);
    return session;
  }
  return session;
}

function emptySession(partial?: Partial<WorkshopMeta>): WorkshopSession {
  return {
    meta: createEmptyMeta(partial),
    cards: [],
    columns: createDefaultColumns(),
    sketch: null,
  };
}

function clientPayload(session: WorkshopSession, unlocked: boolean) {
  return {
    meta: publicMeta(session.meta),
    cards: session.cards,
    columns: normalizeColumns(session.columns),
    sketch: session.sketch,
    rev: session.rev ?? 0,
    kv: true,
    unlocked,
    requiresPassword: session.meta.passwordProtected && !unlocked,
  };
}

function isUnlocked(req: NextRequest, sessionId: string, meta: WorkshopMeta): boolean {
  if (!meta.passwordProtected || !meta.passwordHash) return true;
  const token = req.cookies.get(`ws_unlock_${normalizeSessionId(sessionId)}`)?.value;
  if (!token) return false;
  return token === unlockToken(normalizeSessionId(sessionId), meta.passwordHash);
}

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  if (!KV_READY) {
    return noStore({
      meta: createEmptyMeta(),
      cards: [],
      columns: createDefaultColumns(),
      sketch: null,
      kv: false,
      unlocked: true,
      requiresPassword: false,
    });
  }

  try {
    const session = (await getRaw(params.sessionId)) ?? emptySession();
    const unlocked = isUnlocked(req, params.sessionId, session.meta);
    if (session.meta.passwordProtected && !unlocked) {
      return noStore({
        meta: publicMeta(session.meta),
        cards: [],
        columns: [],
        sketch: null,
        rev: session.rev ?? 0,
        kv: true,
        unlocked: false,
        requiresPassword: true,
      });
    }
    const since = req.nextUrl.searchParams.get("rev");
    const currentRev = typeof session.rev === "number" ? session.rev : null;
    if (
      since !== null &&
      currentRev !== null &&
      Number.isFinite(Number(since)) &&
      Number(since) === currentRev
    ) {
      return noStore({
        unchanged: true,
        rev: currentRev,
        kv: true,
        unlocked: true,
        requiresPassword: false,
      });
    }
    await redisCommand("EXPIRE", KEY(params.sessionId), String(TTL));
    return noStore(clientPayload(session, unlocked));
  } catch {
    return noStore({
      meta: createEmptyMeta(),
      cards: [],
      columns: createDefaultColumns(),
      sketch: null,
      kv: false,
      unlocked: true,
      requiresPassword: false,
    });
  }
}

type Body =
  | {
      action: "bootstrap";
      meta?: Partial<WorkshopMeta>;
      password?: string;
    }
  | {
      action: "unlock";
      password: string;
    }
  | {
      action: "update-meta";
      meta: Partial<WorkshopMeta>;
      password?: string | null;
    }
  | {
      action: "update-intro";
      intro: WorkshopIntro;
    }
  | {
      action: "upsert-card";
      card: WorkshopCard;
    }
  | {
      action: "delete-card";
      id: string;
    }
  | {
      action: "replace-cards";
      cards: WorkshopCard[];
    }
  | {
      action: "replace-columns";
      columns: WorkshopColumn[];
    }
  | {
      action: "save-sketch";
      sketch: unknown;
      touched?: SketchPatchKey[];
    }
  | {
      action: "update-summary";
      summary: WorkshopSummary;
    };

export async function PUT(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  if (!KV_READY) {
    return noStore({ ok: false, kv: false });
  }

  const body = (await req.json()) as Body;

  try {
    let session = (await getRaw(params.sessionId)) ?? emptySession();

    if (body.action === "unlock") {
      if (!session.meta.passwordProtected || !session.meta.passwordHash) {
        return noStore({ ok: true, unlocked: true, kv: true });
      }
      if (!verifyPassword(body.password, session.meta.passwordHash)) {
        return noStore({ ok: false, error: "Invalid password" }, { status: 401 });
      }
      const token = unlockToken(normalizeSessionId(params.sessionId), session.meta.passwordHash);
      const res = noStore({ ok: true, ...clientPayload(session, true) });
      res.cookies.set(`ws_unlock_${normalizeSessionId(params.sessionId)}`, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 14,
      });
      return res;
    }

    const unlocked = isUnlocked(req, params.sessionId, session.meta);
    if (session.meta.passwordProtected && !unlocked && body.action !== "bootstrap") {
      return noStore({ ok: false, error: "Locked" }, { status: 401 });
    }

    if (body.action === "bootstrap") {
      const existing = await getRaw(params.sessionId);
      if (existing && (existing.cards.length > 0 || existing.sketch || existing.meta.company)) {
        const u = isUnlocked(req, params.sessionId, existing.meta);
        return noStore({ ok: true, ...clientPayload(existing, u) });
      }
      const password = body.password?.trim();
      session = emptySession({
        ...body.meta,
        passwordProtected: Boolean(password),
        passwordHash: password ? hashPassword(password) : undefined,
      });
      await saveSession(params.sessionId, session);
      const res = noStore({ ok: true, ...clientPayload(session, true) });
      if (password && session.meta.passwordHash) {
        res.cookies.set(
          `ws_unlock_${normalizeSessionId(params.sessionId)}`,
          unlockToken(normalizeSessionId(params.sessionId), session.meta.passwordHash),
          {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 24 * 14,
          }
        );
      }
      return res;
    }

    if (body.action === "update-meta") {
      const nextPassword = body.password;
      const incomingIntro = body.meta.intro;
      session = await mutateSession(params.sessionId, (next) => {
        next.meta = {
          ...next.meta,
          ...body.meta,
          intro: incomingIntro ?? next.meta.intro,
          passwordHash: next.meta.passwordHash,
          passwordProtected: next.meta.passwordProtected,
        };
        if (nextPassword === null) {
          next.meta.passwordProtected = false;
          next.meta.passwordHash = undefined;
        } else if (typeof nextPassword === "string" && nextPassword.trim()) {
          next.meta.passwordProtected = true;
          next.meta.passwordHash = hashPassword(nextPassword.trim());
        }
      });
      return noStore({ ok: true, ...clientPayload(session, true) });
    }

    if (body.action === "update-intro") {
      session = await mutateSession(params.sessionId, (next) => {
        next.meta = {
          ...next.meta,
          intro: body.intro,
        };
      });
      return noStore({ ok: true, ...clientPayload(session, true) });
    }

    if (body.action === "upsert-card") {
      session = await mutateSession(params.sessionId, (next) => {
        const idx = next.cards.findIndex((c) => c.id === body.card.id);
        if (idx >= 0) next.cards[idx] = body.card;
        else next.cards.push(body.card);
      });
      return noStore({ ok: true, ...clientPayload(session, true) });
    }

    if (body.action === "delete-card") {
      session = await mutateSession(params.sessionId, (next) => {
        next.cards = next.cards.filter((c) => c.id !== body.id);
      });
      return noStore({ ok: true, ...clientPayload(session, true) });
    }

    if (body.action === "replace-cards") {
      session = await mutateSession(params.sessionId, (next) => {
        next.cards = body.cards;
      });
      return noStore({ ok: true, ...clientPayload(session, true) });
    }

    if (body.action === "replace-columns") {
      session = await mutateSession(params.sessionId, (next) => {
        next.columns = normalizeColumns(body.columns);
        const ids = new Set(next.columns.map((c) => c.id));
        next.cards = next.cards.filter((c) => ids.has(c.columnId));
      });
      return noStore({ ok: true, ...clientPayload(session, true) });
    }

    if (body.action === "save-sketch") {
      const incomingKeys = sketchKeysPresent(body.sketch);
      const touched = Array.isArray(body.touched)
        ? body.touched.filter(isSketchPatchKey)
        : incomingKeys;
      const keys = touched.length > 0 ? touched : incomingKeys;
      session = await mutateSession(params.sessionId, (next) => {
        next.sketch = applySketchPatch(next.sketch, body.sketch, keys);
      });
      return noStore({ ok: true, ...clientPayload(session, true) });
    }

    if (body.action === "update-summary") {
      session = await mutateSession(params.sessionId, (next) => {
        next.meta = {
          ...next.meta,
          summary: body.summary,
        };
      });
      return noStore({ ok: true, ...clientPayload(session, true) });
    }

    return noStore({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return noStore({ ok: false, error: message, kv: false }, { status: 500 });
  }
}
