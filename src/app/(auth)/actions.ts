"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/crypto";
import { createAuthSession, destroyAuthSession } from "@/lib/auth";
import { signupSchema, loginSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";

export type AuthFormState = { error?: string } | null;

async function requestMeta() {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  return {
    ip: fwd ? fwd.split(",")[0].trim() : (h.get("x-real-ip") ?? "unknown"),
    userAgent: h.get("user-agent") ?? undefined,
  };
}

export async function signupAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const meta = await requestMeta();
  if (!rateLimit(`signup:${meta.ip}`, 5, 15 * 60_000).ok) {
    return { error: "Too many attempts. Please try again in a few minutes." };
  }

  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const { name, email, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      subscriptions: { create: { plan: "FREE", status: "ACTIVE" } },
    },
  });

  await createAuthSession(user.id, meta);
  await audit({
    actorType: "USER",
    actorId: user.id,
    action: "user.signup",
    ip: meta.ip,
  });
  redirect("/dashboard");
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const meta = await requestMeta();
  if (!rateLimit(`login:${meta.ip}`, 10, 15 * 60_000).ok) {
    return { error: "Too many attempts. Please try again in a few minutes." };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const { email, password } = parsed.data;

  const user = await db.user.findUnique({ where: { email } });
  const valid =
    user && !user.deletedAt && (await verifyPassword(password, user.passwordHash));
  if (!valid) {
    return { error: "Incorrect email or password." };
  }

  await createAuthSession(user.id, meta);
  await audit({
    actorType: "USER",
    actorId: user.id,
    action: "user.login",
    ip: meta.ip,
  });
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await destroyAuthSession();
  redirect("/");
}
