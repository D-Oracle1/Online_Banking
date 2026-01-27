import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { messages } from '@/shared/schema';
import { eq, asc, and, sql } from 'drizzle-orm';
import { requireAdminAuth } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const session = await requireAdminAuth();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get all messages for this user (both from user and admin)
    // Filter out soft-deleted messages
    const userMessages = await db
      .select()
      .from(messages)
      .where(and(
        eq(messages.userId, userId),
        sql`${messages.deletedAt} IS NULL`
      ))
      .orderBy(asc(messages.createdAt));

    return NextResponse.json({ messages: userMessages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
