#!/usr/bin/env node
/**
 * Recreate the local demo host account + a starter event.
 * Usage: node scripts/seed-demo.mjs
 */
import { createRequire } from "node:module";
import { randomBytes, scrypt as scryptCb } from "node:crypto";

const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

function scrypt(password, salt, keylen, options) {
  return new Promise((resolve, reject) => {
    scryptCb(password, salt, keylen, options, (err, derivedKey) =>
      err ? reject(err) : resolve(derivedKey),
    );
  });
}

async function hashPassword(password) {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt.toString("base64url")}$${Buffer.from(derived).toString("base64url")}`;
}

const email = "host@everafter.demo";
const password = "EverAfterDemo2026!";

const passwordHash = await hashPassword(password);
const user = await db.user.upsert({
  where: { email },
  update: { passwordHash, name: "Jordan Hale", deletedAt: null },
  create: { email, name: "Jordan Hale", passwordHash },
});

let membership = await db.weddingMember.findFirst({
  where: { userId: user.id },
  include: { wedding: true },
});

if (!membership) {
  const slugSuffix =
    randomBytes(4)
      .toString("base64url")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 7) || randomBytes(3).toString("hex");
  const wedding = await db.wedding.create({
    data: {
      slug: `maya-and-elias-${slugSuffix}`,
      coupleNames: "Maya & Elias",
      weddingDate: new Date(),
      location: "The Conservatory, Chicago",
      timezone: "America/Chicago",
      revealAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      members: { create: { userId: user.id, role: "OWNER" } },
      settings: {
        create: {
          maxPhotosPerGuest: 15,
          welcomeMessage: "Help us capture every angle tonight!",
        },
      },
    },
  });
  membership = { wedding };
}

console.log("Demo host ready:");
console.log(`  Email:    ${email}`);
console.log(`  Password: ${password}`);
console.log(`  Event:    ${membership.wedding.coupleNames}`);
console.log(`  Dashboard:/dashboard/weddings/${membership.wedding.id}`);
console.log(`  Guest:    /w/${membership.wedding.slug}`);

await db.$disconnect();
