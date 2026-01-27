import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { db } from '@/server/db';
import { loans, accounts, transactions } from '@/shared/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const { loanId, interestRate } = await request.json();

    if (!loanId || !interestRate) {
      return NextResponse.json(
        { error: 'Loan ID and interest rate are required' },
        { status: 400 }
      );
    }

    // Validate interest rate
    const rate = parseFloat(interestRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      return NextResponse.json(
        { error: 'Invalid interest rate' },
        { status: 400 }
      );
    }

    // Get loan details
    const loan = await db.query.loans.findFirst({
      where: eq(loans.id, loanId),
    });

    if (!loan) {
      return NextResponse.json(
        { error: 'Loan not found' },
        { status: 404 }
      );
    }

    if (loan.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Loan has already been processed' },
        { status: 400 }
      );
    }

    // Get user's account
    const account = await db.query.accounts.findFirst({
      where: (accounts, { eq }) => eq(accounts.userId, loan.userId),
    });

    if (!account) {
      return NextResponse.json(
        { error: 'User account not found' },
        { status: 404 }
      );
    }

    // Calculate total repayment amount with interest
    const loanAmount = parseFloat(loan.amount);
    const termInYears = loan.term / 12;
    const totalInterest = loanAmount * (rate / 100) * termInYears;
    const totalRepayment = (loanAmount + totalInterest).toFixed(2);

    // Calculate new balance (add loan amount to account)
    const newBalance = (parseFloat(account.balance) + loanAmount).toFixed(2);

    // Update loan status with interest rate and total repayment
    await db.update(loans)
      .set({
        status: 'APPROVED',
        interestRate: rate.toFixed(2),
        totalRepayment,
        approvedAt: new Date(),
      })
      .where(eq(loans.id, loanId));

    // Credit account with loan amount
    await db.update(accounts)
      .set({
        balance: newBalance,
      })
      .where(eq(accounts.id, account.id));

    // Create transaction record
    await db.insert(transactions).values({
      id: `txn-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      accountId: account.id,
      type: 'DEPOSIT',
      amount: loan.amount,
      status: 'SUCCESS',
      description: `Loan disbursement - ${loan.purpose} (${loan.term} months @ ${rate}% interest)`,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: 'Loan approved and amount credited to account',
    });
  } catch (error: any) {
    console.error('Error approving loan:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to approve loan' },
      { status: 500 }
    );
  }
}
