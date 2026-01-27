import { requireAdmin } from '@/lib/admin';
import { db } from '@/server/db';
import { deposits, users, accounts } from '@/shared/schema';
import { eq, desc } from 'drizzle-orm';
import AdminDepositsClient from '@/components/AdminDepositsClient';

export default async function AdminDepositsPage() {
  await requireAdmin();

  const allDeposits = await db.query.deposits.findMany({
    orderBy: [desc(deposits.createdAt)],
  });

  // Fetch user and account details for each deposit
  const depositsWithDetails = await Promise.all(
    allDeposits.map(async (deposit) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, deposit.userId),
        columns: {
          id: true,
          fullName: true,
          email: true,
          username: true,
        },
      });
      const account = await db.query.accounts.findFirst({
        where: eq(accounts.id, deposit.accountId),
        columns: {
          id: true,
          accountNumber: true,
          balance: true,
        },
      });
      return {
        ...deposit,
        user: user || null,
        account: account || null,
      };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Deposits Approval</h1>
        <p className="text-gray-600 mt-2">Review and approve user deposit requests</p>
      </div>

      <AdminDepositsClient deposits={depositsWithDetails} />
    </div>
  );
}
