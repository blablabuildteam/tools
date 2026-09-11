import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';

const KEY = (id: string) => `ai-matrix:${id.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`;
const TTL = 60 * 60 * 24 * 90; // 90 days — workshop boards need to outlive the follow-up window
/** Reserved hash field — not a use case */
const META_FIELD = '__prioritize_meta__';

const KV_READY = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
);

type UseCaseRecord = { id: string; [key: string]: unknown };
type SessionMeta = Record<string, unknown>;

async function redisCommand(...args: string[]): Promise<unknown> {
  const res = await fetch(process.env.KV_REST_API_URL!, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  });
  const data = (await res.json()) as { result?: unknown; error?: string };
  if (data.error) throw new Error(data.error);
  return data.result;
}

function parseHashEntries(entries: unknown): { useCases: UseCaseRecord[]; meta: SessionMeta | null } {
  if (!Array.isArray(entries) || entries.length === 0) return { useCases: [], meta: null };
  const useCases: UseCaseRecord[] = [];
  let meta: SessionMeta | null = null;
  for (let i = 0; i < entries.length; i += 2) {
    const field = entries[i];
    const raw = entries[i + 1];
    if (typeof raw !== 'string') continue;
    if (field === META_FIELD) {
      try {
        meta = JSON.parse(raw) as SessionMeta;
      } catch {
        meta = null;
      }
      continue;
    }
    try {
      useCases.push(JSON.parse(raw) as UseCaseRecord);
    } catch {
      // skip malformed
    }
  }
  return { useCases, meta };
}

async function getSession(key: string): Promise<{ useCases: UseCaseRecord[]; meta: SessionMeta | null }> {
  const keyType = await redisCommand('TYPE', key);
  if (keyType === 'hash') {
    return parseHashEntries(await redisCommand('HGETALL', key));
  }
  if (keyType === 'string') {
    const data = await kv.get<UseCaseRecord[]>(key);
    return { useCases: data ?? [], meta: null };
  }
  return { useCases: [], meta: null };
}

async function getUseCases(key: string): Promise<UseCaseRecord[]> {
  return (await getSession(key)).useCases;
}

async function saveMeta(key: string, meta: SessionMeta): Promise<SessionMeta> {
  const { meta: prev } = await getSession(key);
  // Top-level merge so checklist/decisions don't wipe clusters (and vice versa)
  const merged: SessionMeta = { ...(prev || {}), ...meta };
  await redisCommand('HSET', key, META_FIELD, JSON.stringify(merged));
  await redisCommand('EXPIRE', key, String(TTL));
  return merged;
}

async function saveUseCase(key: string, useCase: UseCaseRecord): Promise<UseCaseRecord[]> {
  // New submissions: lock v1 immediately to the submitted copy
  const locked = ensureFrozen(useCase);
  await redisCommand('HSET', key, String(locked.id), JSON.stringify(locked));
  await redisCommand('EXPIRE', key, String(TTL));
  return getUseCases(key);
}

async function removeUseCase(key: string, id: string): Promise<UseCaseRecord[]> {
  await redisCommand('HDEL', key, id);
  await redisCommand('EXPIRE', key, String(TTL));
  return getUseCases(key);
}

function ensureFrozen(prev: UseCaseRecord): UseCaseRecord {
  if (prev.originalInput && typeof prev.originalInput === 'object') return prev;
  return {
    ...prev,
    originalInput: {
      name: String(prev.name ?? ''),
      description: String(prev.description ?? ''),
      solution: prev.solution ? String(prev.solution) : undefined,
      label: prev.label ? String(prev.label) : undefined,
      knockout: prev.knockout,
      scores: prev.scores,
      savedAt: new Date().toISOString(),
    },
  };
}

/**
 * Merge an update onto a use case.
 * - Locks workshop v1 into originalInput on first write
 * - Never lets a client patch overwrite / clear originalInput
 */
function mergeUseCase(prev: UseCaseRecord, patch: UseCaseRecord): UseCaseRecord {
  const base = ensureFrozen(prev);
  const { originalInput: _ignored, id: _id, ...safePatch } = patch;
  return {
    ...base,
    ...safePatch,
    id: String(prev.id),
    originalInput: base.originalInput,
  };
}

function freezeOriginalIfNeeded(prev: UseCaseRecord, next: UseCaseRecord): UseCaseRecord {
  return mergeUseCase(prev, next);
}

async function updateUseCase(key: string, useCase: UseCaseRecord): Promise<UseCaseRecord[]> {
  const existing = await getUseCases(key);
  const prev = existing.find((uc) => uc.id === useCase.id);
  if (!prev) throw new Error('Not found');
  const merged = mergeUseCase(prev, useCase);
  await redisCommand('HSET', key, useCase.id, JSON.stringify(merged));
  await redisCommand('EXPIRE', key, String(TTL));
  return getUseCases(key);
}

