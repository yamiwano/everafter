import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { getCurrentUser, requireWeddingAccess } from "@/lib/auth";
import { env } from "@/lib/env";

/** QR code PNG for the wedding join URL. Host-only. */
export async function GET(
  req: Request,
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

  const url = new URL(req.url);
  const size = Math.min(2048, Math.max(256, Number(url.searchParams.get("size") ?? 1024)));
  const joinUrl = `${env.appUrl}/w/${membership.wedding.slug}`;

  const png = await QRCode.toBuffer(joinUrl, {
    type: "png",
    width: size,
    margin: 2,
    errorCorrectionLevel: "H",
    color: { dark: "#12101a", light: "#f7f5fb" },
  });

  const download = url.searchParams.get("download") === "1";
  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      ...(download
        ? {
            "Content-Disposition": `attachment; filename="snaptime-qr-${membership.wedding.slug}.png"`,
          }
        : {}),
      "Cache-Control": "private, max-age=300",
    },
  });
}
