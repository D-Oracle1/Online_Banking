import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdminAPI } from '@/lib/superadmin';
import { db } from '@/server/db';
import { users, accounts, transactions, loans, deposits, messages } from '@/shared/schema';
import { eq, sql, and, gte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const sessionCheck = await requireSuperAdminAPI(request);
  if (sessionCheck instanceof NextResponse) return sessionCheck;

  try {
    // Get total users count
    const totalUsersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    const totalUsers = Number(totalUsersResult[0]?.count || 0);

    // Get active users (logged in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeUsersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(gte(users.lastActiveAt, thirtyDaysAgo));
    const activeUsers = Number(activeUsersResult[0]?.count || 0);

    // Get total accounts
    const totalAccountsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(accounts);
    const totalAccounts = Number(totalAccountsResult[0]?.count || 0);

    // Get total balance across all accounts
    const totalBalanceResult = await db
      .select({ total: sql<number>`COALESCE(SUM(CAST(balance AS NUMERIC)), 0)` })
      .from(accounts);
    const totalBalance = Number(totalBalanceResult[0]?.total || 0);

    // Get transaction stats
    const totalTransactionsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(transactions);
    const totalTransactions = Number(totalTransactionsResult[0]?.count || 0);

    const transactionVolumeResult = await db
      .select({ total: sql<number>`COALESCE(SUM(CAST(amount AS NUMERIC)), 0)` })
      .from(transactions);
    const transactionVolume = Number(transactionVolumeResult[0]?.total || 0);

    // Get pending deposits
    const pendingDepositsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(deposits)
      .where(eq(deposits.status, 'PENDING'));
    const pendingDeposits = Number(pendingDepositsResult[0]?.count || 0);

    // Get pending loans
    const pendingLoansResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(loans)
      .where(eq(loans.status, 'PENDING'));
    const pendingLoans = Number(pendingLoansResult[0]?.count || 0);

    // Get total loans
    const totalLoansResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(loans);
    const totalLoans = Number(totalLoansResult[0]?.count || 0);

    // Get active loans
    const activeLoansResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(loans)
      .where(eq(loans.status, 'APPROVED'));
    const activeLoans = Number(activeLoansResult[0]?.count || 0);

    // Get unread messages
    const unreadMessagesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(eq(messages.isRead, false));
    const unreadMessages = Number(unreadMessagesResult[0]?.count || 0);

    // Get user registrations by day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentRegistrations = await db
      .select({
        date: sql<string>`DATE(${users.createdAt})`,
        count: sql<number>`count(*)`
      })
      .from(users)
      .where(gte(users.createdAt, sevenDaysAgo))
      .groupBy(sql`DATE(${users.createdAt})`)
      .orderBy(sql`DATE(${users.createdAt})`);

    return NextResponse.json({
      users: {
        total: totalUsers,
        active: activeUsers,
        registrationTrend: recentRegistrations
      },
      accounts: {
        total: totalAccounts,
        totalBalance: totalBalance
      },
      transactions: {
        total: totalTransactions,
        volume: transactionVolume
      },
      deposits: {
        pending: pendingDeposits
      },
      loans: {
        total: totalLoans,
        active: activeLoans,
        pending: pendingLoans
      },
      messages: {
        unread: unreadMessages
      }
    });
  } catch (error: any) {
    console.error('Statistics error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
