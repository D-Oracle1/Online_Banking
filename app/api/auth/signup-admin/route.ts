import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { users, accounts, debitCards } from '@/shared/schema';
import { hashPassword } from '@/lib/auth';

// IMPORTANT: This endpoint should be disabled after creating your first admin account
// Set this to false after creating your admin account for security
const ALLOW_ADMIN_SIGNUP = true;

export async function POST(request: NextRequest) {
  try {
    // Security check - disable this endpoint after first use
    if (!ALLOW_ADMIN_SIGNUP) {
      return NextResponse.json(
        { error: 'Admin signup is disabled. Please contact system administrator.' },
        { status: 403 }
      );
    }

    const { fullName, username, email, password } = await request.json();

    // Validate required fields
    if (!fullName || !username || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: (users, { or, eq }) =>
        or(eq(users.username, username), eq(users.email, email)),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username or email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate 2FA token (6 digits)
    const twoFactorToken = Math.floor(100000 + Math.random() * 900000).toString();

    // Generate IDs
    const userId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const accountId = `acc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const cardId = `card-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // Generate account number (10 digits)
    const accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();

    // Generate card number (16 digits)
    const cardNumber = Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join('');

    // Generate CVV
    const cvv = Math.floor(100 + Math.random() * 900).toString();

    // Generate expiry date (5 years from now)
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 5);
    const expiryMonth = String(expiryDate.getMonth() + 1).padStart(2, '0');
    const expiryYear = String(expiryDate.getFullYear()).slice(-2);
    const expiry = `${expiryMonth}/${expiryYear}`;

    // Create admin user
    await db.insert(users).values({
      id: userId,
      username,
      email,
      password: hashedPassword,
      fullName,
      twoFactorToken,
      role: 'admin', // Set as admin
      hasSeenWelcome: true, // Skip welcome modal for admin
      isEmailVerified: true, // Auto-verify admin email
      verificationStatus: 'verified', // Set as verified
      createdAt: new Date(),
    });

    // Create account
    await db.insert(accounts).values({
      id: accountId,
      userId,
      accountNumber,
      accountType: 'Basic Savings',
      balance: '0.00',
      isActivated: true, // Auto-activate admin account
      createdAt: new Date(),
    });

    // Create debit card
    await db.insert(debitCards).values({
      id: cardId,
      userId,
      accountId,
      cardNumber,
      cardholderName: fullName,
      expiryDate: expiry,
      cvv,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Admin account created successfully! Please disable this endpoint now.',
      accountNumber,
      twoFactorToken,
    });
  } catch (error: any) {
    console.error('Admin signup error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create admin account' },
      { status: 500 }
    );
  }
}
