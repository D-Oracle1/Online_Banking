import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { db } from '@/server/db';
import { loans, users, accounts } from '@/shared/schema';
import { desc, eq } from 'drizzle-orm';
import AdminLoansClient from '@/components/AdminLoansClient';

export default async function AdminLoansPage() {
  const session = await getSession();

  if (!session || session.role !== 'admin') {
    redirect('/login');
  }

  // Fetch all loan applications with user and account details
  const allLoans = await db
    .select({
      id: loans.id,
      userId: loans.userId,
      amount: loans.amount,
      purpose: loans.purpose,
      term: loans.term,
      status: loans.status,
      createdAt: loans.createdAt,
      user: {
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        username: users.username,
      },
      account: {
        id: accounts.id,
        accountNumber: accounts.accountNumber,
        balance: accounts.balance,
      },
    })
    .from(loans)
    .leftJoin(users, eq(loans.userId, users.id))
    .leftJoin(accounts, eq(users.id, accounts.userId))
    .orderBy(desc(loans.createdAt));

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Loan Applications</h1>
      <AdminLoansClient loans={allLoans} />
    </div>
  );
}
