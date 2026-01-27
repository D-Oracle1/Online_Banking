import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { db } from '@/server/db';
import { messages, users } from '@/shared/schema';
import { desc, eq, and, sql } from 'drizzle-orm';
import AdminChatInterfaceV2 from '@/components/AdminChatInterfaceV2';

export default async function AdminMessagesPage() {
  const session = await getSession();

  if (!session || session.role !== 'admin') {
    redirect('/login');
  }

  // Get all messages with user info (including anonymous guests)
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
          senderType: row.messageSender as 'user' | 'admin',
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
      .where(and(eq(messages.userId, userId), eq(messages.isRead, false), eq(messages.senderType, 'user')));

    conversations.push({
      ...data,
      unreadCount: Number(unreadMessages[0]?.count || 0),
    });
  }

  // Sort by last message time
  conversations.sort((a, b) => {
    return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
  });

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Messages & Support</h1>
      <AdminChatInterfaceV2 conversations={conversations} adminId={session.id} />
    </div>
  );
}
