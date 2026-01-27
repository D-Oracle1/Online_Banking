import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { db } from '@/server/db';
import { transactions, accounts, users } from '@/shared/schema';
import { desc, eq } from 'drizzle-orm';
import AdminTransactionsClient from '@/components/AdminTransactionsClient';

export default async function AdminTransactionsPage() {
  const session = await getSession();

  if (!session || session.role !== 'admin') {
    redirect('/login');
  }

  // Fetch all transactions with account and user details
  const allTransactions = await db
    .select({
      id: transactions.id,
      accountId: transactions.accountId,
      type: transactions.type,
      amount: transactions.amount,
      recipientAccount: transactions.recipientAccountNumber,
      description: transactions.description,
      status: transactions.status,
      createdAt: transactions.createdAt,
      account: {
        id: accounts.id,
        accountNumber: accounts.accountNumber,
        userId: accounts.userId,
      },
      user: {
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        username: users.username,
      },
    })
    .from(transactions)
    .leftJoin(accounts, eq(transactions.accountId, accounts.id))
    .leftJoin(users, eq(accounts.userId, users.id))
    .orderBy(desc(transactions.createdAt))
    .limit(1000);

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">All Transactions</h1>
      <AdminTransactionsClient transactions={allTransactions} />
    </div>
  );
}
