import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { users } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { sendEmail } from '@/lib/email';
import { getBankName } from '@/lib/site-settings';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    const bankName = await getBankName();

    // Validate email
    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    // Always return success message (security best practice - don't reveal if email exists)
    const successMessage = 'If an account exists with this email, you will receive password reset instructions.';

    if (!user) {
      // Return success even if user doesn't exist (security)
      return NextResponse.json({
        success: true,
        message: successMessage,
      });
    }

    // Generate secure reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Set expiration to 1 hour from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Save token to database
    await db
      .update(users)
      .set({
        passwordResetToken: resetToken,
        passwordResetExpiresAt: expiresAt,
      })
      .where(eq(users.id, user.id));

    // Get the base URL for the reset link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
                    (process.env.NODE_ENV === 'production'
                      ? 'https://www.sterlingcapitalbank.org'
                      : 'http://localhost:3000');

    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

    // Send password reset email (if SMTP is configured)
    let emailSent = false;
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
      try {
        await sendEmail({
          to: user.email,
          subject: 'Reset Your ${bankName} Password',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #1e3a8a; padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">${bankName}</h1>
              </div>
              <div style="padding: 30px; background-color: #f9fafb;">
                <h2 style="color: #1e3a8a; margin-bottom: 20px;">Password Reset Request</h2>
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                  Dear ${user.fullName},
                </p>
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                  We received a request to reset your password for your ${bankName} account.
                </p>
                <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                  Click the button below to reset your password. This link will expire in 1 hour.
                </p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetLink}"
                     style="display: inline-block; background-color: #1e3a8a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                    Reset Password
                  </a>
                </div>
                <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                  If the button doesn't work, copy and paste this link into your browser:
                </p>
                <p style="color: #3b82f6; font-size: 14px; word-break: break-all;">
                  ${resetLink}
                </p>
                <div style="margin-top: 30px; padding: 15px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                  <p style="color: #92400e; font-size: 14px; margin: 0;">
                    <strong>Security Note:</strong> If you didn't request this password reset, please ignore this email or contact our support team immediately.
                  </p>
                </div>
              </div>
              <div style="background-color: #111827; padding: 20px; text-align: center;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                  © ${new Date().getFullYear()} ${bankName}. All rights reserved.
                </p>
                <p style="color: #9ca3af; font-size: 12px; margin: 5px 0 0 0;">
                  This is an automated message, please do not reply.
                </p>
              </div>
            </div>
          `,
        });

        emailSent = true;
        console.log(`Password reset email sent to: ${user.email}`);
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        // Continue - token is still saved and can be used
      }
    } else {
      console.warn('SMTP not configured - password reset email not sent');
    }

    return NextResponse.json({
      success: true,
      message: successMessage,
      // For development only - show reset link
      ...(process.env.NODE_ENV === 'development' && {
        resetLink,
      }),
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    );
  }
}
