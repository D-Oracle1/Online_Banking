import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { db } from '@/server/db';
import { users } from '@/shared/schema';
import { inArray } from 'drizzle-orm';
import { sendEmail } from '@/lib/email';
import { getBankName } from '@/lib/site-settings';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const { userIds, subject, message } = await request.json();
    const bankName = await getBankName();

    // Validate input
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one user' },
        { status: 400 }
      );
    }

    if (!subject || !subject.trim()) {
      return NextResponse.json(
        { error: 'Subject is required' },
        { status: 400 }
      );
    }

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Fetch user emails
    const selectedUsers = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
      })
      .from(users)
      .where(inArray(users.id, userIds));

    if (selectedUsers.length === 0) {
      return NextResponse.json(
        { error: 'No valid users found' },
        { status: 404 }
      );
    }

    // Send emails to all selected users
    let sentCount = 0;
    const errors: string[] = [];

    for (const user of selectedUsers) {
      try {
        await sendEmail({
          to: user.email,
          subject: subject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #1e3a8a; padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">${bankName}</h1>
              </div>
              <div style="padding: 30px; background-color: #f9fafb;">
                <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">Dear ${user.fullName},</p>
                <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
                  ${message.replace(/\n/g, '<br>')}
                </div>
              </div>
              <div style="background-color: #111827; padding: 20px; text-align: center;">
                <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                  © ${new Date().getFullYear()} ${bankName}. All rights reserved.
                </p>
              </div>
            </div>
          `,
        });
        sentCount++;
      } catch (error: any) {
        console.error(`Failed to send email to ${user.email}:`, error);
        errors.push(`Failed to send to ${user.email}`);
      }
    }

    return NextResponse.json({
      success: true,
      sentCount,
      totalUsers: selectedUsers.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Bulk email send error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send emails' },
      { status: 500 }
    );
  }
}
