import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/session';
import { db } from '@/server/db';
import {
  users, accounts, transactions, debitCards, debitCardPins, transactionPins, loans, loanRepayments,
  deposits, fixedSavings, stockPortfolios, stockHoldings, stockTransactions, stockWatchlist,
  auditLogs, userPreferences, emailOtps, amlAlerts, userRestrictions, siteSettings,
  messages, notifications, pushSubscriptions,
} from '@/shared/schema';
import { eq, inArray } from 'drizzle-orm';
import { logPermanentDelete } from '@/server/audit-logger';

/**
 * Permanently delete a soft-deleted user and every record tied to them.
 * Frees the email/username so a new user can be created with them.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdminAuth();

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return NextResponse.json({ success: true, message: 'User already permanently deleted.' });
    }

    if (!user.deletedAt) {
      return NextResponse.json({ error: 'User must be deleted before it can be permanently removed' }, { status: 400 });
    }

    if (user.isSuperAdmin) {
      return NextResponse.json({ error: 'Cannot permanently delete super admin users' }, { status: 403 });
    }

    if (userId === session.id) {
      return NextResponse.json({ error: 'You cannot permanently delete yourself' }, { status: 400 });
    }

    await db.transaction(async (tx) => {
      // Runs a step inside a savepoint so tables/columns missing from the
      // production database don't abort the whole transaction.
      const optional = async (step: () => Promise<unknown>) => {
        try {
          await tx.transaction(async () => { await step(); });
        } catch (error: any) {
          // 42P01 = undefined table, 42703 = undefined column
          if (error?.code !== '42P01' && error?.code !== '42703') throw error;
        }
      };

      const accountIds = (await tx.select({ id: accounts.id }).from(accounts).where(eq(accounts.userId, userId))).map(a => a.id);
      const loanIds = (await tx.select({ id: loans.id }).from(loans).where(eq(loans.userId, userId))).map(l => l.id);
      const cardIds = (await tx.select({ id: debitCards.id }).from(debitCards).where(eq(debitCards.userId, userId))).map(c => c.id);

      // 1. Children of loans, cards and portfolios
      if (loanIds.length) await tx.delete(loanRepayments).where(inArray(loanRepayments.loanId, loanIds));
      if (cardIds.length) await tx.delete(debitCardPins).where(inArray(debitCardPins.cardId, cardIds));
      await optional(async () => {
        const portfolioIds = (await tx.select({ id: stockPortfolios.id }).from(stockPortfolios).where(eq(stockPortfolios.userId, userId))).map(p => p.id);
        if (portfolioIds.length) {
          await tx.delete(stockHoldings).where(inArray(stockHoldings.portfolioId, portfolioIds));
          await tx.delete(stockTransactions).where(inArray(stockTransactions.portfolioId, portfolioIds));
        }
        await tx.delete(stockTransactions).where(eq(stockTransactions.userId, userId));
        await tx.delete(stockWatchlist).where(eq(stockWatchlist.userId, userId));
        await tx.delete(stockPortfolios).where(eq(stockPortfolios.userId, userId));
      });

      // 2. Records that reference the user's accounts
      if (accountIds.length) await tx.delete(transactions).where(inArray(transactions.accountId, accountIds));
      await optional(() => tx.delete(deposits).where(eq(deposits.userId, userId)));
      await tx.delete(debitCards).where(eq(debitCards.userId, userId));

      // 3. Records that reference the user directly
      await tx.delete(loans).where(eq(loans.userId, userId));
      await optional(() => tx.delete(fixedSavings).where(eq(fixedSavings.userId, userId)));
      await tx.delete(transactionPins).where(eq(transactionPins.userId, userId));
      await optional(() => tx.delete(userPreferences).where(eq(userPreferences.userId, userId)));
      await optional(() => tx.delete(emailOtps).where(eq(emailOtps.userId, userId)));
      await optional(() => tx.delete(amlAlerts).where(eq(amlAlerts.userId, userId)));
      await optional(async () => {
        await tx.delete(userRestrictions).where(eq(userRestrictions.userId, userId));
        // Restrictions this user created on others are kept, attributed to the acting admin
        await tx.update(userRestrictions).set({ createdBy: session.id }).where(eq(userRestrictions.createdBy, userId));
      });
      await optional(() => tx.delete(auditLogs).where(eq(auditLogs.userId, userId)));
      await optional(() => tx.update(siteSettings).set({ updatedBy: null }).where(eq(siteSettings.updatedBy, userId)));
      await optional(() => tx.delete(messages).where(eq(messages.userId, userId)));
      await optional(() => tx.delete(notifications).where(eq(notifications.userId, userId)));
      await optional(() => tx.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, userId)));
      await optional(() => tx.update(users).set({ assignedManagerId: null }).where(eq(users.assignedManagerId, userId)));

      // 4. Accounts, then the user
      await tx.delete(accounts).where(eq(accounts.userId, userId));
      await tx.delete(users).where(eq(users.id, userId));
    });

    const { password, passwordResetToken, twoFactorToken, ...safeUserData } = user;
    await logPermanentDelete(session.id, 'user', userId, 'Permanently deleted from Deleted Users', safeUserData, request as any);

    return NextResponse.json({
      success: true,
      message: 'User permanently deleted. The email and username can now be reused.',
    });
  } catch (error: any) {
    console.error('Permanent delete user error:', error);
    return NextResponse.json({ error: error.message || 'Failed to permanently delete user' }, { status: 500 });
  }
}
