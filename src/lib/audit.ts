import "server-only";
import type { ActorType, Prisma } from "@prisma/client";
import { db } from "./db";

export async function audit(entry: {
  actorType: ActorType;
  actorId?: string;
  weddingId?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Prisma.InputJsonValue;
  ip?: string;
}): Promise<void> {
  // Audit logging must never break the main flow.
  await db.auditLog.create({ data: entry }).catch(() => {});
}
