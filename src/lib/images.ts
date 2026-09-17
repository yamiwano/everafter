import "server-only";
import sharp from "sharp";

const ALLOWED_INPUT_FORMATS = new Set(["jpeg", "png", "webp", "heif", "avif"]);

export interface ProcessedImage {
  original: { data: Buffer; contentType: string; ext: string };
  medium: { data: Buffer };
  thumb: { data: Buffer };
  width: number;
  height: number;
}

/**
 * Validates and processes an uploaded image.
 * Content is verified by decoding the actual bytes (never trusting the
 * client-provided MIME type), EXIF orientation is baked in, metadata is
 * stripped, and web-optimised derivative sizes are produced.
 */
export async function processUpload(input: Buffer): Promise<ProcessedImage> {
  const probe = sharp(input, { failOn: "error" });
  const meta = await probe.metadata();

  if (!meta.format || !ALLOWED_INPUT_FORMATS.has(meta.format)) {
    throw new Error("UNSUPPORTED_IMAGE_FORMAT");
  }
  if (!meta.width || !meta.height || meta.width < 16 || meta.height < 16) {
    throw new Error("IMAGE_TOO_SMALL");
  }
  if (meta.width * meta.height > 80_000_000) {
    throw new Error("IMAGE_TOO_LARGE");
  }

  // Re-encode the original: normalises orientation, strips EXIF/GPS,
  // and guarantees the stored bytes are a real image.
  const original = await sharp(input)
    .rotate()
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });

  const medium = await sharp(original.data)
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  const thumb = await sharp(original.data)
    .resize({ width: 480, height: 480, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 74 })
    .toBuffer();

  return {
    original: { data: original.data, contentType: "image/jpeg", ext: "jpg" },
    medium: { data: medium },
    thumb: { data: thumb },
    width: original.info.width,
    height: original.info.height,
  };
}
