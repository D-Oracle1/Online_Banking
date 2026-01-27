import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { db } from '@/server/db';
import { deposits, accounts, transactions, users } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { sendTransactionAlertEmail } from '@/lib/email';
import { sendNotification } from '@/server/notifications';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const { depositId } = await request.json();

    if (!depositId) {
      return NextResponse.json(
        { error: 'Deposit ID is required' },
        { status: 400 }
      );
    }

    // Get deposit details
    const deposit = await db.query.deposits.findFirst({
      where: eq(deposits.id, depositId),
    });

    if (!deposit) {
      return NextResponse.json(
        { error: 'Deposit not found' },
        { status: 404 }
      );
    }

    if (deposit.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Deposit has already been processed' },
        { status: 400 }
      );
    }

    // Get account
    const account = await db.query.accounts.findFirst({
      where: eq(accounts.id, deposit.accountId),
    });

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Calculate new balance
    const newBalance = (parseFloat(account.balance) + parseFloat(deposit.amount)).toFixed(2);

    // Update deposit status
    await db.update(deposits)
      .set({
        status: 'APPROVED',
        updatedAt: new Date(),
      })
      .where(eq(deposits.id, depositId));

    // Update account balance
    await db.update(accounts)
      .set({
        balance: newBalance,
        isActivated: true, // Activate account on first approved deposit
      })
      .where(eq(accounts.id, deposit.accountId));

    // Create transaction record
    const transactionId = `txn-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const transactionDate = new Date();

    await db.insert(transactions).values({
      id: transactionId,
      accountId: deposit.accountId,
      type: 'DEPOSIT',
      amount: deposit.amount,
      status: 'SUCCESS',
      description: `Deposit via ${deposit.paymentMethod}`,
      createdAt: transactionDate,
    });

    // Send notification to user about deposit approval
    try {
      await sendNotification({
        userId: deposit.userId,
        type: 'account_activity',
        title: 'Deposit Approved',
        message: `Your deposit of $${parseFloat(deposit.amount).toLocaleString()} has been approved and credited to your account.`,
        data: {
          depositId,
          transactionId,
          amount: deposit.amount,
          newBalance,
          type: 'deposit_approved',
        },
      });
    } catch (notifError) {
      console.error('Error sending deposit approval notification:', notifError);
      // Don't fail the request if notification fails
    }

    // Send credit alert email to user
    const user = await db.query.users.findFirst({
      where: eq(users.id, deposit.userId),
    });

    if (user?.email) {
      try {
        await sendTransactionAlertEmail(
          user.email,
          user.fullName,
          {
            type: 'CREDIT',
            amount: deposit.amount,
            description: `Deposit via ${deposit.paymentMethod}`,
            balance: newBalance,
            transactionId,
            date: transactionDate,
          }
        );
      } catch (emailError) {
        console.error('Failed to send deposit alert email:', emailError);
        // Don't fail the deposit approval if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Deposit approved and account credited successfully',
    });
  } catch (error: any) {
    console.error('Error approving deposit:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to approve deposit' },
      { status: 500 }
    );
  }
}
