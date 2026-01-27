import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { db } from '@/server/db';
import { transactionPins } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { pin } = await request.json();

    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: 'Valid 4-digit PIN is required' },
        { status: 400 }
      );
    }

    // Get user's transaction PIN
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

    // Verify PIN
    const isValid = await bcrypt.compare(pin, userPin[0].pinHash);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid PIN' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'PIN verified successfully',
    });
  } catch (error: any) {
    console.error('Error verifying PIN:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify PIN' },
      { status: 500 }
    );
  }
}
