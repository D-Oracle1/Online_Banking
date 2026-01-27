import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { users, pendingRegistrations } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { sendOTPEmail } from '@/lib/email';

// Generate 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if this is a pending registration
    const pendingReg = await db.query.pendingRegistrations.findFirst({
      where: eq(pendingRegistrations.email, email),
    });

    if (pendingReg) {
      // Resend OTP for pending registration
      const otp = generateOTP();
      const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Update pending registration with new OTP
      await db
        .update(pendingRegistrations)
        .set({
          emailOtp: otp,
          otpExpiresAt,
        })
        .where(eq(pendingRegistrations.id, pendingReg.id));

      // Send OTP email
      try {
        await sendOTPEmail(email, otp, pendingReg.fullName);
        console.log('OTP resent successfully to pending registration:', email);

        return NextResponse.json({
          success: true,
          message: 'New OTP sent to your email',
        });

      } catch (emailError) {
        console.error('Failed to send OTP email:', emailError);
        return NextResponse.json(
          {
            error: 'Failed to send email. Please try again or check your email address.',
            details: emailError instanceof Error ? emailError.message : 'Unknown email error'
          },
          { status: 500 }
        );
      }
    }

    // Check for existing verified user
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return NextResponse.json(
        { error: 'No registration found with this email. Please sign up first.' },
        { status: 404 }
      );
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      );
    }

    // Generate new OTP for existing unverified user
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Update user with new OTP
    await db
      .update(users)
      .set({
        emailOtp: otp,
        otpExpiresAt,
      })
      .where(eq(users.id, user.id));

    // Send OTP email using centralized email service
    try {
      await sendOTPEmail(email, otp, user.fullName);
      console.log('OTP resent successfully to:', email);

      return NextResponse.json({
        success: true,
        message: 'New OTP sent to your email',
      });

    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      return NextResponse.json(
        {
          error: 'Failed to send email. Please try again or check your email address.',
          details: emailError instanceof Error ? emailError.message : 'Unknown email error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Resend OTP error:', error);
    return NextResponse.json(
      { error: 'An error occurred while resending OTP' },
      { status: 500 }
    );
  }
}
