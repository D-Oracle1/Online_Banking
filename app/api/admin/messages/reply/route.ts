import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { db } from '@/server/db';
import { messages } from '@/shared/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const { messageId, response } = await request.json();

    if (!messageId || !response) {
      return NextResponse.json(
        { error: 'Message ID and response are required' },
        { status: 400 }
      );
    }

    // Get original message
    const message = await db.query.messages.findFirst({
      where: eq(messages.id, messageId),
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // Mark original message as read and add response field for backward compatibility
    await db.update(messages)
      .set({
        isRead: true,
        response, // Keep response field for admin UI compatibility
      })
      .where(eq(messages.id, messageId));

    // Create a new admin message as a reply
    const adminMessageId = `admin-reply-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date();

    await db.insert(messages).values({
      id: adminMessageId,
      userId: message.userId, // Same userId/guestId so it appears in the same conversation
      message: response,
      attachment: null,
      isRead: true,
      senderType: 'admin', // Mark as admin message
      sentBy: 'Support Team', // Identify as admin
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      message: 'Response sent successfully',
      adminMessageId,
    });
  } catch (error: any) {
    console.error('Error sending response:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send response' },
      { status: 500 }
    );
  }
}
