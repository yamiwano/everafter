"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser, requireWeddingAccess } from "@/lib/auth";
import { createWeddingSchema, updateWeddingSchema } from "@/lib/validation";
import { zonedTimeToUtc } from "@/lib/timezone";
import { generateWeddingSlug } from "@/lib/slug";
import { audit } from "@/lib/audit";
import { storage } from "@/lib/storage";

export type FormState = { error?: string; success?: boolean } | null;

export async function createWeddingAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");

  const parsed = createWeddingSchema.safeParse({
    coupleNames: formData.get("coupleNames"),
    weddingDate: formData.get("weddingDate"),
    location: formData.get("location"),
    timezone: formData.get("timezone"),
    revealDate: formData.get("revealDate"),
    revealTime: formData.get("revealTime"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const data = parsed.data;

  const revealAt = zonedTimeToUtc(data.revealDate, data.revealTime, data.timezone);
  if (revealAt.getTime() <= Date.now()) {
    return { error: "The reveal time must be in the future." };
  }

  const wedding = await db.wedding.create({
    data: {
      slug: generateWeddingSlug(data.coupleNames),
      coupleNames: data.coupleNames,
      weddingDate: new Date(`${data.weddingDate}T00:00:00Z`),
      location: data.location,
      timezone: data.timezone,
      revealAt,
      members: { create: { userId: user.id, role: "OWNER" } },
      settings: { create: {} },
    },
  });

  await audit({
    actorType: "USER",
    actorId: user.id,
    weddingId: wedding.id,
    action: "wedding.create",
  });
  redirect(`/dashboard/weddings/${wedding.id}`);
}

export async function updateWeddingAction(
  weddingId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  const membership = await requireWeddingAccess(weddingId, user.id);

  const parsed = updateWeddingSchema.safeParse({
    coupleNames: formData.get("coupleNames") ?? undefined,
    weddingDate: formData.get("weddingDate") ?? undefined,
    location: formData.get("location") ?? undefined,
    timezone: formData.get("timezone") ?? undefined,
    revealDate: formData.get("revealDate") ?? undefined,
    revealTime: formData.get("revealTime") ?? undefined,
    moderationEnabled: formData.has("moderationEnabled")
      ? formData.get("moderationEnabled") === "on"
      : undefined,
    showAttribution: formData.has("showAttribution")
      ? formData.get("showAttribution") === "on"
      : undefined,
    allowGuestDownloads: formData.has("allowGuestDownloads")
      ? formData.get("allowGuestDownloads") === "on"
      : undefined,
    welcomeMessage: formData.has("welcomeMessage")
      ? String(formData.get("welcomeMessage") ?? "")
      : undefined,
    maxPhotosPerGuest: formData.has("maxPhotosPerGuest")
      ? formData.get("maxPhotosPerGuest")
      : undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const data = parsed.data;
  const wedding = membership.wedding;

  const weddingUpdate: Record<string, unknown> = {};
  if (data.coupleNames) weddingUpdate.coupleNames = data.coupleNames;
  if (data.location) weddingUpdate.location = data.location;
  if (data.weddingDate) {
    weddingUpdate.weddingDate = new Date(`${data.weddingDate}T00:00:00Z`);
  }

  const timezone = data.timezone ?? wedding.timezone;
  if (data.timezone) weddingUpdate.timezone = timezone;

  if (data.revealDate && data.revealTime) {
    if (wedding.revealedAt) {
      return { error: "The gallery has already been revealed — the reveal time can no longer change." };
    }
    const revealAt = zonedTimeToUtc(data.revealDate, data.revealTime, timezone);
    if (revealAt.getTime() <= Date.now()) {
      return { error: "The reveal time must be in the future." };
    }
    weddingUpdate.revealAt = revealAt;
  }

  const settingsUpdate: Record<string, unknown> = {};
  if (data.moderationEnabled !== undefined) settingsUpdate.moderationEnabled = data.moderationEnabled;
  if (data.showAttribution !== undefined) settingsUpdate.showAttribution = data.showAttribution;
  if (data.allowGuestDownloads !== undefined) settingsUpdate.allowGuestDownloads = data.allowGuestDownloads;
  if (data.welcomeMessage !== undefined) settingsUpdate.welcomeMessage = data.welcomeMessage || null;
  if (data.maxPhotosPerGuest !== undefined) settingsUpdate.maxPhotosPerGuest = data.maxPhotosPerGuest;

  await db.wedding.update({
    where: { id: weddingId },
    data: {
      ...weddingUpdate,
      ...(Object.keys(settingsUpdate).length > 0
        ? { settings: { update: settingsUpdate } }
        : {}),
    },
  });

  await audit({
    actorType: "USER",
    actorId: user.id,
    weddingId,
    action: "wedding.update",
  });
  revalidatePath(`/dashboard/weddings/${weddingId}`);
  return { success: true };
}

export async function setPhotoStatusAction(
  weddingId: string,
  photoId: string,
  status: "APPROVED" | "REJECTED",
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  await requireWeddingAccess(weddingId, user.id);

  // weddingId in the where clause enforces tenant isolation even if the
  // photoId belongs to another wedding.
  await db.photo.updateMany({
    where: { id: photoId, weddingId, deletedAt: null },
    data: { status },
  });
  await audit({
    actorType: "USER",
    actorId: user.id,
    weddingId,
    action: `photo.${status.toLowerCase()}`,
    targetType: "photo",
    targetId: photoId,
  });
  revalidatePath(`/dashboard/weddings/${weddingId}/gallery`);
}

export async function deletePhotoAction(
  weddingId: string,
  photoId: string,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  await requireWeddingAccess(weddingId, user.id);

  const photo = await db.photo.findFirst({
    where: { id: photoId, weddingId, deletedAt: null },
  });
  if (!photo) return;

  // Soft delete the row; remove the binaries.
  await db.photo.update({
    where: { id: photo.id },
    data: { deletedAt: new Date() },
  });
  await Promise.all([
    storage.delete(photo.storageKey),
    storage.delete(photo.mediumKey),
    storage.delete(photo.thumbKey),
  ]);

  await audit({
    actorType: "USER",
    actorId: user.id,
    weddingId,
    action: "photo.delete",
    targetType: "photo",
    targetId: photoId,
  });
  revalidatePath(`/dashboard/weddings/${weddingId}/gallery`);
}

export async function resolveReportAction(
  weddingId: string,
  reportId: string,
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  await requireWeddingAccess(weddingId, user.id);

  await db.photoReport.updateMany({
    where: { id: reportId, photo: { weddingId } },
    data: { resolvedAt: new Date() },
  });
  revalidatePath(`/dashboard/weddings/${weddingId}/gallery`);
}
