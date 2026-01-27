import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { messages } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { requireAdminAuth } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const session = await requireAdminAuth();

    const body = await request.json();
    const { messageId } = body;

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
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
