import { NextResponse } from "next/server";
import { storage, verifyImageUrl } from "@/lib/storage";

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/**
 * Protected image delivery for the local storage driver. Every URL is
 * HMAC-signed with an expiry — there is no way to fetch a photo without a
 * signature issued by the server after an authorization check.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key: segments } = await params;
  const key = segments.join("/");
  const url = new URL(req.url);
  const exp = url.searchParams.get("exp") ?? "";
  const sig = url.searchParams.get("sig") ?? "";

  if (!verifyImageUrl(key, exp, sig)) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 403 });
  }

  let data: Buffer;
  try {
    data = await storage.get(key);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ext = key.split(".").pop() ?? "";
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
      "Cache-Control": "private, max-age=3600, immutable",
    },
  });
}
