import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { pushSubscriptions } from '@/shared/schema';
import { getSession } from '@/lib/session';
import { eq, and } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subscription } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 });
    }

    const subscriptionId = `push-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Check if subscription already exists
    const existing = await db
      .select()
      .from(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, session.id),
          eq(pushSubscriptions.endpoint, subscription.endpoint)
        )
      );

    if (existing.length > 0) {
      return NextResponse.json({ success: true, message: 'Subscription already exists' });
    }

    await db.insert(pushSubscriptions).values({
      id: subscriptionId,
      userId: session.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    });

    console.log(`[Push] User ${session.id} subscribed to push notifications`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error subscribing to push notifications:', error);

    // If it's a unique constraint violation, just return success
    if (error.code === '23505') {
      return NextResponse.json({ success: true, message: 'Subscription already exists' });
    }

    return NextResponse.json({ error: 'Failed to subscribe to push notifications' }, { status: 500 });
  }
}
