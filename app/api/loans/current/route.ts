import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { db } from '@/server/db';
import { loans } from '@/shared/schema';
import { eq, desc, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();

    // Get user's current loan (PENDING or APPROVED)
    const userLoans = await db
      .select()
      .from(loans)
      .where(
        eq(loans.userId, session.id)
      )
      .orderBy(desc(loans.createdAt))
      .limit(1);

    if (userLoans.length === 0) {
      return NextResponse.json({ loan: null });
    }

    return NextResponse.json({ loan: userLoans[0] });
  } catch (error: any) {
    console.error('Error fetching current loan:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch loan' },
      { status: 500 }
    );
  }
}
