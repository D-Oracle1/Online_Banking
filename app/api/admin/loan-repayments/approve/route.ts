import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { db } from '@/server/db';
import { loanRepayments, loans, accounts, transactions } from '@/shared/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    // Check if user is admin
    if (session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const { repaymentId } = await request.json();

    if (!repaymentId) {
      return NextResponse.json(
        { error: 'Repayment ID is required' },
        { status: 400 }
      );
    }

    // Get repayment details
    const repaymentResult = await db
      .select()
      .from(loanRepayments)
      .where(eq(loanRepayments.id, repaymentId))
      .limit(1);

    if (repaymentResult.length === 0) {
      return NextResponse.json(
        { error: 'Repayment not found' },
        { status: 404 }
      );
    }

    const repayment = repaymentResult[0];

    if (repayment.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Repayment has already been processed' },
        { status: 400 }
      );
    }

    // Get loan details
    const loanResult = await db
      .select()
      .from(loans)
      .where(eq(loans.id, repayment.loanId))
      .limit(1);

    if (loanResult.length === 0) {
      return NextResponse.json(
        { error: 'Loan not found' },
        { status: 404 }
      );
    }

    const loan = loanResult[0];

    // Calculate new amounts
    const repaymentAmount = parseFloat(repayment.amount);
    const currentAmountPaid = parseFloat(loan.amountPaid);
    const totalRepayment = loan.totalRepayment ? parseFloat(loan.totalRepayment) : parseFloat(loan.amount);
    const newAmountPaid = currentAmountPaid + repaymentAmount;
    const newLoanStatus = newAmountPaid >= totalRepayment ? 'PAID' : 'APPROVED';

    // Update loan repayment status
    await db
      .update(loanRepayments)
      .set({
        status: 'APPROVED',
        updatedAt: new Date(),
      })
      .where(eq(loanRepayments.id, repaymentId));

    // Update loan amount paid and status
    await db
      .update(loans)
      .set({
        amountPaid: newAmountPaid.toFixed(2),
        status: newLoanStatus,
      })
      .where(eq(loans.id, loan.id));

    // Get user's account
    const userAccounts = await db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, loan.userId))
      .limit(1);

    if (userAccounts.length > 0) {
      // Create transaction record
      const transactionId = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      await db.insert(transactions).values({
        id: transactionId,
        accountId: userAccounts[0].id,
        type: 'LOAN_REPAYMENT',
        amount: repaymentAmount.toFixed(2),
        status: 'SUCCESS',
        description: `Loan repayment approved - ${loan.purpose}`,
        createdAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Repayment approved successfully',
      loanStatus: newLoanStatus,
    });
  } catch (error: any) {
    console.error('Error approving loan repayment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to approve repayment' },
      { status: 500 }
    );
  }
}
