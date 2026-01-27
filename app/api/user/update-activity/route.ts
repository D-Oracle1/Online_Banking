import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { users } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { isTyping } = body;

    // Update user's last active time and typing status
    await db
      .update(users)
      .set({
        lastActiveAt: new Date(),
        isTyping: typeof isTyping === 'boolean' ? isTyping : false,
      })
      .where(eq(users.id, session.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user activity:', error);
    return NextResponse.json({ error: 'Failed to update activity' }, { status: 500 });
  }
}
