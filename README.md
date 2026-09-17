# SnapTime

**Every angle of your event. Revealed together.**

SnapTime is a digital disposable camera for weddings, parties, and events.
Hosts create a private event page and receive a unique QR code. Guests scan it,
enter their name, and capture photos through a mobile web camera — no app needed.
Every photo stays sealed until the reveal date and time the host chooses.

## Tech stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS 4** + **shadcn/ui**
- **PostgreSQL** + **Prisma**
- **sharp** for server-side image validation, EXIF stripping, and thumbnails
- S3-compatible object storage abstraction (local disk driver for dev)

## Getting started

```bash
npm install

# 1. Start the local PostgreSQL server (embedded, real Postgres binary)
npm run db:start          # keep this running in its own terminal

# 2. Apply the schema (first run only)
npx prisma migrate dev

# 3. Run the app
npm run dev
```

Open http://localhost:3000. Create an account, create an event, then open
the event's QR link (`/w/<slug>`) on your phone to try the guest camera flow.

## Environment variables

See `.env.example`. Key values:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string |
| `AUTH_SECRET` | Signs session tokens and image URLs — long random string |
| `APP_URL` | Public origin, used in QR codes |
| `STORAGE_DRIVER` | `local` or `s3` |
| `S3_*` | S3-compatible storage credentials (when `STORAGE_DRIVER=s3`) |
| `UPLOAD_MAX_BYTES` | Per-photo upload limit (default 10 MB) |

## Note on internal naming

Some database tables and API routes still use `wedding` as the internal model
name. User-facing copy refers to **events**.
