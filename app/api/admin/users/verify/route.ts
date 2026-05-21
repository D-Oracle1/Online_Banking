import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAPI } from '@/lib/admin';
import { db } from '@/server/db';
import { users } from '@/shared/schema';
import { eq } from 'drizzle-orm';

// POST /api/admin/users/verify — approve or reject user verification
export async function POST(request: NextRequest) {
  const auth = await requireAdminAPI();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { userId, action } = await request.json();

  if (!userId || !action) {
    return NextResponse.json({ error: 'userId and action are required' }, { status: 400 });
  }

  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'action must be "approve" or "reject"' }, { status: 400 });
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const newStatus = action === 'approve' ? 'verified' : 'rejected';

  await db
    .update(users)
    .set({ verificationStatus: newStatus })
    .where(eq(users.id, userId));

  return NextResponse.json({ success: true, verificationStatus: newStatus });
}
