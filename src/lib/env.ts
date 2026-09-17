function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const env = {
  get appUrl() {
    return process.env.APP_URL ?? "http://localhost:3000";
  },
  get authSecret() {
    return required("AUTH_SECRET");
  },
  get storageDriver() {
    return (process.env.STORAGE_DRIVER ?? "local") as "local" | "s3";
  },
  get storageDir() {
    return process.env.STORAGE_DIR ?? "./storage";
  },
  get uploadMaxBytes() {
    return Number(process.env.UPLOAD_MAX_BYTES ?? 10 * 1024 * 1024);
  },
  get s3() {
    return {
      endpoint: process.env.S3_ENDPOINT || undefined,
      region: process.env.S3_REGION ?? "us-east-1",
      bucket: required("S3_BUCKET"),
      accessKeyId: required("S3_ACCESS_KEY_ID"),
      secretAccessKey: required("S3_SECRET_ACCESS_KEY"),
    };
  },
};
