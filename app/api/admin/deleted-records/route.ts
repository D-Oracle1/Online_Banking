import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/session';
import { db } from '@/server/db';
import { users, messages, accounts, loans, transactions } from '@/shared/schema';
import { isNotNull, desc } from 'drizzle-orm';

/**
 * Get all soft-deleted records across tables
 * For admin UI to view and restore deleted data
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdminAuth();

    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');

    let deletedRecords: any = {};

    // If specific type requested, only fetch that type
    if (entityType) {
      switch (entityType) {
        case 'users':
          deletedRecords.users = await db.query.users.findMany({
            where: isNotNull(users.deletedAt),
            orderBy: [desc(users.deletedAt)],
            limit,
          });
          break;
        case 'messages':
          deletedRecords.messages = await db.query.messages.findMany({
            where: isNotNull(messages.deletedAt),
            orderBy: [desc(messages.deletedAt)],
            limit,
          });
          break;
        case 'accounts':
          deletedRecords.accounts = await db.query.accounts.findMany({
            where: isNotNull(accounts.deletedAt),
            orderBy: [desc(accounts.deletedAt)],
            limit,
          });
          break;
        case 'loans':
          deletedRecords.loans = await db.query.loans.findMany({
            where: isNotNull(loans.deletedAt),
            orderBy: [desc(loans.deletedAt)],
            limit,
          });
          break;
        case 'transactions':
          deletedRecords.transactions = await db.query.transactions.findMany({
            where: isNotNull(transactions.deletedAt),
            orderBy: [desc(transactions.deletedAt)],
            limit,
          });
          break;
        default:
          return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 });
      }
    } else {
      // Fetch all deleted records (with limit for performance)
      const [deletedUsers, deletedMessages, deletedAccounts, deletedLoans, deletedTransactions] = await Promise.all([
        db.query.users.findMany({
          where: isNotNull(users.deletedAt),
          orderBy: [desc(users.deletedAt)],
          limit: 20,
        }),
        db.query.messages.findMany({
          where: isNotNull(messages.deletedAt),
          orderBy: [desc(messages.deletedAt)],
          limit: 50,
        }),
        db.query.accounts.findMany({
          where: isNotNull(accounts.deletedAt),
          orderBy: [desc(accounts.deletedAt)],
          limit: 20,
        }),
        db.query.loans.findMany({
          where: isNotNull(loans.deletedAt),
          orderBy: [desc(loans.deletedAt)],
          limit: 20,
        }),
        db.query.transactions.findMany({
          where: isNotNull(transactions.deletedAt),
          orderBy: [desc(transactions.deletedAt)],
          limit: 30,
        }),
      ]);

      deletedRecords = {
        users: deletedUsers,
        messages: deletedMessages,
        accounts: deletedAccounts,
        loans: deletedLoans,
        transactions: deletedTransactions,
        summary: {
          totalUsers: deletedUsers.length,
          totalMessages: deletedMessages.length,
          totalAccounts: deletedAccounts.length,
          totalLoans: deletedLoans.length,
          totalTransactions: deletedTransactions.length,
        },
      };
    }

    return NextResponse.json(deletedRecords);
  } catch (error) {
    console.error('Get deleted records error:', error);
    return NextResponse.json({ error: 'Failed to fetch deleted records' }, { status: 500 });
  }
}
