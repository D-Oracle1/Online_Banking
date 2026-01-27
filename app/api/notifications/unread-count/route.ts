import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { notifications } from '@/shared/schema';
import { eq, and, count } from 'drizzle-orm';
import { getSession } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await db
      .select({ count: count() })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, session.id),
          eq(notifications.isRead, false)
        )
      );

    const unreadCount = result[0]?.count || 0;

    return NextResponse.json({ unreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json({ error: 'Failed to fetch unread count' }, { status: 500 });
  }
}
