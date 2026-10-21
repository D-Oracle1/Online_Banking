import { requireAdmin } from '@/lib/admin';
import { db } from '@/server/db';
import { messages, users } from '@/shared/schema';
import { desc, eq, inArray, isNotNull, sql } from 'drizzle-orm';
import { attachmentUrl } from '@/server/chat';
import DeletedMessagesClient from '@/components/DeletedMessagesClient';

export const dynamic = 'force-dynamic';

const MAX_MESSAGES = 1000;

export default async function DeletedMessagesPage() {
  await requireAdmin();

  const rows = await db
    .select({
      id: messages.id,
      userId: messages.userId,
      message: messages.message,
      hasAttachment: sql<boolean>`${messages.attachment} IS NOT NULL`,
      senderType: messages.senderType,
      sentBy: messages.sentBy,
      createdAt: messages.createdAt,
      deletedAt: messages.deletedAt,
      deletedBy: messages.deletedBy,
      userName: users.fullName,
      userEmail: users.email,
    })
    .from(messages)
    .leftJoin(users, eq(messages.userId, users.id))
    .where(isNotNull(messages.deletedAt))
    .orderBy(desc(messages.deletedAt))
    .limit(MAX_MESSAGES);

  const deleterIds = [...new Set(rows.map(r => r.deletedBy).filter((id): id is string => !!id))];
  const deleters = deleterIds.length
    ? await db.select({ id: users.id, fullName: users.fullName }).from(users).where(inArray(users.id, deleterIds))
    : [];
  const deleterNames = new Map(deleters.map(d => [d.id, d.fullName]));

  // Guests have no user record; their name is stored on the messages they sent
  const guestNames = new Map<string, string>();
  for (const row of rows) {
    if (!row.userName && row.senderType === 'user' && row.sentBy && !guestNames.has(row.userId)) {
      guestNames.set(row.userId, row.sentBy);
    }
  }

  const deletedMessages = rows.map(row => ({
    id: row.id,
    userId: row.userId,
    userName: row.userName || guestNames.get(row.userId) || 'Guest User',
    userEmail: row.userEmail,
    isGuest: !row.userName,
    message: row.message,
    attachment: row.hasAttachment ? attachmentUrl(row.id) : null,
    senderType: row.senderType as 'user' | 'admin',
    createdAt: row.createdAt.toISOString(),
    deletedAt: row.deletedAt!.toISOString(),
    deletedByName: row.deletedBy ? deleterNames.get(row.deletedBy) || 'Unknown admin' : null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Deleted Messages</h1>
        <p className="text-gray-600 mt-2">
          Restore unsent messages and deleted conversations, or remove them permanently
        </p>
      </div>

      <DeletedMessagesClient messages={deletedMessages} limitReached={rows.length === MAX_MESSAGES} />
    </div>
  );
}
