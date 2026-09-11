import { createHash, randomBytes, timingSafeEqual } from "crypto";

export function hashPassword(password: string, salt?: string): string {
  const s = salt ?? randomBytes(16).toString("hex");
  const hash = createHash("sha256").update(`${s}:${password}`).digest("hex");
  return `${s}.${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(".");
  if (!salt || !hash) return false;
  const next = hashPassword(password, salt);
  const a = Buffer.from(next);
  const b = Buffer.from(stored);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function unlockToken(sessionId: string, passwordHash: string): string {
  return createHash("sha256")
    .update(`unlock:${sessionId}:${passwordHash}`)
    .digest("hex");
}
