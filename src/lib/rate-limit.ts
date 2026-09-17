/**
 * Lightweight in-memory sliding-window rate limiter.
 * Suitable for a single-node deployment; swap the store for Redis when
 * scaling horizontally (the call-sites won't change).
 */

type Bucket = number[];

const buckets = new Map<string, Bucket>();

let lastSweep = Date.now();
function sweep(windowMs: number) {
  const now = Date.now();
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, hits] of buckets) {
    const fresh = hits.filter((t) => now - t < windowMs);
    if (fresh.length === 0) buckets.delete(key);
    else buckets.set(key, fresh);
  }
}

export function rateLimit(
  key: string,
  max: number,
  windowMs: number,
): { ok: boolean; retryAfterSeconds: number } {
  sweep(windowMs);
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    const oldest = hits[0];
    return {
      ok: false,
      retryAfterSeconds: Math.ceil((oldest + windowMs - now) / 1000),
    };
  }
  hits.push(now);
  buckets.set(key, hits);
  return { ok: true, retryAfterSeconds: 0 };
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
