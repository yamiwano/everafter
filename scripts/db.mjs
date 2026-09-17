// Local development database runner.
//
// Runs a real PostgreSQL server via embedded-postgres so the app can be
// developed without a system-wide Postgres install. In production, simply
// point DATABASE_URL at a managed Postgres instance — nothing else changes.
//
// Usage:
//   node scripts/db.mjs start   (keeps running; Ctrl+C / SIGTERM stops it)
//   node scripts/db.mjs stop    (stops a previously started instance)
import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const databaseDir = path.join(root, ".pgdata");

const pg = new EmbeddedPostgres({
  databaseDir,
  user: "everafter",
  password: "everafter_dev_password",
  port: 5433,
  persistent: true,
  // Postgres refuses to run as root; when this script is run as root,
  // embedded-postgres drops privileges to a dedicated system user.
  createPostgresUser: process.getuid?.() === 0,
});

const cmd = process.argv[2] ?? "start";

if (cmd === "stop") {
  try {
    await pg.stop();
    console.log("postgres stopped");
  } catch (err) {
    console.error(String(err));
  }
  process.exit(0);
}

const fresh = !existsSync(path.join(databaseDir, "PG_VERSION"));
if (fresh) {
  console.log("initialising postgres data directory...");
  await pg.initialise();
}

await pg.start();
if (fresh) {
  await pg.createDatabase("everafter");
}
console.log("postgres ready on port 5433 (db: everafter)");

const shutdown = async () => {
  console.log("stopping postgres...");
  await pg.stop();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
// keep the process alive
setInterval(() => {}, 1 << 30);
