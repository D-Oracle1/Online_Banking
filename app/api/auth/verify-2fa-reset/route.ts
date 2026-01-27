import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { users } from '@/shared/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { email, twoFACode } = await request.json();

    if (!email || !twoFACode) {
      return NextResponse.json(
        { error: 'Email and 2FA reset code are required' },
        { status: 400 }
      );
    }

    if (twoFACode.trim().length !== 6) {
      return NextResponse.json(
        { error: 'Invalid 2FA reset code format. Code must be 6 digits.' },
        { status: 400 }
      );
    }

    // Get user by email
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or 2FA reset code' },
        { status: 401 }
      );
    }

    // Check if 2FA reset code exists
    if (!user.twoFACode) {
      return NextResponse.json(
        {
          error: 'No 2FA reset code has been generated for this account. Please contact support.',
          requiresCodeGeneration: true
        },
        { status: 400 }
      );
    }

    // Check if 2FA reset code has expired
    if (user.twoFACodeExpiresAt && new Date() > new Date(user.twoFACodeExpiresAt)) {
      return NextResponse.json(
        {
          error: 'Your 2FA reset code has expired. Please contact support to generate a new code.',
          codeExpired: true
        },
        { status: 400 }
      );
    }

    // Verify 2FA reset code matches
    if (user.twoFACode !== twoFACode.trim()) {
      return NextResponse.json(
        { error: 'Invalid 2FA reset code. Please check and try again.' },
        { status: 401 }
      );
    }

    // 2FA reset code is valid - clear the user's 2FA token to reset it
    await db.update(users)
      .set({
        twoFactorToken: null,
      })
      .where(eq(users.id, user.id));

    console.log(`[2FA RESET] Valid 2FA reset code provided for user ${user.id}. 2FA has been reset.`);

    return NextResponse.json({
      success: true,
      message: '2FA has been reset successfully. You can now set up 2FA again from your account settings.',
      userId: user.id,
    });
  } catch (error: any) {
    console.error('2FA reset verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify 2FA reset code' },
      { status: 500 }
    );
  }
}
