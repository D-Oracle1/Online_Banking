import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { users } from '@/shared/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { email, unlockCode } = await request.json();

    if (!email || !unlockCode) {
      return NextResponse.json(
        { error: 'Email and unlock code are required' },
        { status: 400 }
      );
    }

    if (unlockCode.trim().length !== 6) {
      return NextResponse.json(
        { error: 'Invalid unlock code format. Code must be 6 digits.' },
        { status: 400 }
      );
    }

    // Get user by email
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or unlock code' },
        { status: 401 }
      );
    }

    // Check if unlock code exists
    if (!user.unlockCode) {
      return NextResponse.json(
        {
          error: 'No unlock code has been generated for this account. Please contact support.',
          requiresCodeGeneration: true
        },
        { status: 400 }
      );
    }

    // Check if unlock code has expired
    if (user.unlockCodeExpiresAt && new Date() > new Date(user.unlockCodeExpiresAt)) {
      return NextResponse.json(
        {
          error: 'Your unlock code has expired. Please contact support to generate a new code.',
          codeExpired: true
        },
        { status: 400 }
      );
    }

    // Verify unlock code matches
    if (user.unlockCode !== unlockCode.trim()) {
      return NextResponse.json(
        { error: 'Invalid unlock code. Please check and try again.' },
        { status: 401 }
      );
    }

    // Unlock code is valid - you can add additional logic here to unlock the account
    // For example, clearing failed login attempts, removing account restrictions, etc.
    console.log(`[UNLOCK CODE] Valid unlock code provided for user ${user.id}`);

    return NextResponse.json({
      success: true,
      message: 'Unlock code verified successfully',
      userId: user.id,
    });
  } catch (error: any) {
    console.error('Unlock code verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify unlock code' },
      { status: 500 }
    );
  }
}
