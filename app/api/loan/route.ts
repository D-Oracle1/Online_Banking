import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { db } from '@/server/db';
import { loans, transactionPins } from '@/shared/schema';
import { generateId } from '@/lib/utils';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { amount, purpose, term, pin } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    if (!purpose || !term) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify transaction PIN
    if (!pin || pin.length !== 4) {
      return NextResponse.json({ error: 'Transaction PIN is required' }, { status: 400 });
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

    // Create loan application
    await db.insert(loans).values({
      id: generateId(),
      userId: session.id,
      amount: amount.toFixed(2),
      purpose,
      term,
      status: 'PENDING',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Loan application error:', error);
    return NextResponse.json({ error: 'Failed to process loan application' }, { status: 500 });
  }
}
