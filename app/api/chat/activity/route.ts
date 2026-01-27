import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { users } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const session = await requireAuth();

    // Update user's last active timestamp
    await db
      .update(users)
      .set({ lastActiveAt: new Date() })
      .where(eq(users.id, session.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating activity:', error);
    return NextResponse.json({ error: 'Failed to update activity' }, { status: 500 });
  }
}
