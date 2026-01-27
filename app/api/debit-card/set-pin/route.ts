import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/server/db';
import { debitCards, debitCardPins } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { cardId, pin } = await req.json();

    // Validate input
    if (!cardId || !pin) {
      return NextResponse.json(
        { error: 'Card ID and PIN are required' },
        { status: 400 }
      );
    }

    // Validate PIN format (4 digits)
    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json(
        { error: 'PIN must be exactly 4 digits' },
        { status: 400 }
      );
    }

    // Verify card belongs to user
    const card = await db
      .select()
      .from(debitCards)
      .where(eq(debitCards.id, cardId))
      .limit(1);

    if (card.length === 0 || card[0].userId !== session.id) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      );
    }

    // Check if PIN already exists
    const existingPin = await db
      .select()
      .from(debitCardPins)
      .where(eq(debitCardPins.cardId, cardId))
      .limit(1);

    if (existingPin.length > 0) {
      return NextResponse.json(
        { error: 'Card PIN already set. Use change PIN instead.' },
        { status: 400 }
      );
    }

    // Hash PIN
    const pinHash = await bcrypt.hash(pin, 10);

    // Insert PIN into database
    await db.insert(debitCardPins).values({
      id: nanoid(),
      cardId,
      pinHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json(
      { message: 'Card PIN set successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Set card PIN error:', error);
    return NextResponse.json(
      { error: 'Failed to set card PIN' },
      { status: 500 }
    );
  }
}
