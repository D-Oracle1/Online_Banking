import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { notifications } from '@/shared/schema';
import { eq, desc, and } from 'drizzle-orm';
import { getSession } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const whereConditions = unreadOnly
      ? and(eq(notifications.userId, session.id), eq(notifications.isRead, false))
      : eq(notifications.userId, session.id);

    const userNotifications = await db
      .select()
      .from(notifications)
      .where(whereConditions)
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    return NextResponse.json({ notifications: userNotifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
