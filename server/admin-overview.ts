import { db } from './db';
import { users, accounts, deposits, transactions, loans, messages } from '@shared/schema';
import { and, desc, eq, gte, isNull, sql } from 'drizzle-orm';
import { format, startOfDay, startOfMonth, subDays, subMonths } from 'date-fns';

const INCOMING_TYPES = new Set(['DEPOSIT', 'CREDIT']);
const OUTGOING_TYPES = new Set(['TRANSFER', 'WITHDRAWAL', 'DEBIT']);

export interface WeekDay {
  /** Single letter for the axis, e.g. "M" */
  label: string;
  /** e.g. "Mon 20 Oct" */
  fullLabel: string;
  deposits: number;
  outgoing: number;
}

/** Everything the admin overview dashboard shows, in one round of queries */
export async function getAdminOverview() {
  const now = new Date();
  const weekStart = startOfDay(subDays(now, 6));
  const monthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));

  const [userRows, accountRows, pendingDeposits, [pendingLoans], [unreadMessages], weekTransactions, recentTransactions] =
    await Promise.all([
      db
        .select({
          id: users.id,
          role: users.role,
          isSuperAdmin: users.isSuperAdmin,
          createdAt: users.createdAt,
          verificationStatus: users.verificationStatus,
          // Avoid loading the (base64) images themselves
          hasDocuments: sql<boolean>`(${users.profilePhoto} IS NOT NULL OR ${users.idDocument} IS NOT NULL)`,
        })
        .from(users)
        .where(isNull(users.deletedAt)),
      db
        .select({ balance: accounts.balance, isActivated: accounts.isActivated })
        .from(accounts)
        .where(isNull(accounts.deletedAt)),
      db
        .select({
          id: deposits.id,
          amount: deposits.amount,
          paymentMethod: deposits.paymentMethod,
          createdAt: deposits.createdAt,
          userName: users.fullName,
        })
        .from(deposits)
        .leftJoin(users, eq(deposits.userId, users.id))
        .where(eq(deposits.status, 'PENDING'))
        .orderBy(desc(deposits.createdAt)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(loans)
        .where(and(eq(loans.status, 'PENDING'), isNull(loans.deletedAt))),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(messages)
        .where(and(eq(messages.senderType, 'user'), eq(messages.isRead, false), isNull(messages.deletedAt))),
      db
        .select({ type: transactions.type, amount: transactions.amount, status: transactions.status, createdAt: transactions.createdAt })
        .from(transactions)
        .where(and(gte(transactions.createdAt, weekStart), isNull(transactions.deletedAt))),
      db
        .select({
          id: transactions.id,
          type: transactions.type,
          amount: transactions.amount,
          status: transactions.status,
          description: transactions.description,
          createdAt: transactions.createdAt,
          userName: users.fullName,
        })
        .from(transactions)
        .leftJoin(accounts, eq(transactions.accountId, accounts.id))
        .leftJoin(users, eq(accounts.userId, users.id))
        .where(isNull(transactions.deletedAt))
        .orderBy(desc(transactions.createdAt))
        .limit(3),
    ]);

  const customers = userRows.filter(u => u.role !== 'admin' && !u.isSuperAdmin);
  const newThisMonth = customers.filter(u => u.createdAt >= monthStart).length;
  const newLastMonth = customers.filter(u => u.createdAt >= lastMonthStart && u.createdAt < monthStart).length;

  const activeAccounts = accountRows.filter(a => a.isActivated).length;
  const totalBalance = accountRows.reduce((sum, a) => sum + parseFloat(a.balance || '0'), 0);

  // Successful money in vs money out per day for the last 7 days
  const week: WeekDay[] = Array.from({ length: 7 }, (_, i) => {
    const day = subDays(now, 6 - i);
    return { label: format(day, 'EEEEE'), fullLabel: format(day, 'EEE d MMM'), deposits: 0, outgoing: 0 };
  });
  const dayIndex = new Map(Array.from({ length: 7 }, (_, i) => [format(subDays(now, 6 - i), 'yyyy-MM-dd'), i]));
  for (const t of weekTransactions) {
    if (t.status !== 'SUCCESS') continue;
    const index = dayIndex.get(format(t.createdAt, 'yyyy-MM-dd'));
    if (index === undefined) continue;
    const amount = parseFloat(t.amount || '0');
    if (INCOMING_TYPES.has(t.type)) week[index].deposits += amount;
    else if (OUTGOING_TYPES.has(t.type)) week[index].outgoing += amount;
  }

  return {
    customers: customers.length,
    newThisMonth,
    newLastMonth,
    totalAccounts: accountRows.length,
    activeAccounts,
    pendingActivation: accountRows.length - activeAccounts,
    totalBalance,
    pendingDepositCount: pendingDeposits.length,
    latestPendingDeposits: pendingDeposits.slice(0, 2).map(d => ({ ...d, createdAt: d.createdAt.toISOString() })),
    pendingLoans: pendingLoans?.count ?? 0,
    unreadMessages: unreadMessages?.count ?? 0,
    usersToVerify: customers.filter(u => u.verificationStatus === 'pending' && u.hasDocuments).length,
    week,
    recentTransactions: recentTransactions.map(t => ({ ...t, createdAt: t.createdAt.toISOString() })),
  };
}

export type AdminOverview = Awaited<ReturnType<typeof getAdminOverview>>;
