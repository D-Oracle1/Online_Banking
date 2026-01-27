import { requireAuth } from '@/lib/session';
import { db } from '@/server/db';
import { accounts, transactions, users, loans } from '@/shared/schema';
import { eq, desc, and, or } from 'drizzle-orm';
import { formatCurrency } from '@/lib/utils';
import { getSiteSettings } from '@/lib/site-settings';
import Link from 'next/link';
import { DollarSign, CreditCard, AlertTriangle, TrendingUp, Lock } from 'lucide-react';
import TransactionsList from '@/components/TransactionsList';
import BalanceCard from '@/components/BalanceCard';

export default async function DashboardPage() {
  const session = await requireAuth();

  // Fetch user, account, active loan, and site settings in parallel for better performance
  const [user, userAccount, activeLoans, siteSettings] = await Promise.all([
    db.query.users.findFirst({
      where: eq(users.id, session.id),
    }),
    db.query.accounts.findFirst({
      where: eq(accounts.userId, session.id),
    }),
    db
      .select()
      .from(loans)
      .where(
        and(
          eq(loans.userId, session.id),
          or(
            eq(loans.status, 'PENDING'),
            eq(loans.status, 'APPROVED')
          )
        )
      )
      .orderBy(desc(loans.createdAt))
      .limit(1),
    getSiteSettings()
  ]);

  // Fetch transactions only after we have the account ID
  const recentTransactions = userAccount
    ? await db.query.transactions.findMany({
        where: eq(transactions.accountId, userAccount.id),
        orderBy: [desc(transactions.createdAt)],
        limit: 3,
      })
    : [];

  const activeLoan = activeLoans.length > 0 ? activeLoans[0] : null;
  const loanRemainingBalance = activeLoan && activeLoan.totalRepayment
    ? parseFloat(activeLoan.totalRepayment) - parseFloat(activeLoan.amountPaid)
    : 0;

  return (
    <div className="max-w-7xl mx-auto space-y-4 md:space-y-6 px-4 md:px-0">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Welcome to {siteSettings.bankName}</h1>
        <p className="text-sm md:text-base text-gray-600">Manage your funds, apply for loans, and track your financial growth with ease.</p>
      </div>

      <BalanceCard
        balance={userAccount?.balance || '0'}
        accountNumber={userAccount?.accountNumber || 'N/A'}
        accountType={userAccount?.accountType || 'Basic Savings'}
      />

      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <Link
          href="/dashboard/deposit"
          className="bg-white rounded-xl shadow-md p-4 md:p-6 hover:shadow-lg transition-shadow border border-gray-200"
        >
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <DollarSign className="w-8 h-8 md:w-10 md:h-10" style={{ color: siteSettings.buttonSuccess }} />
          </div>
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">Top Up Account</h3>
          <p className="text-gray-600 text-xs md:text-sm">Add funds to your account instantly</p>
        </Link>

        <Link
          href="/dashboard/loan"
          className="bg-white rounded-xl shadow-md p-4 md:p-6 hover:shadow-lg transition-shadow border border-gray-200"
        >
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <CreditCard className="w-8 h-8 md:w-10 md:h-10" style={{ color: siteSettings.primaryColor }} />
          </div>
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">Loan Application</h3>
          <p className="text-gray-600 text-xs md:text-sm">Apply for personal or business loans</p>
        </Link>

        <Link
          href="/dashboard/transaction-pin"
          className="bg-white rounded-xl shadow-md p-4 md:p-6 hover:shadow-lg transition-shadow border border-gray-200"
        >
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <Lock className="w-8 h-8 md:w-10 md:h-10" style={{ color: siteSettings.secondaryColor }} />
          </div>
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">Set Transaction PIN</h3>
          <p className="text-gray-600 text-xs md:text-sm">Secure your transactions with a PIN</p>
        </Link>
      </div>

      {/* Active Loan Widget */}
      {activeLoan && (
        <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl shadow-xl p-4 md:p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-6 h-6 md:w-8 md:h-8" />
              <h2 className="text-lg md:text-xl font-bold">Active Loan</h2>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              activeLoan.status === 'APPROVED'
                ? 'bg-green-500/20 text-green-100'
                : 'bg-yellow-500/20 text-yellow-100'
            }`}>
              {activeLoan.status === 'APPROVED' ? 'Active' : 'Pending Approval'}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-purple-200 text-xs mb-1">Loan Amount</p>
              <p className="text-xl md:text-2xl font-bold">{formatCurrency(activeLoan.amount)}</p>
            </div>
            {activeLoan.totalRepayment && (
              <>
                <div>
                  <p className="text-purple-200 text-xs mb-1">Amount Paid</p>
                  <p className="text-xl md:text-2xl font-bold">{formatCurrency(activeLoan.amountPaid)}</p>
                </div>
                <div>
                  <p className="text-purple-200 text-xs mb-1">Remaining</p>
                  <p className="text-xl md:text-2xl font-bold">{formatCurrency(loanRemainingBalance.toString())}</p>
                </div>
                <div>
                  <p className="text-purple-200 text-xs mb-1">Progress</p>
                  <p className="text-xl md:text-2xl font-bold">
                    {((parseFloat(activeLoan.amountPaid) / parseFloat(activeLoan.totalRepayment)) * 100).toFixed(0)}%
                  </p>
                </div>
              </>
            )}
          </div>

          {activeLoan.status === 'APPROVED' && activeLoan.totalRepayment && loanRemainingBalance > 0 && (
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">
                You have an outstanding loan balance.
                <Link href="/dashboard/loan" className="font-semibold underline ml-1">
                  Make a payment
                </Link>
              </p>
            </div>
          )}

          {activeLoan.status === 'PENDING' && (
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <p className="text-sm">
                Your loan application is under review. We'll notify you once it's processed.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-4 md:p-6 border border-gray-200">
        <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">Recent Transactions</h2>
        <TransactionsList
          transactions={recentTransactions}
          accountNumber={userAccount?.accountNumber || ''}
          userName={user?.fullName || ''}
        />
      </div>
    </div>
  );
}
