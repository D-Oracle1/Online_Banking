import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/server/db';
import { transactionPins } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { currentPin, newPin } = await req.json();

    // Validate input
    if (!currentPin || !newPin) {
      return NextResponse.json(
        { error: 'Current PIN and new PIN are required' },
        { status: 400 }
      );
    }

    // Validate PIN format (4 digits)
    if (!/^\d{4}$/.test(currentPin) || !/^\d{4}$/.test(newPin)) {
      return NextResponse.json(
        { error: 'PIN must be exactly 4 digits' },
        { status: 400 }
      );
    }

    // Check if PINs are the same
    if (currentPin === newPin) {
      return NextResponse.json(
        { error: 'New PIN must be different from current PIN' },
        { status: 400 }
      );
    }

    // Get current PIN from database
    const existingPin = await db
      .select()
      .from(transactionPins)
      .where(eq(transactionPins.userId, session.id))
      .limit(1);

    if (existingPin.length === 0) {
      return NextResponse.json(
        { error: 'No transaction PIN found. Please set a PIN first.' },
        { status: 404 }
      );
    }

    // Verify current PIN
    const isValidPin = await bcrypt.compare(currentPin, existingPin[0].pinHash);

    if (!isValidPin) {
      return NextResponse.json(
        { error: 'Current PIN is incorrect' },
        { status: 401 }
      );
    }

    // Hash new PIN
    const newPinHash = await bcrypt.hash(newPin, 10);

    // Update PIN in database
    await db
      .update(transactionPins)
      .set({
        pinHash: newPinHash,
        updatedAt: new Date(),
      })
      .where(eq(transactionPins.userId, session.id));

    return NextResponse.json(
      { message: 'Transaction PIN changed successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Change PIN error:', error);
    return NextResponse.json(
      { error: 'Failed to change PIN' },
      { status: 500 }
    );
  }
}
