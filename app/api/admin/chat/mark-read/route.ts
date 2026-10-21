import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { messages } from '@/shared/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { parseClientIds, requireStaffPermissionForClients } from '@/lib/manager-permissions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // A chat can combine several sender IDs (same person, different sessions)
    const userIds = parseClientIds(body);

    if (userIds.length === 0) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const staff = await requireStaffPermissionForClients('viewMessages', userIds);
    if ('error' in staff) {
      return NextResponse.json({ error: staff.error }, { status: staff.status });
    }

    // Mark all unread messages from these senders as read
    await db
      .update(messages)
      .set({ isRead: true })
      .where(and(inArray(messages.userId, userIds), eq(messages.senderType, 'user'), eq(messages.isRead, false)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 });
  }
}
