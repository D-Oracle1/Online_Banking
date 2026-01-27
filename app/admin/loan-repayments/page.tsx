import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { db } from '@/server/db';
import { loanRepayments, loans, users } from '@/shared/schema';
import { desc, eq } from 'drizzle-orm';
import AdminLoanRepaymentsClient from '@/components/AdminLoanRepaymentsClient';

export default async function AdminLoanRepaymentsPage() {
  const session = await getSession();

  if (!session || session.role !== 'admin') {
    redirect('/login');
  }

  // Fetch all loan repayments with loan and user details
  const allRepayments = await db
    .select({
      id: loanRepayments.id,
      loanId: loanRepayments.loanId,
      amount: loanRepayments.amount,
      paymentMethod: loanRepayments.paymentMethod,
      paymentProof: loanRepayments.paymentProof,
      status: loanRepayments.status,
      createdAt: loanRepayments.createdAt,
      loan: {
        id: loans.id,
        userId: loans.userId,
        amount: loans.amount,
        purpose: loans.purpose,
        totalRepayment: loans.totalRepayment,
        amountPaid: loans.amountPaid,
      },
      user: {
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        username: users.username,
      },
    })
    .from(loanRepayments)
    .leftJoin(loans, eq(loanRepayments.loanId, loans.id))
    .leftJoin(users, eq(loans.userId, users.id))
    .orderBy(desc(loanRepayments.createdAt));

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Loan Repayments</h1>
      <AdminLoanRepaymentsClient repayments={allRepayments} />
    </div>
  );
}
