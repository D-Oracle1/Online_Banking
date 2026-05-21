import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdminAPI } from '@/lib/superadmin';
import { db } from '@/server/db';
import { users, accounts, transactions, debitCards, debitCardPins, transactionPins, loans, loanRepayments } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { logUserDeletion } from '@/server/audit-logger';

export async function POST(request: NextRequest) {
  const sessionCheck = await requireSuperAdminAPI(request);
  if (sessionCheck instanceof NextResponse) return sessionCheck;

  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const userToDelete = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!userToDelete.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (userToDelete[0].isSuperAdmin) {
      return NextResponse.json({ error: 'Cannot delete super admin users' }, { status: 403 });
    }

    if (userToDelete[0].deletedAt) {
      return NextResponse.json({ success: true, message: 'User deleted successfully.' });
    }

    const deletedAt = new Date();
    const deletedBy = sessionCheck.id;

    const userAccount = await db.query.accounts.findFirst({ where: eq(accounts.userId, userId) });

    if (userAccount) {
      // Soft-delete loan repayments
      const userLoans = await db.query.loans.findMany({ where: eq(loans.userId, userId) });
      for (const loan of userLoans) {
        await db.update(loanRepayments).set({ deletedAt, deletedBy }).where(eq(loanRepayments.loanId, loan.id));
      }

      // Soft-delete loans
      await db.update(loans).set({ deletedAt, deletedBy }).where(eq(loans.userId, userId));

      // Soft-delete transactions (by accountId, not userId)
      await db.update(transactions).set({ deletedAt, deletedBy }).where(eq(transactions.accountId, userAccount.id));

      // Soft-delete debit card pins then cards
      const userCards = await db.query.debitCards.findMany({ where: eq(debitCards.userId, userId) });
      for (const card of userCards) {
        await db.update(debitCardPins).set({ deletedAt, deletedBy }).where(eq(debitCardPins.cardId, card.id));
      }
      await db.update(debitCards).set({ deletedAt, deletedBy }).where(eq(debitCards.userId, userId));

      // Soft-delete account
      await db.update(accounts).set({ deletedAt, deletedBy }).where(eq(accounts.userId, userId));
    }

    // Soft-delete transaction pins
    await db.update(transactionPins).set({ deletedAt, deletedBy }).where(eq(transactionPins.userId, userId));

    // Soft-delete user
    await db.update(users).set({ deletedAt, deletedBy }).where(eq(users.id, userId));

    // Audit log
    await logUserDeletion(deletedBy, userId, userToDelete[0], request as any);

    return NextResponse.json({ success: true, message: 'User soft-deleted successfully.' });
  } catch (error: any) {
    console.error('User deletion error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete user' }, { status: 500 });
  }
}
