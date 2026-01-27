import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { db } from '@/server/db';
import { accounts, transactions, transactionPins } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { generateId } from '@/lib/utils';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { recipientAccountNumber, amount, pin } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Verify transaction PIN
    if (!pin || pin.length !== 4) {
      return NextResponse.json({ error: 'Transaction PIN is required' }, { status: 400 });
    }

    const userPin = await db
      .select()
      .from(transactionPins)
      .where(eq(transactionPins.userId, session.id))
      .limit(1);

    if (userPin.length === 0) {
      return NextResponse.json(
        { error: 'Transaction PIN not set. Please set up your PIN first.' },
        { status: 404 }
      );
    }

    const isPinValid = await bcrypt.compare(pin, userPin[0].pinHash);

    if (!isPinValid) {
      return NextResponse.json({ error: 'Invalid transaction PIN' }, { status: 401 });
    }

    const senderAccount = await db.query.accounts.findFirst({
      where: eq(accounts.userId, session.id),
    });

    if (!senderAccount) {
      return NextResponse.json({ error: 'Your account not found' }, { status: 404 });
    }

    const senderBalance = parseFloat(senderAccount.balance);
    const transferAmount = parseFloat(amount);

    if (isNaN(senderBalance) || isNaN(transferAmount)) {
      return NextResponse.json({ error: 'Invalid balance or amount' }, { status: 400 });
    }

    if (senderBalance < transferAmount) {
      return NextResponse.json({
        error: `Insufficient balance. Available: $${senderBalance.toFixed(2)}, Required: $${transferAmount.toFixed(2)}`
      }, { status: 400 });
    }

    // Check if recipient account exists
    const recipientAccount = await db.query.accounts.findFirst({
      where: eq(accounts.accountNumber, recipientAccountNumber),
    });

    if (recipientAccount && senderAccount.id === recipientAccount.id) {
      return NextResponse.json({ error: 'Cannot transfer to the same account' }, { status: 400 });
    }

    // Generate transaction ID for tracking
    const transactionId = generateId();

    // Return success WITHOUT debiting - will be debited after AML verification
    return NextResponse.json({
      success: true,
      status: 'PENDING_AML',
      transactionId,
      recipientAccountNumber,
      amount: transferAmount.toFixed(2),
      senderAccountId: senderAccount.id,
      recipientAccountId: recipientAccount?.id || null,
    });
  } catch (error) {
    console.error('Transfer error:', error);
    return NextResponse.json({ error: 'Failed to process transfer' }, { status: 500 });
  }
}
