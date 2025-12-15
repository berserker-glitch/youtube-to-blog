import { NextRequest, NextResponse } from 'next/server';
import { getAppServerSession } from '@/lib/auth-helpers';

export const runtime = 'nodejs';

type Plan = 'pro' | 'premium';

function getPriceIdForPlan(plan: Plan): string | null {
  if (plan === 'pro') return process.env.PADDLE_PRICE_ID_PRO_MONTHLY || null;
  if (plan === 'premium') return process.env.PADDLE_PRICE_ID_PREMIUM_MONTHLY || null;
  return null;
}

export async function POST(req: NextRequest) {
  const session = await getAppServerSession();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let plan: Plan | 'free' | undefined;

  const contentType = req.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const body = (await req.json()) as { plan?: Plan | 'free' };
    plan = body.plan;
  } else {
    // Handle form POSTs from the settings page
    const form = await req.formData();
    const value = form.get('plan');
    if (typeof value === 'string') {
      plan = value as Plan | 'free';
    }
  }

  if (!plan) return NextResponse.json({ error: 'Missing plan' }, { status: 400 });

  // Handle free plan purely in our own DB – no Paddle involved.
  if (plan === 'free') {
    return NextResponse.json({ ok: true, redirectUrl: '/app' });
  }

  if (plan !== 'pro' && plan !== 'premium') {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  const priceId = getPriceIdForPlan(plan);
  if (!priceId) {
    return NextResponse.json({ error: 'Price ID not configured for plan' }, { status: 500 });
  }

  const paddleSecret = process.env.PADDLE_SECRET_KEY;
  if (!paddleSecret) {
    return NextResponse.json({ error: 'Paddle secret key not configured' }, { status: 500 });
  }

  const origin =
    process.env.NEXTAUTH_URL ||
    req.headers.get('origin') ||
    'http://localhost:3000';

  const body = {
    customer: {
      email: session.user.email,
    },
    items: [
      {
        price_id: priceId,
        quantity: 1,
      },
    ],
    custom_data: {
      userId: session.user.id,
      plan,
    },
    success_url: `${origin}/app`,
    cancel_url: `${origin}/app/settings`,
  };

  const resp = await fetch('https://api.paddle.com/transactions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${paddleSecret}`,
      'Content-Type': 'application/json',
      'Paddle-Version': '1',
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    console.error('Paddle API error:', resp.status, text);
    return NextResponse.json(
      { error: 'Failed to create checkout' },
      { status: 500 },
    );
  }

  const data = (await resp.json()) as any;
  const redirectUrl =
    data?.data?.checkout?.url ||
    data?.data?.url ||
    data?.checkout_url ||
    null;

  if (!redirectUrl) {
    console.error('Unexpected Paddle response shape', data);
    return NextResponse.json(
      { error: 'Invalid response from payment provider' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, redirectUrl });
}


