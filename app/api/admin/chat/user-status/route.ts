import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { users } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { requireAdminAuth } from '@/lib/session';

export async function GET(request: Request) {
  try {
    await requireAdminAuth();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const [user] = await db
      .select({
        isTyping: users.isTyping,
        lastActiveAt: users.lastActiveAt,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // User is online if they were active in the last 2 minutes
    const isOnline = user.lastActiveAt
      ? new Date().getTime() - new Date(user.lastActiveAt).getTime() < 2 * 60 * 1000
      : false;

    return NextResponse.json({
      isOnline,
      isTyping: user.isTyping,
      lastActiveAt: user.lastActiveAt,
    });
  } catch (error) {
    console.error('Error fetching user status:', error);
    return NextResponse.json({ error: 'Failed to fetch user status' }, { status: 500 });
  }
}
