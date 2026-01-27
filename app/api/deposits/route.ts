import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { deposits, transactionPins, users } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { sendBulkNotification } from '@/server/notifications';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, accountId, amount, paymentMethod, paymentProof, notes, pin } = body;

    // Validate input
    if (!userId || !accountId || !amount || !paymentMethod || !paymentProof) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    // Validate amount
    const depositAmount = parseFloat(amount);
    if (isNaN(depositAmount) || depositAmount < 3000) {
      return NextResponse.json(
        { error: 'Minimum deposit amount is $3,000' },
        { status: 400 }
      );
    }

    // Verify transaction PIN
    if (!pin || pin.length !== 4) {
      return NextResponse.json({ error: 'Transaction PIN is required' }, { status: 400 });
    }

    const userPin = await db
      .select()
      .from(transactionPins)
      .where(eq(transactionPins.userId, userId))
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

    // Create deposit record
    const depositId = `dep-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    await db.insert(deposits).values({
      id: depositId,
      userId,
      accountId,
      amount: amount.toString(),
      paymentMethod,
      paymentProof,
      notes: notes || null,
      status: 'PENDING',
    });

    // Notify all admins about new deposit request
    try {
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const admins = await db.select().from(users).where(eq(users.role, 'admin'));
      const adminIds = admins.map(admin => admin.id);

      if (adminIds.length > 0 && user.length > 0) {
        await sendBulkNotification(adminIds, {
          type: 'account_activity',
          title: 'New Deposit Request',
          message: `${user[0].fullName} submitted a deposit request for $${depositAmount.toLocaleString()}`,
          data: {
            depositId,
            userId,
            userName: user[0].fullName,
            amount: depositAmount.toString(),
            paymentMethod,
          },
        });
      }
    } catch (notifError) {
      console.error('Error sending deposit notification to admins:', notifError);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Deposit request submitted successfully. Our team will review and process it within 24 hours.',
      depositId,
    });
  } catch (error) {
    console.error('Deposit submission error:', error);
    return NextResponse.json(
      { error: 'An error occurred while submitting your deposit request' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch user deposits
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const userDeposits = await db.query.deposits.findMany({
      where: (deposits, { eq }) => eq(deposits.userId, userId),
      orderBy: (deposits, { desc }) => [desc(deposits.createdAt)],
    });

    return NextResponse.json({ deposits: userDeposits });
  } catch (error) {
    console.error('Error fetching deposits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deposits' },
      { status: 500 }
    );
  }
}
