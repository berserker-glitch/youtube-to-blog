/* eslint-disable no-console */
// Usage:
//   node sample/scripts/create-super-admin.js --email admin@example.com --password "StrongPass123" --name "Super Admin"
//
// Notes:
// - Reads DATABASE_URL from environment.
// - If user exists, will update role/password/emailVerified.

const fs = require('fs');
const path = require('path');

function loadDotEnvIfPresent() {
  // Try to load ../.env (repo root) and sample/.env.local if present.
  const candidates = [
    path.resolve(__dirname, '..', '.env.local'),
    path.resolve(__dirname, '..', '.env'),
    path.resolve(__dirname, '..', '..', '.env.local'),
    path.resolve(__dirname, '..', '..', '.env'),
  ];

  for (const p of candidates) {
    try {
      if (!fs.existsSync(p)) continue;
      const txt = fs.readFileSync(p, 'utf8');
      for (const rawLine of txt.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;
        const eq = line.indexOf('=');
        if (eq === -1) continue;
        const key = line.slice(0, eq).trim();
        let val = line.slice(eq + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) process.env[key] = val;
      }
    } catch {
      // ignore
    }
  }
}

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    i++;
  }
  return args;
}

async function main() {
  loadDotEnvIfPresent();

  const args = parseArgs(process.argv);
  const email = String(args.email || '').trim().toLowerCase();
  const password = String(args.password || '').trim();
  const name = args.name ? String(args.name).trim() : 'Super Admin';

  if (!email || !password) {
    console.error('Missing required args: --email and --password');
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error('Missing DATABASE_URL in environment.');
    process.exit(1);
  }

  const bcrypt = require('bcryptjs');
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          name,
          passwordHash,
          emailVerified: new Date(),
          role: 'super_admin',
        },
      });
      console.log(`Updated existing user ${email} -> role super_admin`);
    } else {
      await prisma.user.create({
        data: {
          email,
          name,
          passwordHash,
          emailVerified: new Date(),
          role: 'super_admin',
          plan: 'free',
          subscriptionStatus: 'inactive',
        },
      });
      console.log(`Created super_admin user ${email}`);
    }

    console.log('Done. You can now log in with the provided credentials.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
