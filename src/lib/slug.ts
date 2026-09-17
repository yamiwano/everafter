import { randomBytes } from "node:crypto";

/**
 * Wedding URL slug: readable prefix from the couple names plus an
 * unguessable random suffix, e.g. "ava-and-noah-x7k2mq9d".
 * The suffix means enumeration/guessing other weddings is infeasible.
 */
export function generateWeddingSlug(coupleNames: string): string {
  const base = coupleNames
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const suffix = randomBytes(5).toString("base64url").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || randomBytes(4).toString("hex");
  return `${base || "event"}-${suffix}`;
}
