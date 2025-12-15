import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

function verifyPaddleSignature(rawBody: string, header: string | null, secret: string): boolean {
  if (!header) return false;

  // Header format: "ts=timestamp;h1=signature"
  const parts = header.split(';').reduce<Record<string, string>>((acc, part) => {
    const [k, v] = part.split('=');
    if (k && v) acc[k.trim()] = v.trim();
    return acc;
  }, {});

  const ts = parts['ts'];
  const signature = parts['h1'];
  if (!ts || !signature) return false;

  const signedPayload = `${ts}:${rawBody}`;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(signedPayload);
  const expected = hmac.digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expected, 'hex'),
    );
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const secret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const rawBody = await req.text();
  const signatureHeader = req.headers.get('paddle-signature');

  if (!verifyPaddleSignature(rawBody, signatureHeader, secret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
  }

  const event = JSON.parse(rawBody) as any;
  const eventType = event?.event_type as string | undefined;

  try {
    switch (eventType) {
      case 'transaction.completed': {
        const customData = event?.data?.custom_data || {};
        const userId = customData.userId as string | undefined;
        const plan = customData.plan as 'pro' | 'premium' | undefined;
        const priceId =
          event?.data?.items?.[0]?.price?.id ||
          event?.data?.items?.[0]?.price_id ||
          null;
        const subscriptionId =
          event?.data?.subscription_id ||
          event?.data?.subscription?.id ||
          null;
        const customerId =
          event?.data?.customer_id ||
          event?.data?.customer?.id ||
          null;
        const periodEnd =
          event?.data?.billing_period?.ends_at ||
          event?.data?.subscription?.billing_period?.ends_at ||
          null;

        if (!userId || !plan) break;

        await prisma.user.update({
          where: { id: userId },
          data: {
            plan,
            subscriptionStatus: 'active',
            paddlePriceId: priceId,
            paddleSubscriptionId: subscriptionId,
            paddleCustomerId: customerId,
            currentPeriodEnd: periodEnd ? new Date(periodEnd) : null,
          },
        });
        break;
      }
      case 'subscription.canceled': {
        const subscriptionId =
          event?.data?.id ||
          event?.data?.subscription_id ||
          null;
        if (!subscriptionId) break;

        await prisma.user.updateMany({
          where: { paddleSubscriptionId: subscriptionId },
          data: {
            subscriptionStatus: 'canceled',
          },
        });
        break;
      }
      case 'subscription.updated': {
        const subscriptionId =
          event?.data?.id ||
          event?.data?.subscription_id ||
          null;
        if (!subscriptionId) break;

        const status = (event?.data?.status as string | undefined) || 'active';
        const mappedStatus =
          status === 'active'
            ? 'active'
            : status === 'canceled'
            ? 'canceled'
            : status === 'past_due'
            ? 'past_due'
            : 'inactive';

        await prisma.user.updateMany({
          where: { paddleSubscriptionId: subscriptionId },
          data: {
            subscriptionStatus: mappedStatus,
          },
        });
        break;
      }
      case 'subscription.activated': {
        const subscriptionId =
          event?.data?.id ||
          event?.data?.subscription_id ||
          null;
        if (!subscriptionId) break;

        await prisma.user.updateMany({
          where: { paddleSubscriptionId: subscriptionId },
          data: {
            subscriptionStatus: 'active',
          },
        });
        break;
      }
      default: {
        // Ignore other events for now
        break;
      }
    }
  } catch (err) {
    console.error('Paddle webhook handling error', err);
    return NextResponse.json({ error: 'Webhook handling error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}



