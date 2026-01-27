import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { db } from '@/server/db';
import { users } from '@/shared/schema';
import { eq } from 'drizzle-orm';

export async function POST() {
  try {
    const session = await requireAuth();

    // Generate a new 6-digit 2FA token
    const generateToken = () => Math.floor(100000 + Math.random() * 900000).toString();
    const newToken = generateToken();

    // Update user with new 2FA token
    await db.update(users)
      .set({
        twoFactorToken: newToken,
      })
      .where(eq(users.id, session.id));

    console.log(`[2FA ENABLE] User ${session.id} enabled 2FA with token: ${newToken}`);

    return NextResponse.json({
      success: true,
      token: newToken,
      message: '2FA enabled successfully',
    });
  } catch (error: any) {
    console.error('Error enabling 2FA:', error);
    return NextResponse.json(
      { error: 'Failed to enable 2FA' },
      { status: 500 }
    );
  }
}
