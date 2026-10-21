import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { messages } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { requireStaffPermission } from '@/lib/manager-permissions';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messageId } = body;

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    const message = await db.query.messages.findFirst({
      where: eq(messages.id, messageId),
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Admins can delete any message; managers only in their assigned clients' chats
    const session = await requireStaffPermission('deleteMessages', message.userId);
    if ('error' in session) {
      return NextResponse.json({ error: session.error }, { status: session.status });
    }

    // Soft delete the message
    const now = new Date();
    await db
      .update(messages)
      .set({
        deletedAt: now,
        deletedBy: session.id,
      })
      .where(eq(messages.id, messageId));

    return NextResponse.json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}
