import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { messages } from '@/shared/schema';
import { eq, and, sql } from 'drizzle-orm';
import { requireAdminAuth } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const session = await requireAdminAuth();

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Soft delete all messages for this user
    const now = new Date();
    const result = await db
      .update(messages)
      .set({
        deletedAt: now,
        deletedBy: session.id,
      })
      .where(
        and(
          eq(messages.userId, userId),
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
