import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { users } from '@/shared/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    await db.update(users)
      .set({ hasSeenWelcome: true })
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking welcome as seen:', error);
    return NextResponse.json(
      { error: 'Failed to update welcome status' },
      { status: 500 }
    );
  }
}
