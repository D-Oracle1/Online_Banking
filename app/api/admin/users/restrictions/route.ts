import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAPI } from '@/lib/admin';
import { db } from '@/server/db';
import { userRestrictions, users } from '@/shared/schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// GET /api/admin/users/restrictions?userId=xxx
export async function GET(request: NextRequest) {
  const auth = await requireAdminAPI();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  const restrictions = await db
    .select()
    .from(userRestrictions)
    .where(eq(userRestrictions.userId, userId))
    .orderBy(userRestrictions.createdAt);

  return NextResponse.json({ restrictions });
}

// POST /api/admin/users/restrictions — create restriction
export async function POST(request: NextRequest) {
  const auth = await requireAdminAPI();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { userId, restrictionCode, description } = await request.json();

  if (!userId || !restrictionCode || !description) {
    return NextResponse.json(
      { error: 'userId, restrictionCode, and description are required' },
      { status: 400 }
    );
  }

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const restriction = await db
    .insert(userRestrictions)
    .values({
      id: randomUUID(),
      userId,
      restrictionCode: restrictionCode.trim().toUpperCase(),
      description: description.trim(),
      isActive: true,
      createdBy: auth.id,
    })
    .returning();

  return NextResponse.json({ restriction: restriction[0] });
}

// DELETE /api/admin/users/restrictions?id=xxx — clear/deactivate restriction
export async function DELETE(request: NextRequest) {
  const auth = await requireAdminAPI();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'restriction id is required' }, { status: 400 });
  }

  await db
    .update(userRestrictions)
    .set({ isActive: false, clearedAt: new Date(), clearedBy: auth.id })
    .where(eq(userRestrictions.id, id));

  return NextResponse.json({ success: true });
}
