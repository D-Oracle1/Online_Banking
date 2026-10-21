import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/session';
import { db } from '@/server/db';
import { messages } from '@/shared/schema';
import { and, eq, inArray, isNotNull } from 'drizzle-orm';
import { logPermanentDelete } from '@/server/audit-logger';

/**
 * Permanently delete messages that are already soft-deleted.
 * Body: { messageIds } for specific messages, or { userId } for every
 * deleted message in that conversation. Active messages are never touched.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminAuth();

    const { messageIds, userId } = await request.json();

    if (!messageIds?.length && !userId) {
      return NextResponse.json({ error: 'Message IDs or user ID is required' }, { status: 400 });
    }

    const removed = await db.delete(messages)
      .where(and(
        isNotNull(messages.deletedAt),
        userId ? eq(messages.userId, userId) : inArray(messages.id, messageIds)
      ))
      .returning({ id: messages.id, userId: messages.userId, message: messages.message, createdAt: messages.createdAt });

    if (removed.length) {
      await logPermanentDelete(
        session.id,
        'message',
        removed.length === 1 ? removed[0].id : (userId || 'multiple'),
        'Permanently deleted from Deleted Messages',
        { count: removed.length, messages: removed },
        request as any
      );
    }

    return NextResponse.json({
      success: true,
      deletedCount: removed.length,
      message: `${removed.length} message${removed.length === 1 ? '' : 's'} permanently deleted`,
    });
  } catch (error: any) {
    console.error('Permanent delete message error:', error);
    return NextResponse.json({ error: error.message || 'Failed to permanently delete messages' }, { status: 500 });
  }
}
