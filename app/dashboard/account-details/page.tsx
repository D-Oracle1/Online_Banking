import { requireAuth } from '@/lib/session';
import { db } from '@/server/db';
import { accounts, transactions } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { formatCurrency } from '@/lib/utils';

export default async function AccountDetailsPage() {
  const session = await requireAuth();

  const account = await db.query.accounts.findFirst({
    where: eq(accounts.userId, session.id),
  });

  const allTransactions = await db.query.transactions.findMany({
    where: eq(transactions.accountId, account?.id || ''),
  });

  const totalDeposits = allTransactions
    .filter(t => t.type === 'DEPOSIT')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const totalTransfers = allTransactions
    .filter(t => t.type === 'TRANSFER')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-0">
      <div className="bg-white rounded-xl shadow-md p-4 md:p-8 border border-gray-200">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Account Details</h1>

        <div className="grid sm:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-blue-50 rounded-lg p-4 md:p-6 border border-blue-200">
            <p className="text-xs md:text-sm text-blue-600 mb-1">Account Type</p>
            <p className="text-lg md:text-xl font-bold text-blue-900">{account?.accountType}</p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 md:p-6 border border-blue-200">
            <p className="text-xs md:text-sm text-blue-600 mb-1">Account Number</p>
            <p className="text-lg md:text-xl font-bold text-blue-900">{account?.accountNumber}</p>
          </div>

          <div className="bg-green-50 rounded-lg p-4 md:p-6 border border-green-200">
            <p className="text-xs md:text-sm text-green-600 mb-1">Current Balance</p>
            <p className="text-xl md:text-2xl font-bold text-green-900">{formatCurrency(account?.balance || 0)}</p>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 md:p-6 border border-purple-200">
            <p className="text-xs md:text-sm text-purple-600 mb-1">Total Transactions</p>
            <p className="text-xl md:text-2xl font-bold text-purple-900">{allTransactions.length}</p>
          </div>
        </div>

        <div className="border-t pt-4 md:pt-6">
          <h2 className="text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4">Transaction Breakdown</h2>
          <div className="grid sm:grid-cols-2 gap-3 md:gap-4">
            <div className="flex justify-between p-3 md:p-4 bg-gray-50 rounded-lg">
              <span className="text-sm md:text-base text-gray-600">Total Deposits</span>
              <span className="font-bold text-sm md:text-base text-green-600">{formatCurrency(totalDeposits)}</span>
            </div>
            <div className="flex justify-between p-3 md:p-4 bg-gray-50 rounded-lg">
              <span className="text-sm md:text-base text-gray-600">Total Transfers</span>
              <span className="font-bold text-sm md:text-base text-blue-600">{formatCurrency(totalTransfers)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
