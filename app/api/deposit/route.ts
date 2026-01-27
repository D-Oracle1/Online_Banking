import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { db } from '@/server/db';
import { accounts, transactions } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { generateId } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { amount } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const userAccount = await db.query.accounts.findFirst({
      where: eq(accounts.userId, session.id),
    });

    if (!userAccount) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const newBalance = parseFloat(userAccount.balance) + amount;
    
    await db.update(accounts)
      .set({ balance: newBalance.toFixed(2) })
      .where(eq(accounts.id, userAccount.id));

    await db.insert(transactions).values({
      id: generateId(),
      accountId: userAccount.id,
      type: 'DEPOSIT',
      amount: amount.toFixed(2),
      status: 'SUCCESS',
      description: 'Top-up from Card',
    });

    return NextResponse.json({ success: true, newBalance });
  } catch (error) {
    console.error('Deposit error:', error);
    return NextResponse.json({ error: 'Failed to process deposit' }, { status: 500 });
  }
}
