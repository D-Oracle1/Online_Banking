import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { db } from '@/server/db';
import { users, accounts, debitCards } from '@/shared/schema';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const { fullName, username, email, password, role } = await request.json();

    // Validate required fields
    if (!fullName || !username || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if username or email already exists
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

    // Create user
    await db.insert(users).values({
      id: userId,
      username,
      email,
      password: hashedPassword,
      fullName,
      role: role || 'user',
      hasSeenWelcome: false,
      createdAt: new Date(),
    });

    // Create account
    await db.insert(accounts).values({
      id: accountId,
      userId,
      accountNumber,
      accountType: 'Basic Savings',
      balance: '0.00',
      isActivated: false,
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
      message: 'User created successfully',
      userId,
      accountNumber,
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}
