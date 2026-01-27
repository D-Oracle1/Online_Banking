import { requireAuth } from '@/lib/session';
import { db } from '@/server/db';
import { accounts, transactions } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default async function AccountSummaryPage() {
  const session = await requireAuth();

  const account = await db.query.accounts.findFirst({
    where: eq(accounts.userId, session.id),
  });

  const allTransactions = await db.query.transactions.findMany({
    where: eq(transactions.accountId, account?.id || ''),
  });

  const income = allTransactions
    .filter(t => t.type === 'DEPOSIT')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const expenses = allTransactions
    .filter(t => t.type === 'TRANSFER')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-md p-8 border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Account Summary</h1>
        
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-green-700 font-medium">Total Income</p>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-900">{formatCurrency(income)}</p>
          </div>
          
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-red-700 font-medium">Total Expenses</p>
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-3xl font-bold text-red-900">{formatCurrency(expenses)}</p>
          </div>
        </div>

        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <p className="text-sm text-blue-700 font-medium mb-2">Net Flow</p>
          <p className={`text-4xl font-bold ${income - expenses >= 0 ? 'text-green-900' : 'text-red-900'}`}>
            {formatCurrency(income - expenses)}
          </p>
        </div>

        <div className="mt-8 border-t pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Activity Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Deposits Made</span>
              <span className="font-bold">{allTransactions.filter(t => t.type === 'DEPOSIT').length}</span>
            </div>
            <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Transfers Made</span>
              <span className="font-bold">{allTransactions.filter(t => t.type === 'TRANSFER').length}</span>
            </div>
            <div className="flex justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Current Balance</span>
              <span className="font-bold text-blue-900">{formatCurrency(account?.balance || 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
