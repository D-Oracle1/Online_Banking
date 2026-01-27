import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { users } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const session = await requireAuth();
    const { isTyping } = await request.json();

    // Update user's typing status
    await db
      .update(users)
      .set({
        isTyping: isTyping === true,
        lastActiveAt: new Date()
      })
      .where(eq(users.id, session.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating typing status:', error);
    return NextResponse.json({ error: 'Failed to update typing status' }, { status: 500 });
  }
}
