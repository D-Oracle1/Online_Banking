import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { messages } from '@/shared/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const guestId = searchParams.get('guestId');

    if (!guestId) {
      return NextResponse.json(
        { error: 'Guest ID is required' },
        { status: 400 }
      );
    }

    // Get all messages for this guest
    const userMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.userId, guestId))
      .orderBy(desc(messages.createdAt))
      .limit(100);

    return NextResponse.json({
      success: true,
      messages: userMessages,
    });
  } catch (error: any) {
    console.error('Error checking anonymous messages:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check messages' },
      { status: 500 }
    );
  }
}
