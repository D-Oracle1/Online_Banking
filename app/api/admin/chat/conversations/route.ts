import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { messages, users } from '@/shared/schema';
import { eq, desc, and, sql, isNull } from 'drizzle-orm';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!currentUser || (!currentUser.isManager && currentUser.role !== 'admin' && !currentUser.isSuperAdmin)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const isManager = currentUser.isManager && !currentUser.isSuperAdmin && currentUser.role !== 'admin';

    // For managers: only their assigned users' conversations
    let assignedUserIds: string[] | null = null;
    let assignedUserRecords: typeof users.$inferSelect[] = [];

    if (isManager) {
      assignedUserRecords = await db
        .select()
        .from(users)
        .where(and(eq(users.assignedManagerId, userId), isNull(users.deletedAt)));

      assignedUserIds = assignedUserRecords.map(u => u.id);

      if (assignedUserIds.length === 0) {
        return NextResponse.json({ conversations: [] });
      }
    }

    const assignedSet = assignedUserIds ? new Set(assignedUserIds) : null;

    const rawMessages = await db
      .select({
        userId: messages.userId,
        messageId: messages.id,
        messageText: messages.message,
        messageAttachment: messages.attachment,
        messageSender: messages.senderType,
        messageCreatedAt: messages.createdAt,
        guestName: messages.sentBy,
        userName: users.fullName,
        userEmail: users.email,
        userUsername: users.username,
        userPhoto: users.profilePhoto,
      })
      .from(messages)
      .leftJoin(users, eq(messages.userId, users.id))
      .where(sql`${messages.deletedAt} IS NULL`)
      .orderBy(desc(messages.createdAt));

    // Filter in JS for managers — avoids inArray SQL issues
    const allMessages = assignedSet
      ? rawMessages.filter(row => assignedSet.has(row.userId))
      : rawMessages;

    const userMap = new Map<string, any>();
    const guestNames = new Map<string, string>();

    for (const row of allMessages) {
      if (!row.userName && row.guestName && row.messageSender === 'user') {
        if (!guestNames.has(row.userId)) guestNames.set(row.userId, row.guestName);
      }
    }

    for (const row of allMessages) {
      if (!userMap.has(row.userId)) {
        const isGuest = !row.userName;
        userMap.set(row.userId, {
          user: {
            id: row.userId,
            fullName: isGuest ? (guestNames.get(row.userId) || 'Guest User') : row.userName,
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

    // For managers: include assigned users with no messages yet
    if (isManager) {
      for (const u of assignedUserRecords) {
        if (!userMap.has(u.id)) {
          userMap.set(u.id, {
            user: {
              id: u.id,
              fullName: u.fullName,
              email: u.email,
              username: u.username,
              profilePhoto: u.profilePhoto || null,
            },
            lastMessage: null,
          });
        }
      }
    }

    const conversations = [];
    for (const [uid, data] of userMap) {
      let unreadCount = 0;
      if (data.lastMessage) {
        const unread = await db
          .select({ count: sql<number>`count(*)` })
          .from(messages)
          .where(and(
            eq(messages.userId, uid),
            eq(messages.isRead, false),
            eq(messages.senderType, 'user'),
            sql`${messages.deletedAt} IS NULL`
          ));
        unreadCount = Number(unread[0]?.count || 0);
      }
      conversations.push({ ...data, unreadCount });
    }

    conversations.sort((a, b) => {
      if (!a.lastMessage && !b.lastMessage) return 0;
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}
