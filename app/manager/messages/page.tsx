import { db } from '@/server/db';
import { messages, users } from '@/shared/schema';
import { desc, eq, and, sql, isNull } from 'drizzle-orm';
import AdminChatInterfaceV2 from '@/components/AdminChatInterfaceV2';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ManagerMessagesPage() {
  // Read session directly — same pattern as /api/manager/users
  const cookieStore = await cookies();
  const managerId = cookieStore.get('userId')?.value;

  if (!managerId) redirect('/login');

  const currentUser = await db.query.users.findFirst({
    where: eq(users.id, managerId),
  });

  if (!currentUser || (!currentUser.isManager && currentUser.role !== 'admin' && !currentUser.isSuperAdmin)) {
    redirect('/login');
  }

  // Get assigned users — exact same query as /api/manager/users
  const assignedUsers = await db
    .select()
    .from(users)
    .where(and(eq(users.assignedManagerId, managerId), isNull(users.deletedAt)));

  if (assignedUsers.length === 0) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Messages</h1>
        <div className="bg-white rounded-xl p-12 text-center text-gray-500 shadow-sm border border-gray-200">
          <p className="font-semibold text-gray-700">No users assigned to you yet.</p>
          <p className="text-sm mt-2">
            Ask a super admin to go to <strong>Admin → Users</strong>, click the{' '}
            <strong>assign icon</strong> next to a user, and select you as their manager.
          </p>
        </div>
      </div>
    );
  }

  const assignedUserIds = assignedUsers.map(u => u.id);

  // Fetch all messages then filter in JS — avoids inArray SQL issues
  const assignedSet = new Set(assignedUserIds);
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

  const allMessages = rawMessages.filter(row => assignedSet.has(row.userId));

  // Build conversation map
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
          senderType: row.messageSender as 'user' | 'admin',
          createdAt: row.messageCreatedAt,
        },
      });
    }
  }

  // Include assigned users with no messages yet
  for (const u of assignedUsers) {
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

  const conversations = [];
  for (const [userId, data] of userMap) {
    let unreadCount = 0;
    if (data.lastMessage) {
      const unread = await db
        .select({ count: sql<number>`count(*)` })
        .from(messages)
        .where(and(
          eq(messages.userId, userId),
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

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6">Messages</h1>
      <AdminChatInterfaceV2 conversations={conversations} adminId={managerId} />
    </div>
  );
}
