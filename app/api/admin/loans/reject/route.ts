import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { db } from '@/server/db';
import { loans } from '@/shared/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const { loanId, reason } = await request.json();

    if (!loanId) {
      return NextResponse.json(
        { error: 'Loan ID is required' },
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

    // Update loan status
    await db.update(loans)
      .set({
        status: 'REJECTED',
      })
      .where(eq(loans.id, loanId));

    return NextResponse.json({
      success: true,
      message: 'Loan rejected successfully',
    });
  } catch (error: any) {
    console.error('Error rejecting loan:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reject loan' },
      { status: 500 }
    );
  }
}
