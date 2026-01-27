import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, verifyPassword } from '@/lib/auth';
import { setSession } from '@/lib/session';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, twoFactorToken } = body;

    console.log('[LOGIN] Attempting login for:', email);
    console.log('[LOGIN] 2FA token provided:', twoFactorToken ? 'Yes' : 'No');

    // Validate input
    if (!email || !password) {
      console.log('[LOGIN] Validation failed: Missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    console.log('[LOGIN] Looking up user by email...');
    const user = await getUserByEmail(email);
    if (!user) {
      console.log('[LOGIN] User not found');
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    console.log('[LOGIN] User found:', user.id, user.email);

    // Verify password
    console.log('[LOGIN] Verifying password...');
    const isValidPassword = await verifyPassword(password, user.password);
    if (!isValidPassword) {
      console.log('[LOGIN] Invalid password');
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }
    console.log('[LOGIN] Password verified');

    // Check if user has 2FA enabled
    const hasTwoFactor = user.twoFactorToken && user.twoFactorToken.trim() !== '';
    console.log('[LOGIN] User has 2FA enabled:', hasTwoFactor);
    if (hasTwoFactor) {
      console.log('[LOGIN] User 2FA token:', user.twoFactorToken);
    }

    // If user has 2FA enabled but no token provided, request 2FA
    if (hasTwoFactor && !twoFactorToken) {
      console.log('[LOGIN] Requesting 2FA token from user');
      return NextResponse.json({
        requiresTwoFactor: true,
        message: 'Credentials verified. Please enter your 2FA token.',
      });
    }

    // Verify 2FA token if user has it enabled
    if (hasTwoFactor && twoFactorToken) {
      console.log('[LOGIN] Verifying 2FA token:', twoFactorToken);
      if (user.twoFactorToken !== twoFactorToken) {
        console.log('[LOGIN] Invalid 2FA token');
        return NextResponse.json(
          { error: 'Invalid 2FA token' },
          { status: 401 }
        );
      }
      console.log('[LOGIN] 2FA token verified');
    }

    // Create session after successful verification
    console.log('[LOGIN] Creating session for user:', user.id);
    await setSession(user.id);
    console.log('[LOGIN] Session created');

    // Revalidate paths to ensure fresh data after login
    console.log('[LOGIN] Revalidating paths...');
    revalidatePath('/admin');
    revalidatePath('/dashboard');

    console.log('[LOGIN] Login successful for:', user.email, 'Role:', user.role);
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        role: user.role || 'user',
      },
    });
  } catch (error: any) {
    console.error('[LOGIN] Error occurred:', error);
    console.error('[LOGIN] Error message:', error.message);
    console.error('[LOGIN] Error stack:', error.stack);
    return NextResponse.json(
      { error: 'An error occurred during login', details: error.message },
      { status: 500 }
    );
  }
}
