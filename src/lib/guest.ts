import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import type { GuestSession } from "@prisma/client";
import { db } from "./db";
import { generateToken, hashToken } from "./crypto";

// One cookie per wedding so a guest can attend multiple weddings.
function cookieName(weddingId: string) {
  return `ea_guest_${weddingId.replaceAll("-", "")}`;
}

export async function createGuestSession(
  weddingId: string,
  displayName: string,
  meta?: { ip?: string; userAgent?: string },
): Promise<GuestSession> {
  const token = generateToken();
  const session = await db.guestSession.create({
    data: {
      weddingId,
      displayName,
      tokenHash: hashToken(token),
      ip: meta?.ip,
      userAgent: meta?.userAgent?.slice(0, 255),
    },
  });
  const jar = await cookies();
  jar.set(cookieName(weddingId), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 90 * 24 * 60 * 60, // 90 days — outlives the reveal
  });
  return session;
}

/**
 * Resolves the guest session for a specific wedding. The token itself is
 * scoped to a wedding row, so a stolen/forged cookie can never cross over
 * to a different wedding's data.
 */
export const getGuestSession = cache(
  async (weddingId: string): Promise<GuestSession | null> => {
    const jar = await cookies();
    const token = jar.get(cookieName(weddingId))?.value;
    if (!token) return null;
    const session = await db.guestSession.findUnique({
      where: { tokenHash: hashToken(token) },
    });
    if (!session || session.revoked || session.weddingId !== weddingId) {
      return null;
    }
    // touch lastSeenAt at most once a minute to avoid write amplification
    if (Date.now() - session.lastSeenAt.getTime() > 60_000) {
      await db.guestSession
        .update({
          where: { id: session.id },
          data: { lastSeenAt: new Date() },
        })
        .catch(() => {});
    }
    return session;
  },
);