/** Freeze workshop v1 for any case that still lacks originalInput. */
async function freezeMissingOriginals(
  key: string,
  useCases: UseCaseRecord[]
): Promise<UseCaseRecord[]> {
  let changed = false;
  const next = useCases.map((uc) => {
    if (uc.originalInput && typeof uc.originalInput === 'object') return uc;
    changed = true;
    return ensureFrozen(uc);
  });
  if (!changed) return useCases;
  for (const uc of next) {
    if (!useCases.find((u) => u.id === uc.id)?.originalInput) {
      await redisCommand('HSET', key, String(uc.id), JSON.stringify(uc));
    }
  }
  await redisCommand('EXPIRE', key, String(TTL));
  return next;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  if (!KV_READY) {
    return NextResponse.json({ useCases: [], meta: null, kv: false });
  }
  try {
    const key = KEY(params.sessionId);
    const session = await getSession(key);
    let { useCases, meta } = session;
    if (useCases.length > 0) {
      useCases = await freezeMissingOriginals(key, useCases);
      await redisCommand('EXPIRE', key, String(TTL));
    } else if (meta) {
      await redisCommand('EXPIRE', key, String(TTL));
    }
    return NextResponse.json({ useCases, meta, kv: true });
  } catch {
    return NextResponse.json({ useCases: [], meta: null, kv: false });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const useCase = (await req.json()) as UseCaseRecord;
  if (!KV_READY) {
    return NextResponse.json({ ok: false, kv: false });
  }
  try {
    const useCases = await saveUseCase(KEY(params.sessionId), useCase);
    return NextResponse.json({ ok: true, kv: true, useCases });
  } catch {
    return NextResponse.json({ ok: false, kv: false });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  if (!KV_READY) {
    return NextResponse.json({ ok: false, kv: false });
  }

  const body = (await req.json()) as
    | UseCaseRecord
    | {
        action: 'reorder';
        items: { id: string; priorityRank: number }[];
      }
    | {
        action: 'batch';
        items: UseCaseRecord[];
      }
    | {
        action: 'meta';
        meta: SessionMeta;
      };

  try {
    const key = KEY(params.sessionId);

    if (body && typeof body === 'object' && 'action' in body && body.action === 'meta') {
      const incoming =
        body.meta && typeof body.meta === 'object' ? (body.meta as SessionMeta) : ({} as SessionMeta);
      const meta = await saveMeta(key, incoming);
      const { useCases } = await getSession(key);
      return NextResponse.json({ ok: true, kv: true, meta, useCases });
    }

    if (
      body &&
      typeof body === 'object' &&
      'action' in body &&
      body.action === 'reorder' &&
      Array.isArray(body.items)
    ) {
      const existing = await getUseCases(key);
      const byId = new Map(existing.map((uc) => [uc.id, uc]));
      for (const item of body.items) {
        const prev = byId.get(item.id);
        if (!prev) continue;
        const next = { ...prev, priorityRank: item.priorityRank };
        byId.set(item.id, next);
        await redisCommand('HSET', key, item.id, JSON.stringify(next));
      }
      await redisCommand('EXPIRE', key, String(TTL));
      return NextResponse.json({ ok: true, kv: true, useCases: Array.from(byId.values()) });
    }

    if (
      body &&
      typeof body === 'object' &&
      'action' in body &&
      body.action === 'batch' &&
      Array.isArray(body.items)
    ) {
      const existing = await getUseCases(key);
      const byId = new Map(existing.map((uc) => [uc.id, uc]));
      for (const patch of body.items) {
        if (!patch?.id) continue;
        const prev = byId.get(String(patch.id));
        if (!prev) continue;
        const merged = freezeOriginalIfNeeded(prev, { ...prev, ...patch, id: String(patch.id) });
        byId.set(String(patch.id), merged);
        await redisCommand('HSET', key, String(patch.id), JSON.stringify(merged));
      }
      await redisCommand('EXPIRE', key, String(TTL));
      return NextResponse.json({ ok: true, kv: true, useCases: Array.from(byId.values()) });
    }

    const useCase = body as UseCaseRecord;
    const useCases = await updateUseCase(key, useCase);
    return NextResponse.json({ ok: true, kv: true, useCases });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update';
    if (message === 'Not found') {
      return NextResponse.json({ ok: false, error: 'Not found', kv: true }, { status: 404 });
    }
    return NextResponse.json({ ok: false, kv: false });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const { id } = (await req.json()) as { id: string };
  if (!KV_READY) {
    return NextResponse.json({ ok: false, kv: false });
  }
  try {
    const useCases = await removeUseCase(KEY(params.sessionId), id);
    return NextResponse.json({ ok: true, kv: true, useCases });
  } catch {
    return NextResponse.json({ ok: false, kv: false });
  }
}
