import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { db } from '@/server/db';
import { messages } from '@/shared/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const { messageId } = await request.json();

    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }

    // Get message
    const message = await db.query.messages.findFirst({
      where: eq(messages.id, messageId),
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // Mark message as read
    await db.update(messages)
      .set({
        isRead: true,
      })
      .where(eq(messages.id, messageId));

    return NextResponse.json({
      success: true,
      message: 'Message marked as read',
    });
  } catch (error: any) {
    console.error('Error marking message as read:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to mark message as read' },
      { status: 500 }
    );
  }
}
