import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { messages, users } from '@/shared/schema';
import { nanoid } from 'nanoid';
import { requireAdminAuth } from '@/lib/session';
import { sendNotification } from '@/server/notifications';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const session = await requireAdminAuth();

    const body = await request.json();
    const { userId, message, attachment } = body;

    if (!userId || !message) {
      return NextResponse.json({ error: 'User ID and message are required' }, { status: 400 });
    }

    // Validate attachment size if present (Base64 encoded images can be large)
    if (attachment && attachment.length > 10 * 1024 * 1024) {
      return NextResponse.json({
        error: 'Attachment is too large. Please use an image under 5MB.'
      }, { status: 413 });
    }

    // Create new message from admin
    const messageId = nanoid();
    const [newMessage] = await db
      .insert(messages)
      .values({
        id: messageId,
        userId,
        message,
        attachment: attachment || null,
        senderType: 'admin',
        sentBy: session.id,
        isRead: false, // User hasn't read it yet
        response: null,
      })
      .returning();

    // Send notification to user (if not a guest)
    if (!userId.startsWith('guest-')) {
      try {
        await sendNotification({
          userId,
          type: 'chat_message',
          title: 'New Message from Admin',
          message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
          data: {
            messageId,
            type: 'admin_chat',
          },
        });
      } catch (notifError) {
        console.error('Error sending notification:', notifError);
        // Don't fail the request if notification fails
      }
    }

    return NextResponse.json({ message: newMessage });
  } catch (error: any) {
    console.error('Error sending message:', error);

    // Provide more specific error messages
    if (error.message?.includes('payload') || error.message?.includes('size')) {
      return NextResponse.json({
        error: 'Message or attachment is too large. Please use a smaller image.'
      }, { status: 413 });
    }

    return NextResponse.json({
      error: error.message || 'Failed to send message'
    }, { status: 500 });
  }
}
