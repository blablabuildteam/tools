/** Shared Redis / Vercel KV helpers (same store as blablabuild.com). */

export const KV_READY = Boolean(
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
);

/** Live Sophista board — older links used `sophista-workshop`. */
const SESSION_ALIASES: Record<string, string> = {
  "sophista-workshop": "sophista-dinsdag",
};

export async function redisCommand(...args: string[]): Promise<unknown> {
  const res = await fetch(process.env.KV_REST_API_URL!, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });
  const data = (await res.json()) as { result?: unknown; error?: string };
  if (data.error) throw new Error(data.error);
  return data.result;
}

export function normalizeSessionId(id: string): string {
  const n = id.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  return SESSION_ALIASES[n] ?? n;
}
