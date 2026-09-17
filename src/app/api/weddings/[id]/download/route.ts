import { NextResponse } from "next/server";
import { PassThrough, Readable } from "node:stream";
import archiver from "archiver";
import { db } from "@/lib/db";
import { getCurrentUser, requireWeddingAccess } from "@/lib/auth";
import { storage } from "@/lib/storage";
import { audit } from "@/lib/audit";

/** Download the complete gallery as a ZIP of original files. Host-only. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let membership;
  try {
    membership = await requireWeddingAccess(id, user.id);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const wedding = membership.wedding;

  const photos = await db.photo.findMany({
    where: { weddingId: wedding.id, deletedAt: null, status: "APPROVED" },
    orderBy: { createdAt: "asc" },
  });
  if (photos.length === 0) {
    return NextResponse.json({ error: "No photos yet" }, { status: 404 });
  }

  const archive = archiver("zip", { zlib: { level: 0 } }); // photos are already compressed
  const pass = new PassThrough();
  archive.pipe(pass);

  // Feed the archive asynchronously while streaming the response.
  (async () => {
    try {
      const nameCounts = new Map<string, number>();
      for (const [index, photo] of photos.entries()) {
        const data = await storage.get(photo.storageKey);
        const contributor = photo.contributorName
          .replace(/[^a-zA-Z0-9 _-]/g, "")
          .trim()
          .replace(/\s+/g, "_") || "guest";
        const base = `${String(index + 1).padStart(4, "0")}_${contributor}`;
        const n = (nameCounts.get(base) ?? 0) + 1;
        nameCounts.set(base, n);
        archive.append(data, { name: `${base}${n > 1 ? `_${n}` : ""}.jpg` });
      }
      await archive.finalize();
    } catch (err) {
      archive.abort();
      pass.destroy(err as Error);
    }
  })();

  await audit({
    actorType: "USER",
    actorId: user.id,
    weddingId: wedding.id,
    action: "gallery.download",
    metadata: { photoCount: photos.length },
  });

  return new NextResponse(Readable.toWeb(pass) as ReadableStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="everafter-${wedding.slug}-gallery.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
