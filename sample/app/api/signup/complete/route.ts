import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { sha256Hex } from '@/lib/crypto';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = (body?.token || '').toString().trim();
    const name = (body?.name || '').toString().trim();
    const password = (body?.password || '').toString();
    const password2 = (body?.password2 || '').toString();

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }
    if (!name || name.length < 2) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }
    if (password !== password2) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 });
    }

    const tokenHash = sha256Hex(token);
    const record = await prisma.signupToken.findUnique({ where: { tokenHash } });
    if (!record || record.expires < new Date()) {
      return NextResponse.json({ error: 'Invalid or expired link' }, { status: 400 });
    }

    const email = record.email;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing?.passwordHash) {
      return NextResponse.json(
        { error: 'Account already exists. Please sign in.' },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date();

    const user = existing
      ? await prisma.user.update({
          where: { id: existing.id },
          data: { name, passwordHash, emailVerified: now },
        })
      : await prisma.user.create({
          data: { email, name, passwordHash, emailVerified: now },
        });

    await prisma.signupToken.delete({ where: { tokenHash } });

    return NextResponse.json(
      { ok: true, email: user.email },
      { status: 200 }
    );
  } catch (e) {
    console.error('signup complete error:', e);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}


