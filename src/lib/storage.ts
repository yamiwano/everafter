import "server-only";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { env } from "./env";
import { sign, verifySignature } from "./crypto";

/**
 * Object storage abstraction. Photos are NEVER publicly reachable:
 *  - local driver: files live outside `public/` and are streamed through
 *    a signed, expiring URL (`/api/img/...`) validated with HMAC.
 *  - s3 driver: objects live in a private bucket and are delivered via
 *    presigned GetObject URLs.
 */
export interface StorageDriver {
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  /** URL a browser can use to fetch the object, valid for `ttlSeconds`. */
  getSignedUrl(key: string, ttlSeconds: number): Promise<string>;
}

class LocalDiskStorage implements StorageDriver {
  private root: string;

  constructor(dir: string) {
    this.root = path.resolve(dir);
  }

  private resolve(key: string): string {
    const full = path.resolve(this.root, key);
    if (!full.startsWith(this.root + path.sep)) {
      throw new Error("Invalid storage key");
    }
    return full;
  }

  async put(key: string, data: Buffer): Promise<void> {
    const full = this.resolve(key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, data);
  }

  async get(key: string): Promise<Buffer> {
    return readFile(this.resolve(key));
  }

  async delete(key: string): Promise<void> {
    await unlink(this.resolve(key)).catch(() => {});
  }

  async getSignedUrl(key: string, ttlSeconds: number): Promise<string> {
    const expires = Math.floor(Date.now() / 1000) + ttlSeconds;
    const signature = sign(`img:${key}:${expires}`);
    const params = new URLSearchParams({
      exp: String(expires),
      sig: signature,
    });
    return `/api/img/${key}?${params}`;
  }
}

class S3Storage implements StorageDriver {
  // Lazily constructed so local dev never needs AWS SDK config.
  private clientPromise?: Promise<{
    client: import("@aws-sdk/client-s3").S3Client;
    bucket: string;
  }>;

  private async s3() {
    if (!this.clientPromise) {
      this.clientPromise = (async () => {
        const { S3Client } = await import("@aws-sdk/client-s3");
        const cfg = env.s3;
        return {
          client: new S3Client({
            region: cfg.region,
            endpoint: cfg.endpoint,
            forcePathStyle: Boolean(cfg.endpoint),
            credentials: {
              accessKeyId: cfg.accessKeyId,
              secretAccessKey: cfg.secretAccessKey,
            },
          }),
          bucket: cfg.bucket,
        };
      })();
    }
    return this.clientPromise;
  }

  async put(key: string, data: Buffer, contentType: string): Promise<void> {
    const { client, bucket } = await this.s3();
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: data,
        ContentType: contentType,
      }),
    );
  }

  async get(key: string): Promise<Buffer> {
    const { client, bucket } = await this.s3();
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const res = await client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );
    return Buffer.from(await res.Body!.transformToByteArray());
  }

  async delete(key: string): Promise<void> {
    const { client, bucket } = await this.s3();
    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    await client.send(
      new DeleteObjectCommand({ Bucket: bucket, Key: key }),
    );
  }

  async getSignedUrl(key: string, ttlSeconds: number): Promise<string> {
    const { client, bucket } = await this.s3();
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    return getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn: ttlSeconds },
    );
  }
}

const globalForStorage = globalThis as unknown as { storage?: StorageDriver };

export const storage: StorageDriver =
  globalForStorage.storage ??
  (env.storageDriver === "s3"
    ? new S3Storage()
    : new LocalDiskStorage(env.storageDir));

if (process.env.NODE_ENV !== "production") globalForStorage.storage = storage;

/** Validates a signed local-image URL (exp + HMAC). */
export function verifyImageUrl(
  key: string,
  exp: string,
  sig: string,
): boolean {
  const expires = Number(exp);
  if (!Number.isFinite(expires) || expires < Date.now() / 1000) return false;
  return verifySignature(`img:${key}:${expires}`, sig);
}
