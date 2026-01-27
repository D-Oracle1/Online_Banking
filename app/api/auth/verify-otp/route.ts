import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { users, accounts, debitCards, pendingRegistrations } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { sendBulkNotification } from '@/server/notifications';

// Generate 10-digit account number
function generateAccountNumber(): string {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    // First, check if this is a pending registration
    const pendingReg = await db.query.pendingRegistrations.findFirst({
      where: eq(pendingRegistrations.email, email),
    });

    if (pendingReg) {
      // This is a NEW user completing registration

      // Check if OTP has expired
      if (pendingReg.otpExpiresAt && new Date() > pendingReg.otpExpiresAt) {
        return NextResponse.json(
          { error: 'OTP has expired. Please request a new one.' },
          { status: 400 }
        );
      }

      // Verify OTP
      if (pendingReg.emailOtp !== otp) {
        return NextResponse.json(
          { error: 'Invalid OTP code' },
          { status: 400 }
        );
      }

      // OTP is valid! Now create the actual user, account, and card

      // Generate 6-digit 2FA token
      const twoFactorToken = Math.floor(100000 + Math.random() * 900000).toString();

      // Create user
      const userId = nanoid();
      await db.insert(users).values({
        id: userId,
        username: pendingReg.username,
        email: pendingReg.email,
        password: pendingReg.password, // already hashed
        fullName: pendingReg.fullName,
        phoneNumber: pendingReg.phoneNumber,
        dateOfBirth: pendingReg.dateOfBirth,
        gender: pendingReg.gender,
        nationality: pendingReg.nationality,
        address: pendingReg.address,
        city: pendingReg.city,
        state: pendingReg.state,
        postalCode: pendingReg.postalCode,
        country: pendingReg.country,
        occupation: pendingReg.occupation,
        employer: pendingReg.employer,
        annualIncome: pendingReg.annualIncome,
        profilePhoto: pendingReg.profilePhoto,
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
        cardholderName: pendingReg.fullName,
      });

      console.log('Debit card created successfully');

      // Notify all admins about new user registration
      try {
        const admins = await db.select().from(users).where(eq(users.role, 'admin'));
        const adminIds = admins.map(admin => admin.id);

        if (adminIds.length > 0) {
          await sendBulkNotification(adminIds, {
            type: 'user_registration',
            title: 'New User Registration',
            message: `${pendingReg.fullName} (${pendingReg.email}) has registered and verified their account.`,
            data: {
              userId,
              userName: pendingReg.fullName,
              userEmail: pendingReg.email,
              accountNumber,
            },
          });
        }
      } catch (notifError) {
        console.error('Error sending registration notification to admins:', notifError);
        // Don't fail the request if notification fails
      }

      // Delete pending registration
      await db.delete(pendingRegistrations).where(eq(pendingRegistrations.id, pendingReg.id));
      console.log('Pending registration deleted');

      // Return success with account details
      return NextResponse.json({
        success: true,
        message: 'Registration completed successfully! Welcome to your new account.',
        userId,
        fullName: pendingReg.fullName,
        accountNumber,
        twoFactorToken,
      });
    }

    // If not a pending registration, check for existing user (legacy flow)
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return NextResponse.json(
        { error: 'No registration found with this email. Please sign up first.' },
        { status: 404 }
      );
    }

    // Check if OTP has expired
    if (user.otpExpiresAt && new Date() > user.otpExpiresAt) {
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Verify OTP
    if (user.emailOtp !== otp) {
      return NextResponse.json(
        { error: 'Invalid OTP code' },
        { status: 400 }
      );
    }

    // Update user verification status
    await db
      .update(users)
      .set({
        isEmailVerified: true,
        verificationStatus: 'verified',
        emailOtp: null,
        otpExpiresAt: null,
      })
      .where(eq(users.id, user.id));

    // Get account number
    const userAccount = await db.query.accounts.findFirst({
      where: eq(accounts.userId, user.id),
    });

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      userId: user.id,
      fullName: user.fullName,
      accountNumber: userAccount?.accountNumber || '',
      twoFactorToken: user.twoFactorToken,
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json(
      { error: 'An error occurred during verification' },
      { status: 500 }
    );
  }
}
