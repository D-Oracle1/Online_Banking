import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/session';
import { db } from '@/server/db';
import { messages } from '@/shared/schema';
import { and, inArray, isNotNull } from 'drizzle-orm';
import { parseClientIds } from '@/lib/manager-permissions';
import { logRestore, logBulkRestore } from '@/server/audit-logger';

/**
 * Restore soft-deleted messages.
 * Body: { messageId } for one message, { messageIds } for several,
 * or { userId } / { userIds } for every deleted message in that conversation.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminAuth();

    const body = await request.json();
    const { messageId, messageIds } = body;

    const ids: string[] = messageIds ?? (messageId ? [messageId] : []);
    const userIds = body.userId || body.userIds ? parseClientIds(body) : [];

    if (!ids.length && !userIds.length) {
      return NextResponse.json({ error: 'Message ID or user ID is required' }, { status: 400 });
    }

    const restored = await db.update(messages)
      .set({ deletedAt: null, deletedBy: null })
      .where(and(
        isNotNull(messages.deletedAt),
        userIds.length ? inArray(messages.userId, userIds) : inArray(messages.id, ids)
      ))
      .returning({ id: messages.id });

    // Log the restoration for audit trail
    if (restored.length === 1) {
      await logRestore(session.id, 'message', restored[0].id, request as any);
    } else if (restored.length > 1) {
      await logBulkRestore(session.id, 'message', restored.map(r => r.id), request as any);
    }

    return NextResponse.json({
      success: true,
      restoredCount: restored.length,
      message: `${restored.length} message${restored.length === 1 ? '' : 's'} restored successfully`,
    });
  } catch (error) {
    console.error('Restore message error:', error);
    return NextResponse.json({ error: 'Failed to restore message' }, { status: 500 });
  }
}
