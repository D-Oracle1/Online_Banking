import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { db } from '@/server/db';
import { loans, loanRepayments, accounts, transactions, transactionPins } from '@/shared/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const formData = await request.formData();

    const loanId = formData.get('loanId') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const paymentMethod = formData.get('paymentMethod') as string;
    const pin = formData.get('pin') as string | null;
    const paymentProofFile = formData.get('paymentProof') as File | null;

    if (!loanId || !amount || amount <= 0 || !paymentMethod) {
      return NextResponse.json(
        { error: 'Valid loan ID, amount, and payment method are required' },
        { status: 400 }
      );
    }

    // Get loan details
    const loanResult = await db
      .select()
      .from(loans)
      .where(and(eq(loans.id, loanId), eq(loans.userId, session.id)))
      .limit(1);

    if (loanResult.length === 0) {
      return NextResponse.json(
        { error: 'Loan not found' },
        { status: 404 }
      );
    }

    const loan = loanResult[0];

    if (loan.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Loan is not active' },
        { status: 400 }
      );
    }

    const totalRepayment = loan.totalRepayment ? parseFloat(loan.totalRepayment) : parseFloat(loan.amount);
    const amountPaid = parseFloat(loan.amountPaid);
    const remainingBalance = totalRepayment - amountPaid;

    if (amount > remainingBalance) {
      return NextResponse.json(
        { error: 'Amount exceeds remaining balance' },
        { status: 400 }
      );
    }

    let paymentProof: string | null = null;

    // Handle file upload for proof
    if (paymentProofFile) {
      const bytes = await paymentProofFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const filename = `loan-repayment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${
        paymentProofFile.name.split('.').pop()
      }`;
      const filepath = join(process.cwd(), 'public', 'uploads', filename);

      await writeFile(filepath, buffer);
      paymentProof = `/uploads/${filename}`;
    }

    // If payment method is BALANCE, verify PIN and process immediately
    if (paymentMethod === 'BALANCE') {
      if (!pin || pin.length !== 4) {
        return NextResponse.json({ error: 'Transaction PIN is required for balance payment' }, { status: 400 });
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

      // Get user's account
      const userAccounts = await db
        .select()
        .from(accounts)
        .where(eq(accounts.userId, session.id))
        .limit(1);

      if (userAccounts.length === 0) {
        return NextResponse.json(
          { error: 'Account not found' },
          { status: 404 }
        );
      }

      const account = userAccounts[0];
      const currentBalance = parseFloat(account.balance);

      if (currentBalance < amount) {
        return NextResponse.json(
          { error: 'Insufficient account balance' },
          { status: 400 }
        );
      }

      // Calculate new balances
      const newAccountBalance = currentBalance - amount;
      const newAmountPaid = amountPaid + amount;
      const newStatus = newAmountPaid >= totalRepayment ? 'PAID' : 'APPROVED';

      // Update account balance
      await db
        .update(accounts)
        .set({ balance: newAccountBalance.toFixed(2) })
        .where(eq(accounts.id, account.id));

      // Update loan
      await db
        .update(loans)
        .set({
          amountPaid: newAmountPaid.toFixed(2),
          status: newStatus,
        })
        .where(eq(loans.id, loanId));

      // Record repayment with APPROVED status
      const repaymentId = `repay-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      await db.insert(loanRepayments).values({
        id: repaymentId,
        loanId,
        amount: amount.toFixed(2),
        paymentMethod,
        paymentProof,
        status: 'APPROVED',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create transaction record
      const transactionId = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      await db.insert(transactions).values({
        id: transactionId,
        accountId: account.id,
        type: 'LOAN_REPAYMENT',
        amount: amount.toFixed(2),
        status: 'SUCCESS',
        description: `Loan repayment - ${loan.purpose}`,
        createdAt: new Date(),
      });

      return NextResponse.json({
        success: true,
        message: 'Repayment successful',
        remainingBalance: (remainingBalance - amount).toFixed(2),
        newAccountBalance: newAccountBalance.toFixed(2),
        loanStatus: newStatus,
      });
    }

    // For other payment methods, create pending repayment
    const repaymentId = `repay-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    await db.insert(loanRepayments).values({
      id: repaymentId,
      loanId,
      amount: amount.toFixed(2),
      paymentMethod,
      paymentProof,
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Repayment request submitted successfully. Awaiting admin approval.',
    });
  } catch (error: any) {
    console.error('Error processing loan repayment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process repayment' },
      { status: 500 }
    );
  }
}
