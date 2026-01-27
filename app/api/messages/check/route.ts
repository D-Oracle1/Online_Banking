import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { db } from '@/server/db';
import { messages } from '@/shared/schema';
import { eq, asc, and, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();

    // Fetch all messages in the conversation (user messages + admin messages)
    // This includes:
    // 1. Messages sent by the user (senderType='user' AND userId matches)
    // 2. Messages sent by admin to the user (senderType='admin' AND userId matches)
    const allMessages = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.userId, session.id),
          or(
            eq(messages.senderType, 'user'),
            eq(messages.senderType, 'admin')
          )
        )
      )
      .orderBy(asc(messages.createdAt));

    return NextResponse.json({
      messages: allMessages,
    });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
