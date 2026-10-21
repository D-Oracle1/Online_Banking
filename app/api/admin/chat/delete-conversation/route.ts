import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { messages } from '@/shared/schema';
import { and, inArray, sql } from 'drizzle-orm';
import { parseClientIds, requireStaffPermissionForClients } from '@/lib/manager-permissions';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // A chat can combine several sender IDs (same person, different sessions)
    const userIds = parseClientIds(body);

    if (userIds.length === 0) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Admins can delete any conversation; managers only their assigned clients'
    const session = await requireStaffPermissionForClients('deleteMessages', userIds);
    if ('error' in session) {
      return NextResponse.json({ error: session.error }, { status: session.status });
    }

    // Soft delete all messages for these senders
    const now = new Date();
    await db
      .update(messages)
      .set({
        deletedAt: now,
        deletedBy: session.id,
      })
      .where(
        and(
          inArray(messages.userId, userIds),
          sql`${messages.deletedAt} IS NULL`
        )
      );

    return NextResponse.json({
      success: true,
      message: 'Conversation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 });
  }
}
