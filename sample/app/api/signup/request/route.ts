import { NextResponse } from 'next/server';
import { type NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { randomToken, sha256Hex } from '@/lib/crypto';
import { sendSignupEmail } from '@/lib/mailer';

function baseUrl() {
  return (
    process.env.NEXTAUTH_URL ||
    process.env.APP_URL ||
    'http://localhost:3000'
  );
}

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const emailRaw = (body?.email || '').toString().trim();
    const email = emailRaw.toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const token = randomToken(32);
    const tokenHash = sha256Hex(token);
    const expires = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes

    // Replace any existing signup tokens for this email
    await prisma.signupToken.deleteMany({ where: { email } });
    await prisma.signupToken.create({
      data: { email, tokenHash, expires },
    });

    const url = new URL('/signup/complete', baseUrl());
    url.searchParams.set('token', token);

    await sendSignupEmail({ to: email, signupUrl: url.toString() });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    console.error('signup request error:', e);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}


