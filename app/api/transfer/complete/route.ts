import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { db } from '@/server/db';
import { accounts, transactions } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { generateId } from '@/lib/utils';
import { sendNotification } from '@/server/notifications';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { transactionId, amount, recipientAccountNumber, senderAccountId, recipientAccountId } = await request.json();

    if (!transactionId || !amount || !recipientAccountNumber || !senderAccountId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get sender account
    const senderAccount = await db.query.accounts.findFirst({
      where: eq(accounts.id, senderAccountId),
    });

    if (!senderAccount) {
      return NextResponse.json({ error: 'Sender account not found' }, { status: 404 });
    }

    // Verify the account belongs to the current user
    if (senderAccount.userId !== session.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const transferAmount = parseFloat(amount);
    const senderBalance = parseFloat(senderAccount.balance);

    // Double-check balance (in case it changed)
    if (senderBalance < transferAmount) {
      return NextResponse.json({
        error: `Insufficient balance. Available: $${senderBalance.toFixed(2)}, Required: $${transferAmount.toFixed(2)}`
      }, { status: 400 });
    }

    // Get recipient account if internal transfer
    const recipientAccount = recipientAccountId
      ? await db.query.accounts.findFirst({ where: eq(accounts.id, recipientAccountId) })
      : null;

    // Update balances
    if (recipientAccount) {
      // Internal transfer - update both accounts
      const newSenderBalance = senderBalance - transferAmount;
      const newRecipientBalance = parseFloat(recipientAccount.balance) + transferAmount;

      await db.update(accounts)
        .set({ balance: newSenderBalance.toFixed(2) })
        .where(eq(accounts.id, senderAccount.id));

      await db.update(accounts)
        .set({ balance: newRecipientBalance.toFixed(2) })
        .where(eq(accounts.id, recipientAccount.id));

      // Record transaction for recipient
      await db.insert(transactions).values({
        id: generateId(),
        accountId: recipientAccount.id,
        type: 'TRANSFER',
        amount: transferAmount.toFixed(2),
        status: 'SUCCESS',
        description: `Transfer from ${senderAccount.accountNumber}`,
        recipientAccountNumber: senderAccount.accountNumber,
      });
    } else {
      // External transfer - only deduct from sender
      const newSenderBalance = senderBalance - transferAmount;
      await db.update(accounts)
        .set({ balance: newSenderBalance.toFixed(2) })
        .where(eq(accounts.id, senderAccount.id));
    }

    // Record transaction for sender
    await db.insert(transactions).values({
      id: transactionId,
      accountId: senderAccount.id,
      type: 'TRANSFER',
      amount: transferAmount.toFixed(2),
      status: 'SUCCESS',
      description: `Transfer to ${recipientAccountNumber}`,
      recipientAccountNumber,
    });

    // Send notifications
    try {
      const newSenderBalance = senderBalance - transferAmount;

      // Notify sender about debit
      await sendNotification({
        userId: senderAccount.userId,
        type: 'account_activity',
        title: 'Transfer Sent',
        message: `You sent $${transferAmount.toLocaleString()} to ${recipientAccountNumber}. New balance: $${newSenderBalance.toLocaleString()}`,
        data: {
          transactionId,
          amount: transferAmount.toFixed(2),
          newBalance: newSenderBalance.toFixed(2),
          recipientAccountNumber,
          type: 'debit',
        },
      });

      // Notify recipient about credit (if internal transfer)
      if (recipientAccount) {
        const newRecipientBalance = parseFloat(recipientAccount.balance) + transferAmount;
        await sendNotification({
          userId: recipientAccount.userId,
          type: 'account_activity',
          title: 'Transfer Received',
          message: `You received $${transferAmount.toLocaleString()} from ${senderAccount.accountNumber}. New balance: $${newRecipientBalance.toLocaleString()}`,
          data: {
            transactionId: generateId(),
            amount: transferAmount.toFixed(2),
            newBalance: newRecipientBalance.toFixed(2),
            senderAccountNumber: senderAccount.accountNumber,
            type: 'credit',
          },
        });
      }
    } catch (notifError) {
      console.error('Error sending transfer notifications:', notifError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Transfer completed successfully',
    });
  } catch (error) {
    console.error('Complete transfer error:', error);
    return NextResponse.json({ error: 'Failed to complete transfer' }, { status: 500 });
  }
}
