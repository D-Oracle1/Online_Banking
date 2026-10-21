import { db } from '@/server/db';
import { users } from '@/shared/schema';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { cookies } from 'next/headers';

/**
 * What a manager may see and do for the clients assigned to them.
 * With everything off, a manager only sees each client's basic profile
 * (name, email, username, join date). Admins set these per manager.
 */
export interface ManagerPermissions {
  viewContactInfo: boolean;   // phone, address, date of birth, occupation...
  viewAccounts: boolean;      // account number, balance, activation status
  viewTransactions: boolean;  // recent transactions
  viewMessages: boolean;      // read the chat with the client
  sendMessages: boolean;      // reply in the chat (requires viewMessages)
  deleteMessages: boolean;    // unsend messages / delete the conversation (requires viewMessages)
}

export type ManagerPermissionKey = keyof ManagerPermissions;

export const PERMISSION_KEYS: ManagerPermissionKey[] = [
  'viewContactInfo',
  'viewAccounts',
  'viewTransactions',
  'viewMessages',
  'sendMessages',
  'deleteMessages',
];

export const DEFAULT_PERMISSIONS: ManagerPermissions = {
  viewContactInfo: false,
  viewAccounts: false,
  viewTransactions: false,
  viewMessages: false,
  sendMessages: false,
  deleteMessages: false,
};

export const FULL_PERMISSIONS: ManagerPermissions = {
  viewContactInfo: true,
  viewAccounts: true,
  viewTransactions: true,
  viewMessages: true,
  sendMessages: true,
  deleteMessages: true,
};

/** Keep dependent permissions consistent: sending or deleting requires seeing the chat */
export function normalizePermissions(input: Partial<Record<string, unknown>>): ManagerPermissions {
  const permissions = { ...DEFAULT_PERMISSIONS };
  for (const key of PERMISSION_KEYS) {
    permissions[key] = input[key] === true;
  }
  if (!permissions.viewMessages) {
    permissions.sendMessages = false;
    permissions.deleteMessages = false;
  }
  return permissions;
}

// The table is created on first use so no manual migration is needed
let tableReady: Promise<void> | null = null;

function ensureTable() {
  tableReady ??= db.execute(sql`
    CREATE TABLE IF NOT EXISTS manager_permissions (
      manager_id text PRIMARY KEY,
      permissions text NOT NULL,
      updated_by text,
      updated_at timestamp NOT NULL DEFAULT now()
    )
  `).then(() => undefined).catch((error) => {
    tableReady = null;
    throw error;
  });
  return tableReady;
}

export async function getManagerPermissions(managerId: string): Promise<ManagerPermissions> {
  return (await getAllManagerPermissions([managerId])).get(managerId) ?? { ...DEFAULT_PERMISSIONS };
}

export async function getAllManagerPermissions(managerIds?: string[]): Promise<Map<string, ManagerPermissions>> {
  const map = new Map<string, ManagerPermissions>();
  if (managerIds && managerIds.length === 0) return map;

  await ensureTable();
  const result = await db.execute<{ manager_id: string; permissions: string }>(
    managerIds
      ? sql`SELECT manager_id, permissions FROM manager_permissions WHERE manager_id IN (${sql.join(managerIds.map(id => sql`${id}`), sql`, `)})`
      : sql`SELECT manager_id, permissions FROM manager_permissions`
  );

  for (const row of Array.from(result as unknown as { manager_id: string; permissions: string }[])) {
    try {
      map.set(row.manager_id, normalizePermissions(JSON.parse(row.permissions)));
    } catch {
      map.set(row.manager_id, { ...DEFAULT_PERMISSIONS });
    }
  }
  return map;
}

export async function setManagerPermissions(managerId: string, permissions: ManagerPermissions, updatedBy: string) {
  await ensureTable();
  await db.execute(sql`
    INSERT INTO manager_permissions (manager_id, permissions, updated_by, updated_at)
    VALUES (${managerId}, ${JSON.stringify(permissions)}, ${updatedBy}, now())
    ON CONFLICT (manager_id) DO UPDATE
      SET permissions = EXCLUDED.permissions, updated_by = EXCLUDED.updated_by, updated_at = now()
  `);
}

export interface StaffContext {
  id: string;
  fullName: string;
  /** Admins and super admins: unrestricted, see every client */
  isFullAdmin: boolean;
  permissions: ManagerPermissions;
}

/**
 * The signed-in staff member (admin, super admin or manager) with their
 * effective permissions, or null if the viewer isn't staff.
 */
export async function getStaffContext(): Promise<StaffContext | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  if (!userId) return null;

  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user || user.deletedAt) return null;

  const isFullAdmin = user.role === 'admin' || user.isSuperAdmin;
  if (!isFullAdmin && !user.isManager) return null;

  return {
    id: user.id,
    fullName: user.fullName,
    isFullAdmin,
    permissions: isFullAdmin ? { ...FULL_PERMISSIONS } : await getManagerPermissions(user.id),
  };
}

/** Whether this staff member may act on this client (admins: anyone; managers: assigned clients only) */
export async function canAccessClient(staff: StaffContext, clientId: string) {
  if (staff.isFullAdmin) return true;
  const [client] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, clientId), eq(users.assignedManagerId, staff.id), isNull(users.deletedAt)))
    .limit(1);
  return !!client;
}

/**
 * Sender IDs for a chat request: `userIds` (array or comma-separated) for a
 * merged chat, or a single `userId`. Returns a de-duplicated list.
 */
export function parseClientIds(input: { userId?: unknown; userIds?: unknown }): string[] {
  const raw = Array.isArray(input.userIds)
    ? input.userIds
    : typeof input.userIds === 'string'
      ? input.userIds.split(',')
      : [input.userId];
  return [...new Set(raw.filter((id): id is string => typeof id === 'string' && id.trim() !== '').map(id => id.trim()))];
}

/** Like requireStaffPermission, but every client in the list must be accessible */
export async function requireStaffPermissionForClients(
  permission: ManagerPermissionKey,
  clientIds: string[]
): Promise<StaffContext | { error: string; status: number }> {
  const staff = await requireStaffPermission(permission);
  if ('error' in staff) return staff;

  for (const clientId of clientIds) {
    if (!(await canAccessClient(staff, clientId))) {
      return { error: 'This client is not assigned to you', status: 403 };
    }
  }
  return staff;
}

/**
 * Gate for chat API routes. Returns the staff context, or an error
 * { error, status } when the viewer lacks the permission or the client isn't theirs.
 */
export async function requireStaffPermission(
  permission: ManagerPermissionKey | null,
  clientId?: string | null
): Promise<StaffContext | { error: string; status: number }> {
  const staff = await getStaffContext();
  if (!staff) return { error: 'Unauthorized', status: 401 };

  if (permission && !staff.permissions[permission]) {
    return { error: 'You do not have permission to do this', status: 403 };
  }

  if (clientId && !(await canAccessClient(staff, clientId))) {
    return { error: 'This client is not assigned to you', status: 403 };
  }

  return staff;
}
