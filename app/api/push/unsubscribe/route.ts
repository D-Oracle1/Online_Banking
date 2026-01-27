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
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 });
    }

    await db
      .delete(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.userId, session.id),
          eq(pushSubscriptions.endpoint, endpoint)
        )
      );

    console.log(`[Push] User ${session.id} unsubscribed from push notifications`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return NextResponse.json({ error: 'Failed to unsubscribe from push notifications' }, { status: 500 });
  }
}
