import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { db } from '@/server/db';
import { loanRepayments } from '@/shared/schema';
import { eq } from 'drizzle-orm';

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

    const { repaymentId, reason } = await request.json();

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

    // Update repayment status to REJECTED
    await db
      .update(loanRepayments)
      .set({
        status: 'REJECTED',
        updatedAt: new Date(),
      })
      .where(eq(loanRepayments.id, repaymentId));

    return NextResponse.json({
      success: true,
      message: 'Repayment rejected successfully',
    });
  } catch (error: any) {
    console.error('Error rejecting loan repayment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reject repayment' },
      { status: 500 }
    );
  }
}
