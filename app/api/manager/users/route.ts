import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { users, accounts } from '@/shared/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const currentUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!currentUser || (!currentUser.isManager && currentUser.role !== 'admin' && !currentUser.isSuperAdmin)) {
    return NextResponse.json({ error: 'Manager access required' }, { status: 403 });
  }

  // Admins/super admins see all users; managers see only their assigned users
  const assignedUsers = currentUser.role === 'admin' || currentUser.isSuperAdmin
    ? await db.select().from(users).where(isNull(users.deletedAt))
    : await db
        .select()
        .from(users)
        .where(and(eq(users.assignedManagerId, userId), isNull(users.deletedAt)));

  const usersWithAccounts = await Promise.all(
    assignedUsers.map(async (u) => {
      const userAccounts = await db
        .select()
        .from(accounts)
        .where(and(eq(accounts.userId, u.id), isNull(accounts.deletedAt)));
      return { ...u, accounts: userAccounts };
    })
  );

  return NextResponse.json({ users: usersWithAccounts });
}
