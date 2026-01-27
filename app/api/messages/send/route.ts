import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { db } from '@/server/db';
import { messages } from '@/shared/schema';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { message, attachment } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Save message to database
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date();

    const newMessage = await db.insert(messages).values({
      id: messageId,
      userId: session.id,
      message,
      attachment: attachment || null,
      isRead: false,
      senderType: 'user',
      sentBy: null,
      createdAt: now,
    }).returning();

    return NextResponse.json({
      success: true,
      message: newMessage[0],
      messageId,
    });
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    );
  }
}
