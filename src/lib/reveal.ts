import "server-only";
import type { Wedding } from "@prisma/client";
import { db } from "./db";

/**
 * Server-authoritative reveal check. The ONLY clock consulted is the
 * server's; clients receive `msUntilReveal` computed here so their local
 * countdown can never unlock anything early.
 */
export function isRevealed(wedding: Pick<Wedding, "revealAt">): boolean {
  return Date.now() >= wedding.revealAt.getTime();
}

export async function ensureRevealMarked(
  wedding: Pick<Wedding, "id" | "revealAt" | "revealedAt">,
): Promise<void> {
  if (!wedding.revealedAt && isRevealed(wedding)) {
    await db.wedding
      .updateMany({
        where: { id: wedding.id, revealedAt: null },
        data: { revealedAt: new Date() },
      })
      .catch(() => {});
  }
}

export function msUntilReveal(wedding: Pick<Wedding, "revealAt">): number {
  return Math.max(0, wedding.revealAt.getTime() - Date.now());
}
