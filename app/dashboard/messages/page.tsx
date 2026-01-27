import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { db } from '@/server/db';
import { messages } from '@/shared/schema';
import { asc, eq } from 'drizzle-orm';
import UserMessagesClientV2 from '@/components/UserMessagesClientV2';

export default async function MessagesPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  // Fetch user's messages (oldest to newest)
  const userMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.userId, session.id))
    .orderBy(asc(messages.createdAt));

  // Type cast to ensure senderType is properly typed
  const typedMessages = userMessages.map(msg => ({
    ...msg,
    senderType: msg.senderType as 'user' | 'admin'
  }));

  return (
    <div className="max-w-5xl mx-auto">
      <UserMessagesClientV2 messages={typedMessages} userName={session.fullName} />
    </div>
  );
}
