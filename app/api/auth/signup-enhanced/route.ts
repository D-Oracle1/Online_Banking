import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { users, accounts, debitCards } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

// Generate 10-digit account number
function generateAccountNumber(): string {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const {
      username,
      email,
      password,
      fullName,
      phoneNumber,
      dateOfBirth,
      gender,
      nationality,
      address,
      city,
      state,
      postalCode,
      country,
      occupation,
      employer,
      annualIncome,
      profilePhoto,
    } = data;

    // Validate required fields
    if (!username || !email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Check if username is taken
    const existingUsername = await db.query.users.findFirst({
      where: eq(users.username, username),
    });

    if (existingUsername) {
      return NextResponse.json(
        { error: 'Username is already taken' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate 6-digit 2FA token
    const twoFactorToken = Math.floor(100000 + Math.random() * 900000).toString();

    // Create user
    const userId = nanoid();
    await db.insert(users).values({
      id: userId,
      username,
      email,
      password: hashedPassword,
      fullName,
      phoneNumber: phoneNumber || null,
      dateOfBirth: dateOfBirth || null,
      gender: gender || null,
      nationality: nationality || null,
      address: address || null,
      city: city || null,
      state: state || null,
      postalCode: postalCode || null,
      country: country || null,
      occupation: occupation || null,
      employer: employer || null,
      annualIncome: annualIncome || null,
      profilePhoto: profilePhoto || null,
      idType: null,
      idNumber: null,
      idDocument: null,
      emailOtp: null,
      otpExpiresAt: null,
      twoFactorToken,
      verificationStatus: 'verified',
      role: 'user',
      isEmailVerified: true,
      hasSeenWelcome: false,
    });

    console.log('User created successfully:', userId);

    // Generate unique account number
    let accountNumber = generateAccountNumber();
    let existingAccount = await db.query.accounts.findFirst({
      where: eq(accounts.accountNumber, accountNumber),
    });

    while (existingAccount) {
      accountNumber = generateAccountNumber();
      existingAccount = await db.query.accounts.findFirst({
        where: eq(accounts.accountNumber, accountNumber),
      });
    }

    // Create account
    const accountId = nanoid();
    await db.insert(accounts).values({
      id: accountId,
      userId,
      accountNumber,
      balance: '0.00',
      accountType: 'Savings',
      isActivated: false,
    });

    console.log('Account created successfully:', accountNumber);

    // Generate card details
    const cardNumber = '4' + Math.floor(Math.random() * 10 ** 15).toString().padStart(15, '0');
    const cvv = Math.floor(100 + Math.random() * 900).toString();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 4);

    // Create debit card
    const debitCardId = nanoid();
    await db.insert(debitCards).values({
      id: debitCardId,
      userId,
      accountId,
      cardNumber,
      cvv,
      expiryDate: expiryDate.toISOString(),
      cardholderName: fullName,
    });

    console.log('Debit card created successfully');

    // Return success with account details and 2FA token
    return NextResponse.json({
      success: true,
      message: 'Registration completed successfully! Welcome to your new account.',
      userId,
      fullName,
      accountNumber,
      twoFactorToken,
    });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
