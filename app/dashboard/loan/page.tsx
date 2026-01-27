import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { db } from '@/server/db';
import { loans, accounts } from '@/shared/schema';
import { eq, desc, and, or } from 'drizzle-orm';
import CurrentLoan from '@/components/CurrentLoan';
import LoanForm from '@/components/LoanForm';

export default async function LoanPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  // Fetch user's current active loan and account in parallel for better performance
  const [userLoans, userAccounts] = await Promise.all([
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
    db
      .select()
      .from(accounts)
      .where(eq(accounts.userId, session.id))
      .limit(1)
  ]);

  const currentLoan = userLoans.length > 0 ? userLoans[0] : null;
  const accountBalance = userAccounts.length > 0 ? userAccounts[0].balance : '0.00';

  // Check if loan is paid off
  const isPaidOff = currentLoan && currentLoan.totalRepayment &&
    parseFloat(currentLoan.amountPaid) >= parseFloat(currentLoan.totalRepayment);

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-0">
      <div className="mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Loan</h1>
        <p className="text-sm md:text-base text-gray-600 mt-2">
          {currentLoan && !isPaidOff
            ? 'View your loan status and make repayments'
            : 'Apply for a loan to meet your financial needs'}
        </p>
      </div>

      {currentLoan && !isPaidOff ? (
        <CurrentLoan loan={currentLoan} accountBalance={accountBalance} />
      ) : (
        <LoanForm />
      )}
    </div>
  );
}
