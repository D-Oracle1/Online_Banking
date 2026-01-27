import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { messages, users } from '@/shared/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { requireAdminAuth } from '@/lib/session';

export async function GET(request: Request) {
  try {
    const session = await requireAdminAuth();

    // Get all messages with user info (including anonymous guests)
    // Filter out soft-deleted messages
    const allMessages = await db
      .select({
        userId: messages.userId,
        messageId: messages.id,
        messageText: messages.message,
        messageAttachment: messages.attachment,
        messageSender: messages.senderType,
        messageCreatedAt: messages.createdAt,
        guestName: messages.sentBy, // For anonymous users
        userName: users.fullName,
        userEmail: users.email,
        userUsername: users.username,
        userPhoto: users.profilePhoto,
      })
      .from(messages)
      .leftJoin(users, eq(messages.userId, users.id))
      .where(sql`${messages.deletedAt} IS NULL`)
      .orderBy(desc(messages.createdAt));

    // Group messages by userId and get the most recent message for each user
    const userMap = new Map();
    const guestNames = new Map(); // Store guest names from user messages

    // First pass: collect guest names from user messages
    for (const row of allMessages) {
      if (!row.userName && row.guestName && row.messageSender === 'user') {
        if (!guestNames.has(row.userId)) {
          guestNames.set(row.userId, row.guestName);
        }
      }
    }

    // Second pass: build user map with correct names
    for (const row of allMessages) {
      if (!userMap.has(row.userId)) {
        // Determine if this is a guest user or registered user
        const isGuest = !row.userName;
        const guestName = guestNames.get(row.userId);

        userMap.set(row.userId, {
          user: {
            id: row.userId,
            fullName: isGuest ? (guestName || 'Guest User') : row.userName,
            email: row.userEmail || null,
            username: isGuest ? 'Guest User' : row.userUsername,
            profilePhoto: row.userPhoto || null,
          },
          lastMessage: {
            id: row.messageId,
            message: row.messageText,
            attachment: row.messageAttachment,
            senderType: row.messageSender,
            createdAt: row.messageCreatedAt,
          },
        });
      }
    }

    // Get unread counts for each user
    const conversations = [];
    for (const [userId, data] of userMap) {
      const unreadMessages = await db
        .select({ count: sql<number>`count(*)` })
        .from(messages)
        .where(and(
          eq(messages.userId, userId),
          eq(messages.isRead, false),
          eq(messages.senderType, 'user'),
          sql`${messages.deletedAt} IS NULL`
        ));

      conversations.push({
        ...data,
        unreadCount: Number(unreadMessages[0]?.count || 0),
      });
    }

    // Sort by last message time
    conversations.sort((a, b) => {
      return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}
