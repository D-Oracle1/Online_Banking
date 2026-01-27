import { requireAuth } from '@/lib/session';
import { db } from '@/server/db';
import { accounts, transactions } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import AccountChartComponent from '@/components/AccountChartComponent';

export default async function AccountChartPage() {
  const session = await requireAuth();

  const account = await db.query.accounts.findFirst({
    where: eq(accounts.userId, session.id),
  });

  const allTransactions = await db.query.transactions.findMany({
    where: eq(transactions.accountId, account?.id || ''),
  });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-xl shadow-md p-8 border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Account Chart</h1>
        <p className="text-gray-600 mb-8">Visual representation of your account balance over time</p>
        
        <AccountChartComponent 
          currentBalance={parseFloat(account?.balance || '0')}
          transactions={allTransactions}
        />
      </div>
    </div>
  );
}
