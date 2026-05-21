import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdminAPI } from '@/lib/superadmin';
import { db } from '@/server/db';
import { users } from '@/shared/schema';
import { eq } from 'drizzle-orm';

const VALID_ROLES = ['user', 'manager', 'admin', 'superAdmin'];

export async function POST(request: NextRequest) {
  const sessionCheck = await requireSuperAdminAPI(request);
  if (sessionCheck instanceof NextResponse) return sessionCheck;

  try {
    const { userId, role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json({ error: 'User ID and role are required' }, { status: 400 });
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Invalid role. Must be user, manager, admin, or superAdmin' }, { status: 400 });
    }

    const target = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!target.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent demoting yourself
    if (target[0].id === sessionCheck.id) {
      return NextResponse.json({ error: 'You cannot change your own role' }, { status: 403 });
    }

    const updates: Record<string, unknown> =
      role === 'superAdmin'
        ? { role: 'admin', isSuperAdmin: true, isManager: false }
        : role === 'admin'
        ? { role: 'admin', isSuperAdmin: false, isManager: false }
        : role === 'manager'
        ? { role: 'user', isManager: true, isSuperAdmin: false }
        : { role: 'user', isManager: false, isSuperAdmin: false };

    await db.update(users).set(updates).where(eq(users.id, userId));

    return NextResponse.json({ success: true, role });
  } catch (error: any) {
    console.error('Role update error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update role' }, { status: 500 });
  }
}
