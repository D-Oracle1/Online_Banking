import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAPI } from '@/lib/admin';
import { db } from '@/server/db';
import { users } from '@/shared/schema';
import { eq } from 'drizzle-orm';

// POST /api/admin/users/assign-manager
// Body: { userId, managerId } — managerId null to unassign
export async function POST(request: NextRequest) {
  const auth = await requireAdminAPI();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { userId, managerId } = await request.json();

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (managerId) {
    const manager = await db.query.users.findFirst({ where: eq(users.id, managerId) });
    if (!manager) {
      return NextResponse.json({ error: 'Manager not found' }, { status: 404 });
    }
    if (!manager.isManager && manager.role !== 'admin' && !manager.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Selected user does not have manager privileges' },
        { status: 400 }
      );
    }
  }

  await db
    .update(users)
    .set({ assignedManagerId: managerId || null })
    .where(eq(users.id, userId));

  return NextResponse.json({
    success: true,
    message: managerId ? 'Manager assigned successfully' : 'Manager unassigned',
  });
}
