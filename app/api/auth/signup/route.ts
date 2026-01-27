import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, getUserByEmail } from '@/lib/auth';
import { setSession } from '@/lib/session';
import { db } from '@/server/db';
import { users, accounts, debitCards } from '@/shared/schema';
import { generateAccountNumber, generateCardNumber, generateCVV, generateExpiryDate } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName, username } = body;

    // Validate input
    if (!email || !password || !fullName || !username) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user ID
    const userId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Generate 6-digit 2FA token
    const twoFactorToken = Math.floor(100000 + Math.random() * 900000).toString();

    // Create user
    await db.insert(users).values({
      id: userId,
      username,
      email,
      password: hashedPassword,
      fullName,
      twoFactorToken,
    });

    // Create account
    const accountNumber = generateAccountNumber();
    const accountId = `acc-${Date.now()}`;

    await db.insert(accounts).values({
      id: accountId,
      userId,
      accountNumber,
      accountType: 'Basic Savings',
      balance: '0.00',
    });

    // Create debit card
    await db.insert(debitCards).values({
      id: `card-${Date.now()}`,
      userId,
      accountId,
      cardNumber: generateCardNumber(),
      cvv: generateCVV(),
      expiryDate: generateExpiryDate(),
      cardholderName: fullName,
    });

    // Set session
    await setSession(userId);

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email,
        username,
        fullName,
      },
      twoFactorToken,
      message: 'Account created successfully! Save your 2FA token - you will need it to log in.',
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An error occurred during signup' },
      { status: 500 }
    );
  }
}
