import "server-only";
import { NextResponse } from "next/server";
import type { GuestSession, Wedding, WeddingSettings } from "@prisma/client";
import { db } from "./db";
import { getGuestSession } from "./guest";

export type WeddingWithSettings = Wedding & { settings: WeddingSettings | null };

export async function findWeddingBySlug(
  slug: string,
): Promise<WeddingWithSettings | null> {
  return db.wedding.findFirst({
    where: { slug, deletedAt: null },
    include: { settings: true },
  });
}

export async function requireGuestContext(slug: string): Promise<
  | { ok: true; wedding: WeddingWithSettings; guest: GuestSession }
  | { ok: false; response: NextResponse }
> {
  const wedding = await findWeddingBySlug(slug);
  if (!wedding) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Wedding not found" }, { status: 404 }),
    };
  }
  const guest = await getGuestSession(wedding.id);
  if (!guest) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Join the wedding first" }, { status: 401 }),
    };
  }
  return { ok: true, wedding, guest };
}
