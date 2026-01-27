import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { db } from '@/server/db';
import { messages } from '@/shared/schema';
import { generateId } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    await db.insert(messages).values({
      id: generateId(),
      userId: session.id,
      message,
      isRead: false,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Message error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
