import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { messages } from '@/shared/schema';
import { eq, and } from 'drizzle-orm';
import { requireAdminAuth } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const session = await requireAdminAuth();

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Mark all unread messages from this user as read
    await db
      .update(messages)
      .set({ isRead: true })
      .where(and(eq(messages.userId, userId), eq(messages.senderType, 'user'), eq(messages.isRead, false)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 });
  }
}
