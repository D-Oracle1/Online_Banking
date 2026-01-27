import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/session';
import { db } from '@/server/db';
import { users, accounts, transactions, debitCards, debitCardPins, transactionPins, loans, loanRepayments } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { logRestore } from '@/server/audit-logger';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminAuth();

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if user exists
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.deletedAt) {
      return NextResponse.json({ error: 'User is not deleted' }, { status: 400 });
    }

    // Get user's account
    const userAccount = await db.query.accounts.findFirst({
      where: eq(accounts.userId, userId),
    });

    if (userAccount) {
      // Restore all related records in correct order

      // 1. Restore the account
      await db.update(accounts)
        .set({ deletedAt: null, deletedBy: null })
        .where(eq(accounts.userId, userId));

      // 2. Restore transactions
      await db.update(transactions)
        .set({ deletedAt: null, deletedBy: null })
        .where(eq(transactions.accountId, userAccount.id));

      // 3. Restore loans
      const userLoans = await db.query.loans.findMany({
        where: eq(loans.userId, userId),
      });

      await db.update(loans)
        .set({ deletedAt: null, deletedBy: null })
        .where(eq(loans.userId, userId));

      // 4. Restore loan repayments for each loan
      for (const loan of userLoans) {
        await db.update(loanRepayments)
          .set({ deletedAt: null, deletedBy: null })
          .where(eq(loanRepayments.loanId, loan.id));
      }

      // 5. Restore debit cards
      const userCards = await db.query.debitCards.findMany({
        where: eq(debitCards.userId, userId),
      });

      await db.update(debitCards)
        .set({ deletedAt: null, deletedBy: null })
        .where(eq(debitCards.userId, userId));

      // 6. Restore debit card pins
      for (const card of userCards) {
        await db.update(debitCardPins)
          .set({ deletedAt: null, deletedBy: null })
          .where(eq(debitCardPins.cardId, card.id));
      }
    }

    // 7. Restore transaction pins
    await db.update(transactionPins)
      .set({ deletedAt: null, deletedBy: null })
      .where(eq(transactionPins.userId, userId));

    // 8. Finally, restore the user
    await db.update(users)
      .set({ deletedAt: null, deletedBy: null })
      .where(eq(users.id, userId));

    // 9. Log the restoration for audit trail
    const adminId = (session as any).userId || 'admin';
    await logRestore(adminId, 'user', userId, request as any);

    return NextResponse.json({
      success: true,
      message: 'User and all associated records restored successfully'
    });
  } catch (error) {
    console.error('Restore user error:', error);
    return NextResponse.json({ error: 'Failed to restore user' }, { status: 500 });
  }
}
