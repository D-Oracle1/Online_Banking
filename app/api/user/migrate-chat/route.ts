import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { messages } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '@/lib/session';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { guestId } = await request.json();

    if (!guestId || typeof guestId !== 'string') {
      return NextResponse.json({ error: 'guestId required' }, { status: 400 });
    }

    // Don't migrate if they're the same
    if (guestId === session.id) {
      return NextResponse.json({ migrated: 0 });
    }

    // Move all messages from the guest ID to the real user ID
    const result = await db
      .update(messages)
      .set({ userId: session.id })
      .where(eq(messages.userId, guestId))
      .returning({ id: messages.id });

    return NextResponse.json({ migrated: result.length });
  } catch (error: any) {
    console.error('migrate-chat error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
