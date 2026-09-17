import { NextResponse } from "next/server";
import { createGuestSession, getGuestSession } from "@/lib/guest";
import { findWeddingBySlug } from "@/lib/wedding-api";
import { guestJoinSchema } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const ip = clientIp(req);
  if (!rateLimit(`join:${ip}`, 20, 10 * 60_000).ok) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  const wedding = await findWeddingBySlug(slug);
  if (!wedding) {
    return NextResponse.json({ error: "Wedding not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = guestJoinSchema.safeParse({ displayName: body.displayName ?? "" });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  // Reuse an existing session for this wedding when present.
  const existing = await getGuestSession(wedding.id);
  const session =
    existing ??
    (await createGuestSession(wedding.id, parsed.data.displayName, {
      ip,
      userAgent: req.headers.get("user-agent") ?? undefined,
    }));

  if (!existing) {
    await audit({
      actorType: "GUEST",
      actorId: session.id,
      weddingId: wedding.id,
      action: "guest.join",
      ip,
    });
  }

  return NextResponse.json({
    guest: { id: session.id, displayName: session.displayName },
  });
}
