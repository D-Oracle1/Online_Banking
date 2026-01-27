import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { db } from '@/server/db';
import { fixedSavings } from '@/shared/schema';
import { generateId } from '@/lib/utils';
import { eq, desc } from 'drizzle-orm';

// GET - Fetch all user's fixed savings
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();

    const userSavings = await db
      .select()
      .from(fixedSavings)
      .where(eq(fixedSavings.userId, session.id))
      .orderBy(desc(fixedSavings.createdAt));

    // Calculate current value with interest for each saving
    const savingsWithInterest = userSavings.map((saving) => {
      const principal = parseFloat(saving.amount);
      const rate = parseFloat(saving.interestRate) / 100;
      const term = saving.term / 12; // Convert months to years

      // Calculate matured value: P * (1 + r * t)
      const maturedValue = principal * (1 + rate * term);

      // Calculate current accrued interest based on time elapsed
      const now = new Date();
      const startDate = new Date(saving.createdAt);
      const maturityDate = new Date(saving.maturityDate);
      const totalDuration = maturityDate.getTime() - startDate.getTime();
      const elapsedDuration = now.getTime() - startDate.getTime();
      const progress = Math.min(elapsedDuration / totalDuration, 1);

      const accruedInterest = (maturedValue - principal) * progress;
      const currentValue = principal + accruedInterest;

      return {
        ...saving,
        maturedValue: maturedValue.toFixed(2),
        accruedInterest: accruedInterest.toFixed(2),
        currentValue: currentValue.toFixed(2),
        progress: (progress * 100).toFixed(1),
      };
    });

    return NextResponse.json({ savings: savingsWithInterest });
  } catch (error: any) {
    console.error('Get fixed savings error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch savings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { amount, term } = await request.json();

    if (!amount || amount < 1000) {
      return NextResponse.json({ error: 'Minimum amount is $1,000' }, { status: 400 });
    }

    const interestRates: { [key: number]: number } = {
      6: 3.5,
      12: 4.5,
      24: 5.5,
    };

    const interestRate = interestRates[term];
    if (!interestRate) {
      return NextResponse.json({ error: 'Invalid term' }, { status: 400 });
    }

    const maturityDate = new Date();
    maturityDate.setMonth(maturityDate.getMonth() + term);

    await db.insert(fixedSavings).values({
      id: generateId(),
      userId: session.id,
      amount: amount.toFixed(2),
      interestRate: interestRate.toFixed(2),
      term,
      maturityDate,
      status: 'ACTIVE',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fixed savings error:', error);
    return NextResponse.json({ error: 'Failed to create fixed savings' }, { status: 500 });
  }
}
