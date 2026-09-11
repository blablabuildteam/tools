import { NextRequest, NextResponse } from "next/server";
import { KV_READY, normalizeSessionId, redisCommand } from "@/lib/kv";
import { hashPassword, unlockToken, verifyPassword } from "@/lib/password";
import {
  createEmptyMeta,
  publicMeta,
  type WorkshopCard,
  type WorkshopIntro,
  type WorkshopMeta,
  type WorkshopSession,
} from "@/lib/workshop-types";

const TTL = 60 * 60 * 24 * 90; // 90 days
const KEY = (id: string) => `workshop:${normalizeSessionId(id)}`;

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
  session.meta.updatedAt = new Date().toISOString();
  await redisCommand("SET", key, JSON.stringify(session));
  await redisCommand("EXPIRE", key, String(TTL));
}

function emptySession(partial?: Partial<WorkshopMeta>): WorkshopSession {
  return {
    meta: createEmptyMeta(partial),
    cards: [],
    sketch: null,
  };
}

function clientPayload(session: WorkshopSession, unlocked: boolean) {
  return {
    meta: publicMeta(session.meta),
    cards: session.cards,
    sketch: session.sketch,
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
    return NextResponse.json({
      meta: createEmptyMeta(),
      cards: [],
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
      return NextResponse.json({
        meta: publicMeta(session.meta),
        cards: [],
        sketch: null,
        kv: true,
        unlocked: false,
        requiresPassword: true,
      });
    }
    await redisCommand("EXPIRE", KEY(params.sessionId), String(TTL));
    return NextResponse.json(clientPayload(session, unlocked));
  } catch {
    return NextResponse.json({
      meta: createEmptyMeta(),
      cards: [],
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
      action: "save-sketch";
      sketch: unknown;
    };

export async function PUT(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  if (!KV_READY) {
    return NextResponse.json({ ok: false, kv: false });
  }

  const body = (await req.json()) as Body;

  try {
    let session = (await getRaw(params.sessionId)) ?? emptySession();

    if (body.action === "unlock") {
      if (!session.meta.passwordProtected || !session.meta.passwordHash) {
        return NextResponse.json({ ok: true, unlocked: true, kv: true });
      }
      if (!verifyPassword(body.password, session.meta.passwordHash)) {
        return NextResponse.json({ ok: false, error: "Invalid password" }, { status: 401 });
      }
      const token = unlockToken(normalizeSessionId(params.sessionId), session.meta.passwordHash);
      const res = NextResponse.json({ ok: true, ...clientPayload(session, true) });
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
      return NextResponse.json({ ok: false, error: "Locked" }, { status: 401 });
    }

    if (body.action === "bootstrap") {
      const existing = await getRaw(params.sessionId);
      if (existing && (existing.cards.length > 0 || existing.sketch || existing.meta.company)) {
        const u = isUnlocked(req, params.sessionId, existing.meta);
        return NextResponse.json({ ok: true, ...clientPayload(existing, u) });
      }
      const password = body.password?.trim();
      session = emptySession({
        ...body.meta,
        passwordProtected: Boolean(password),
        passwordHash: password ? hashPassword(password) : undefined,
      });
      await saveSession(params.sessionId, session);
      const res = NextResponse.json({ ok: true, ...clientPayload(session, true) });
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
      session.meta = {
        ...session.meta,
        ...body.meta,
        intro: incomingIntro ?? session.meta.intro,
        passwordHash: session.meta.passwordHash,
        passwordProtected: session.meta.passwordProtected,
      };
      if (nextPassword === null) {
        session.meta.passwordProtected = false;
        session.meta.passwordHash = undefined;
      } else if (typeof nextPassword === "string" && nextPassword.trim()) {
        session.meta.passwordProtected = true;
        session.meta.passwordHash = hashPassword(nextPassword.trim());
      }
      await saveSession(params.sessionId, session);
      return NextResponse.json({ ok: true, ...clientPayload(session, true) });
    }

    if (body.action === "update-intro") {
      session.meta = {
        ...session.meta,
        intro: body.intro,
      };
      await saveSession(params.sessionId, session);
      return NextResponse.json({ ok: true, ...clientPayload(session, true) });
    }

    if (body.action === "upsert-card") {
      const idx = session.cards.findIndex((c) => c.id === body.card.id);
      if (idx >= 0) session.cards[idx] = body.card;
      else session.cards.push(body.card);
      await saveSession(params.sessionId, session);
      return NextResponse.json({ ok: true, ...clientPayload(session, true) });
    }

    if (body.action === "delete-card") {
      session.cards = session.cards.filter((c) => c.id !== body.id);
      await saveSession(params.sessionId, session);
      return NextResponse.json({ ok: true, ...clientPayload(session, true) });
    }

    if (body.action === "replace-cards") {
      session.cards = body.cards;
      await saveSession(params.sessionId, session);
      return NextResponse.json({ ok: true, ...clientPayload(session, true) });
    }

    if (body.action === "save-sketch") {
      session.sketch = body.sketch;
      await saveSession(params.sessionId, session);
      return NextResponse.json({ ok: true, ...clientPayload(session, true) });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ ok: false, error: message, kv: false }, { status: 500 });
  }
}
