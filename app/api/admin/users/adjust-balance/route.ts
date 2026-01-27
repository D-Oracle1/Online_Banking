import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { db } from '@/server/db';
import { accounts, transactions } from '@/shared/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const { accountId, amount, type, description, senderName, senderAccount, senderBank } = await request.json();

    // Validate required fields
    if (!accountId || !amount || !type || !description) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // For credit transactions, validate sender details
    if (type === 'credit' && (!senderName || !senderAccount || !senderBank)) {
      return NextResponse.json(
        { error: 'Sender details are required for deposit transactions' },
        { status: 400 }
      );
    }

    // Validate amount
    const adjustmentAmount = parseFloat(amount);
    if (isNaN(adjustmentAmount) || adjustmentAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Get account
    const account = await db.query.accounts.findFirst({
      where: eq(accounts.id, accountId),
    });

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Calculate new balance
    const currentBalance = parseFloat(account.balance);
    let newBalance: number;

    if (type === 'credit') {
      // Add money
      newBalance = currentBalance + adjustmentAmount;
    } else if (type === 'debit') {
      // Subtract money
      newBalance = currentBalance - adjustmentAmount;

      // Check for negative balance
      if (newBalance < 0) {
        return NextResponse.json(
          { error: 'Insufficient balance for debit adjustment' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid adjustment type. Must be "credit" or "debit"' },
        { status: 400 }
      );
    }

    // Update account balance
    await db.update(accounts)
      .set({
        balance: newBalance.toFixed(2),
      })
      .where(eq(accounts.id, accountId));

    // Create transaction record with proper description
    let transactionDescription = description;

    if (type === 'credit' && senderName && senderAccount) {
      // For deposits, show sender information instead of "Admin adjustment"
      transactionDescription = `Transfer from ${senderName} (${senderBank}) - Account: ${senderAccount}. Ref: ${description}`;
    } else if (type === 'debit') {
      transactionDescription = `Admin debit: ${description}`;
    }

    await db.insert(transactions).values({
      id: `txn-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      accountId,
      type: type === 'credit' ? 'DEPOSIT' : 'WITHDRAWAL',
      amount: adjustmentAmount.toFixed(2),
      status: 'SUCCESS',
      description: transactionDescription,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: `Balance ${type === 'credit' ? 'credited' : 'debited'} successfully`,
      newBalance: newBalance.toFixed(2),
    });
  } catch (error: any) {
    console.error('Error adjusting balance:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to adjust balance' },
      { status: 500 }
    );
  }
}
