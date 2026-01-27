import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { db } from '@/server/db';
import { transactionPins } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { generateId } from '@/lib/utils';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { pin } = await request.json();

    if (!pin || pin.length !== 4) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 400 });
    }

    const pinHash = await bcrypt.hash(pin, 10);

    const existingPin = await db.query.transactionPins.findFirst({
      where: eq(transactionPins.userId, session.id),
    });

    if (existingPin) {
      await db.update(transactionPins)
        .set({ pinHash, updatedAt: new Date() })
        .where(eq(transactionPins.userId, session.id));
    } else {
      await db.insert(transactionPins).values({
        id: generateId(),
        userId: session.id,
        pinHash,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Transaction PIN error:', error);
    return NextResponse.json({ error: 'Failed to set PIN' }, { status: 500 });
  }
}
