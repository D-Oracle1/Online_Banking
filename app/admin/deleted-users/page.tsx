import { requireAdmin } from '@/lib/admin';
import { db } from '@/server/db';
import { users, accounts } from '@/shared/schema';
import { desc, inArray, isNotNull } from 'drizzle-orm';
import DeletedUsersClient from '@/components/DeletedUsersClient';

export const dynamic = 'force-dynamic';

export default async function DeletedUsersPage() {
  await requireAdmin();

  const deletedUsers = await db.query.users.findMany({
    where: isNotNull(users.deletedAt),
    orderBy: [desc(users.deletedAt)],
  });

  const userIds = deletedUsers.map(u => u.id);
  const deleterIds = [...new Set(deletedUsers.map(u => u.deletedBy).filter((id): id is string => !!id))];

  const [userAccounts, deleters] = await Promise.all([
    userIds.length
      ? db.select().from(accounts).where(inArray(accounts.userId, userIds))
      : Promise.resolve([]),
    deleterIds.length
      ? db.select({ id: users.id, fullName: users.fullName }).from(users).where(inArray(users.id, deleterIds))
      : Promise.resolve([]),
  ]);

  const deleterNames = new Map(deleters.map(d => [d.id, d.fullName]));

  const rows = deletedUsers.map(user => ({
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    deletedAt: user.deletedAt!.toISOString(),
    deletedByName: user.deletedBy ? deleterNames.get(user.deletedBy) || 'Unknown admin' : null,
    accounts: userAccounts
      .filter(a => a.userId === user.id)
      .map(a => ({ id: a.id, accountNumber: a.accountNumber, balance: a.balance })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Deleted Users</h1>
        <p className="text-gray-600 mt-2">
          Restore deleted users, or permanently remove them to free their email and username for reuse
        </p>
      </div>

      <DeletedUsersClient users={rows} />
    </div>
  );
}
