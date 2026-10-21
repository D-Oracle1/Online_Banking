import { requireAdmin } from '@/lib/admin';
import { db } from '@/server/db';
import { users } from '@/shared/schema';
import { asc, isNull } from 'drizzle-orm';
import { DEFAULT_PERMISSIONS, getAllManagerPermissions } from '@/lib/manager-permissions';
import ManagerRulesClient from '@/components/ManagerRulesClient';

export const dynamic = 'force-dynamic';

export default async function ManagerRulesPage() {
  await requireAdmin();

  const activeUsers = await db
    .select({
      id: users.id,
      fullName: users.fullName,
      email: users.email,
      role: users.role,
      isManager: users.isManager,
      isSuperAdmin: users.isSuperAdmin,
      assignedManagerId: users.assignedManagerId,
    })
    .from(users)
    .where(isNull(users.deletedAt))
    .orderBy(asc(users.fullName));

  const managerRows = activeUsers.filter(u => u.isManager && u.role !== 'admin' && !u.isSuperAdmin);
  const permissions = await getAllManagerPermissions(managerRows.map(m => m.id));

  // Clients are regular users (not staff)
  const clients = activeUsers
    .filter(u => u.role !== 'admin' && !u.isSuperAdmin && !u.isManager)
    .map(u => ({ id: u.id, fullName: u.fullName, email: u.email, assignedManagerId: u.assignedManagerId }));

  const managers = managerRows.map(m => ({
    id: m.id,
    fullName: m.fullName,
    email: m.email,
    permissions: permissions.get(m.id) ?? { ...DEFAULT_PERMISSIONS },
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Manager Rules</h1>
        <p className="text-gray-600 mt-2">
          Choose what each manager can see and do for the clients assigned to them.
          Managers always see their clients&apos; basic profile; everything else is off until you switch it on.
        </p>
      </div>

      <ManagerRulesClient managers={managers} clients={clients} />
    </div>
  );
}
