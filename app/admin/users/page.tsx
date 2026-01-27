import { requireAdmin } from '@/lib/admin';
import { db } from '@/server/db';
import { users, accounts } from '@/shared/schema';
import { desc } from 'drizzle-orm';
import AdminUsersClient from '@/components/AdminUsersClient';

export default async function AdminUsersPage() {
  await requireAdmin();

  const allUsers = await db.query.users.findMany({
    orderBy: [desc(users.createdAt)],
  });

  // Fetch accounts for each user
  const usersWithAccounts = await Promise.all(
    allUsers.map(async (user) => {
      const userAccounts = await db.query.accounts.findMany({
        where: (accounts, { eq }) => eq(accounts.userId, user.id),
      });
      return {
        ...user,
        accounts: userAccounts,
      };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
        <p className="text-gray-600 mt-2">View, add, and manage user accounts</p>
      </div>

      <AdminUsersClient users={usersWithAccounts} />
    </div>
  );
}
