import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { db } from '@/server/db';
import { userRestrictions } from '@/shared/schema';
import { eq, and } from 'drizzle-orm';

// POST /api/transfer/clear-restriction
// User submits the unlock code given by support. If it matches an active restriction, clear it.
export async function POST(request: NextRequest) {
  const session = await requireAuth();

  const { code } = await request.json();

  if (!code || !code.trim()) {
    return NextResponse.json({ error: 'Restriction code is required' }, { status: 400 });
  }

  const normalizedCode = code.trim().toUpperCase();

  const activeRestrictions = await db
    .select()
    .from(userRestrictions)
    .where(and(eq(userRestrictions.userId, session.id), eq(userRestrictions.isActive, true)));

  const match = activeRestrictions.find(
    (r) => r.restrictionCode.toUpperCase() === normalizedCode
  );

  if (!match) {
    return NextResponse.json({ error: 'Invalid restriction code. Please contact support.' }, { status: 400 });
  }

  await db
    .update(userRestrictions)
    .set({ isActive: false, clearedAt: new Date(), clearedBy: session.id })
    .where(eq(userRestrictions.id, match.id));

  return NextResponse.json({ success: true, message: 'Restriction cleared. You may now proceed with your transfer.' });
}
