import { requireAuth } from '@/lib/session';
import { db } from '@/server/db';
import { accounts, transactions } from '@/shared/schema';
import { eq, desc } from 'drizzle-orm';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

export default async function TopupHistoryPage() {
  const session = await requireAuth();

  const userAccount = await db.query.accounts.findFirst({
    where: eq(accounts.userId, session.id),
  });

  const transactionHistory = await db.query.transactions.findMany({
    where: eq(transactions.accountId, userAccount?.id || ''),
    orderBy: [desc(transactions.createdAt)],
  });

  const deposits = transactionHistory.filter(t => t.type === 'DEPOSIT');

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-md p-8 border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Top-up History</h1>
        
        {deposits.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No top-up history yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {deposits.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-5 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{transaction.description}</p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(transaction.createdAt), 'dd MMM yyyy • hh:mm a')}
                  </p>
                </div>
                <div className="text-right ml-4">
                  <p className="font-bold text-xl text-green-600">{formatCurrency(transaction.amount)}</p>
                  <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                    transaction.status === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                    transaction.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {transaction.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
