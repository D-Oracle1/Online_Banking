import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { messages, users } from '@/shared/schema';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const managerId = cookieStore.get('userId')?.value;
  if (!managerId) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

  const assignedUsers = await db
    .select({ id: users.id, fullName: users.fullName, email: users.email })
    .from(users)
    .where(and(eq(users.assignedManagerId, managerId), isNull(users.deletedAt)));

  const assignedIds = assignedUsers.map(u => u.id);

  // Get all messages, check how many match
  const totalMessages = await db
    .select({ count: sql<number>`count(*)` })
    .from(messages)
    .where(sql`${messages.deletedAt} IS NULL`);

  // Sample 20 message userIds
  const sampleMessages = await db
    .select({ userId: messages.userId, senderType: messages.senderType })
    .from(messages)
    .where(sql`${messages.deletedAt} IS NULL`)
    .limit(20);

  return NextResponse.json({
    managerId,
    assignedUsers,
    assignedIds,
    totalMessagesInDB: Number(totalMessages[0]?.count),
    sampleMessageUserIds: sampleMessages,
    assignedIdsFoundInMessages: sampleMessages.filter(m => assignedIds.includes(m.userId)).length,
  });
}
