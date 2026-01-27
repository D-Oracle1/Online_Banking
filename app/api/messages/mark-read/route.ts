import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { messages } from '@/shared/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      // For guest users, use guestId from request body
      const body = await request.json();
      const { guestId } = body;

      if (!guestId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Mark all admin messages as read for this guest
      await db
        .update(messages)
        .set({ isRead: true })
        .where(
          and(
            eq(messages.userId, guestId),
            eq(messages.senderType, 'admin'),
            eq(messages.isRead, false)
          )
        );

      return NextResponse.json({ success: true });
    }

    // For authenticated users
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.userId, session.id),
          eq(messages.senderType, 'admin'),
          eq(messages.isRead, false)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 });
  }
}
