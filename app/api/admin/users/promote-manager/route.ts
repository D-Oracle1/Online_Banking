import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAPI } from '@/lib/admin';
import { db } from '@/server/db';
import { users } from '@/shared/schema';
import { eq } from 'drizzle-orm';

// POST /api/admin/users/promote-manager
// Body: { userId, isManager: true|false }
export async function POST(request: NextRequest) {
  const auth = await requireAdminAPI();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { userId, isManager } = await request.json();

  if (!userId || typeof isManager !== 'boolean') {
    return NextResponse.json(
      { error: 'userId and isManager (boolean) are required' },
      { status: 400 }
    );
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (user.role === 'admin' || user.isSuperAdmin) {
    return NextResponse.json(
      { error: 'Cannot change manager status of an admin or super admin' },
      { status: 400 }
    );
  }

  await db
    .update(users)
    .set({ isManager })
    .where(eq(users.id, userId));

  return NextResponse.json({
    success: true,
    message: isManager
      ? `${user.fullName} has been promoted to Manager`
      : `${user.fullName}'s manager privileges have been removed`,
  });
}
