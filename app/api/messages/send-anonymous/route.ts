import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { messages, users } from '@/shared/schema';
import { sendBulkNotification } from '@/server/notifications';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');
    let message: string;
    let attachment: string | null = null;
    let guestName: string;
    let guestId: string;

    // Handle both JSON and FormData requests
    if (contentType?.includes('application/json')) {
      // JSON request (from React component)
      const data = await request.json();
      message = data.message;
      attachment = data.attachment;
      guestName = data.guestName;
      guestId = data.guestId;
    } else {
      // FormData request (from static HTML chatbot widget)
      const formData = await request.formData();
      message = formData.get('content') as string || formData.get('message') as string;
      guestName = formData.get('guestName') as string;
      guestId = formData.get('guestId') as string;

      // Handle image file if present
      const imageFile = formData.get('image') as File;
      if (imageFile && imageFile.size > 0) {
        const buffer = await imageFile.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        attachment = `data:${imageFile.type};base64,${base64}`;
      }
    }

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!guestName || typeof guestName !== 'string') {
      return NextResponse.json(
        { error: 'Guest name is required' },
        { status: 400 }
      );
    }

    // Validate attachment size if present (Base64 encoded images can be large)
    if (attachment && attachment.length > 10 * 1024 * 1024) {
      return NextResponse.json({
        error: 'Attachment is too large. Please use an image under 5MB.'
      }, { status: 413 });
    }

    // Save message to database with guest identifier
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date();

    const newMessage = await db.insert(messages).values({
      id: messageId,
      userId: guestId || `guest-${Date.now()}`, // Use provided guestId or generate one
      message,
      attachment: attachment || null,
      isRead: false,
      senderType: 'user',
      sentBy: guestName, // Store guest name in sentBy field
      createdAt: now,
    }).returning();

    // Notify all admins about new message
    try {
      const admins = await db.select().from(users).where(eq(users.role, 'admin'));
      const adminIds = admins.map(admin => admin.id);

      if (adminIds.length > 0) {
        await sendBulkNotification(adminIds, {
          type: 'chat_message',
          title: `New Message from ${guestName}`,
          message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
          data: {
            messageId,
            guestId: guestId || `guest-${Date.now()}`,
            guestName,
            type: 'user_chat',
          },
        });
      }
    } catch (notifError) {
      console.error('Error sending notification to admins:', notifError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      message: newMessage[0],
      messageId,
      imageUrl: attachment,
    });
  } catch (error: any) {
    console.error('Error sending anonymous message:', error);

    // Provide more specific error messages
    if (error.message?.includes('payload') || error.message?.includes('size')) {
      return NextResponse.json({
        error: 'Message or attachment is too large. Please use a smaller image.'
      }, { status: 413 });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    );
  }
}
