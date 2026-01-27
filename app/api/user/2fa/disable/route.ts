import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { db } from '@/server/db';
import { users } from '@/shared/schema';
import { eq } from 'drizzle-orm';

export async function POST() {
  try {
    const session = await requireAuth();

    // Clear the 2FA token
    await db.update(users)
      .set({
        twoFactorToken: null,
      })
      .where(eq(users.id, session.id));

    console.log(`[2FA DISABLE] User ${session.id} disabled 2FA`);

    return NextResponse.json({
      success: true,
      message: '2FA disabled successfully',
    });
  } catch (error: any) {
    console.error('Error disabling 2FA:', error);
    return NextResponse.json(
      { error: 'Failed to disable 2FA' },
      { status: 500 }
    );
  }
}
