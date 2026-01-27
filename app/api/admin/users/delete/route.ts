import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/session';
import { db } from '@/server/db';
import { users, accounts, transactions, debitCards, debitCardPins, transactionPins, loans, loanRepayments } from '@/shared/schema';
import { eq, isNull } from 'drizzle-orm';
import { softDelete } from '@/server/soft-delete';
import { logUserDeletion } from '@/server/audit-logger';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminAuth();

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if user exists and is not already deleted
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.deletedAt) {
      return NextResponse.json({ error: 'User is already deleted' }, { status: 400 });
    }

    // Get current timestamp for consistent soft-delete
    const deletedAt = new Date();
    const deletedBy = (session as any).userId || 'admin';

    // Get user's account
    const userAccount = await db.query.accounts.findFirst({
      where: eq(accounts.userId, userId),
    });

    if (userAccount) {
      // Soft-delete all related records in correct order

      // 1. Get all user's loans
      const userLoans = await db.query.loans.findMany({
        where: eq(loans.userId, userId),
      });

      // 2. Soft-delete loan repayments for each loan
      for (const loan of userLoans) {
        await db.update(loanRepayments)
          .set({ deletedAt, deletedBy })
          .where(eq(loanRepayments.loanId, loan.id));
      }

      // 3. Soft-delete loans
      await db.update(loans)
        .set({ deletedAt, deletedBy })
        .where(eq(loans.userId, userId));

      // 4. Soft-delete transactions
      await db.update(transactions)
        .set({ deletedAt, deletedBy })
        .where(eq(transactions.accountId, userAccount.id));

      // 5. Get and soft-delete debit card pins
      const userCards = await db.query.debitCards.findMany({
        where: eq(debitCards.userId, userId),
      });

      for (const card of userCards) {
        await db.update(debitCardPins)
          .set({ deletedAt, deletedBy })
          .where(eq(debitCardPins.cardId, card.id));
      }

      // 6. Soft-delete debit cards
      await db.update(debitCards)
        .set({ deletedAt, deletedBy })
        .where(eq(debitCards.userId, userId));

      // 7. Soft-delete account
      await db.update(accounts)
        .set({ deletedAt, deletedBy })
        .where(eq(accounts.userId, userId));
    }

    // 8. Soft-delete transaction pins
    await db.update(transactionPins)
      .set({ deletedAt, deletedBy })
      .where(eq(transactionPins.userId, userId));

    // 9. Finally, soft-delete the user
    await db.update(users)
      .set({ deletedAt, deletedBy })
      .where(eq(users.id, userId));

    // 10. Log the deletion for audit trail
    await logUserDeletion(deletedBy, userId, user, request as any);

    return NextResponse.json({
      success: true,
      message: 'User and all associated records soft-deleted successfully. Data can be restored if needed.'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
