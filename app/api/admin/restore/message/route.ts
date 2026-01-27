import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/session';
import { db } from '@/server/db';
import { messages } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { logRestore } from '@/server/audit-logger';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminAuth();

    const { messageId } = await request.json();

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    // Check if message exists
    const message = await db.query.messages.findFirst({
      where: eq(messages.id, messageId),
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (!message.deletedAt) {
      return NextResponse.json({ error: 'Message is not deleted' }, { status: 400 });
    }

    // Restore the message
    await db.update(messages)
      .set({ deletedAt: null, deletedBy: null })
      .where(eq(messages.id, messageId));

    // Log the restoration for audit trail
    const adminId = (session as any).userId || 'admin';
    await logRestore(adminId, 'message', messageId, request as any);

    return NextResponse.json({
      success: true,
      message: 'Message restored successfully'
    });
  } catch (error) {
    console.error('Restore message error:', error);
    return NextResponse.json({ error: 'Failed to restore message' }, { status: 500 });
  }
}
