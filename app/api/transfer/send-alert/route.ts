import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { db } from '@/server/db';
import { accounts, users } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { sendTransactionAlertEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { transactionId, recipientAccountNumber, amount } = await request.json();

    // Get sender account and user
    const senderAccount = await db.query.accounts.findFirst({
      where: eq(accounts.userId, session.id),
    });

    if (!senderAccount) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const senderUser = await db.query.users.findFirst({
      where: eq(users.id, session.id),
    });

    if (!senderUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if recipient account exists in our system
    const recipientAccount = await db.query.accounts.findFirst({
      where: eq(accounts.accountNumber, recipientAccountNumber),
    });

    let recipientName = recipientAccountNumber;
    let recipientUser = null;

    if (recipientAccount) {
      recipientUser = await db.query.users.findFirst({
        where: eq(users.id, recipientAccount.userId),
      });
      if (recipientUser) {
        recipientName = recipientUser.fullName;
      }
    }

    const transferAmount = parseFloat(amount);
    const transactionDate = new Date();

    // Send debit alert email to sender
    if (senderUser.email) {
      try {
        await sendTransactionAlertEmail(
          senderUser.email,
          senderUser.fullName,
          {
            type: 'DEBIT',
            amount: amount,
            description: `Transfer to ${recipientAccountNumber}`,
            balance: senderAccount.balance,
            transactionId,
            date: transactionDate,
            recipientName,
            recipientAccountNumber,
          }
        );
      } catch (emailError) {
        console.error('Failed to send debit alert email:', emailError);
      }
    }

    // Send credit alert email to recipient if internal transfer
    if (recipientAccount && recipientUser?.email) {
      try {
        await sendTransactionAlertEmail(
          recipientUser.email,
          recipientUser.fullName,
          {
            type: 'CREDIT',
            amount: amount,
            description: `Transfer from ${senderAccount.accountNumber}`,
            balance: recipientAccount.balance,
            transactionId,
            date: transactionDate,
            recipientName: senderUser.fullName,
            recipientAccountNumber: senderAccount.accountNumber,
          }
        );
      } catch (emailError) {
        console.error('Failed to send credit alert email:', emailError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Send alert error:', error);
    return NextResponse.json({ error: 'Failed to send alerts' }, { status: 500 });
  }
}
