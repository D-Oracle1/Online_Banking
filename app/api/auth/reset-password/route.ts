import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { users } from '@/shared/schema';
import { eq, and, gt } from 'drizzle-orm';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    // Validate input
    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      );
    }

    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Find user with valid reset token
    const user = await db.query.users.findFirst({
      where: and(
        eq(users.passwordResetToken, token),
        gt(users.passwordResetExpiresAt, new Date())
      ),
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update password and clear reset token
    await db
      .update(users)
      .set({
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      })
      .where(eq(users.id, user.id));

    console.log(`Password reset successful for user: ${user.email}`);

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.',
    });
  } catch (error: any) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}

// Verify token endpoint (optional - for checking if token is still valid)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Find user with valid reset token
    const user = await db.query.users.findFirst({
      where: and(
        eq(users.passwordResetToken, token),
        gt(users.passwordResetExpiresAt, new Date())
      ),
    });

    if (!user) {
      return NextResponse.json(
        { valid: false, error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      email: user.email, // Return email to show user which account they're resetting
    });
  } catch (error: any) {
    console.error('Verify token error:', error);
    return NextResponse.json(
      { error: 'Failed to verify token' },
      { status: 500 }
    );
  }
}
