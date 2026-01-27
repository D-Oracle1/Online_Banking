import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { db } from '@/server/db';
import { deposits } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { sendNotification } from '@/server/notifications';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const { depositId, reason } = await request.json();

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

    // Update deposit status
    await db.update(deposits)
      .set({
        status: 'REJECTED',
        notes: reason || 'Rejected by admin',
        updatedAt: new Date(),
      })
      .where(eq(deposits.id, depositId));

    // Send notification to user about deposit rejection
    try {
      await sendNotification({
        userId: deposit.userId,
        type: 'account_activity',
        title: 'Deposit Rejected',
        message: `Your deposit of $${parseFloat(deposit.amount).toLocaleString()} has been rejected. ${reason ? `Reason: ${reason}` : 'Please contact support for more information.'}`,
        data: {
          depositId,
          amount: deposit.amount,
          reason: reason || 'Rejected by admin',
          type: 'deposit_rejected',
        },
      });
    } catch (notifError) {
      console.error('Error sending deposit rejection notification:', notifError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Deposit rejected successfully',
    });
  } catch (error: any) {
    console.error('Error rejecting deposit:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reject deposit' },
      { status: 500 }
    );
  }
}
