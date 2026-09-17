import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import type { User } from "@prisma/client";
import { db } from "./db";
import { generateToken, hashToken } from "./crypto";

const SESSION_COOKIE = "ea_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function createAuthSession(
  userId: string,
  meta?: { ip?: string; userAgent?: string },
): Promise<void> {
  const token = generateToken();
  await db.authSession.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      ip: meta?.ip,
      userAgent: meta?.userAgent?.slice(0, 255),
    },
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.authSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date() || session.user.deletedAt) {
    return null;
  }
  return session.user;
});

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function destroyAuthSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.authSession
      .deleteMany({ where: { tokenHash: hashToken(token) } })
      .catch(() => {});
  }
  jar.delete(SESSION_COOKIE);
}

/**
 * Multi-tenant guard: returns the wedding only if the user is a member.
 * Every host-facing query MUST go through this (or an equivalent
 * membership check) so weddings are isolated between accounts.
 */
export async function requireWeddingAccess(weddingId: string, userId: string) {
  const membership = await db.weddingMember.findUnique({
    where: { weddingId_userId: { weddingId, userId } },
    include: { wedding: { include: { settings: true } } },
  });
  if (!membership || membership.wedding.deletedAt) throw new Error("FORBIDDEN");
  return membership;
}
