import { db } from './db';
import { users, accounts, transactions } from '@shared/schema';
import { and, desc, eq, inArray, isNull } from 'drizzle-orm';
import type { StaffContext } from '@/lib/manager-permissions';
import { avatarUrl } from './chat';

/**
 * Clients visible to a staff member, trimmed to the fields their permissions allow.
 * Admins see every client with full detail; managers see only clients assigned to them.
 */
export async function getVisibleClients(staff: StaffContext) {
  const p = staff.permissions;

  const clientRows = await db
    .select()
    .from(users)
    .where(staff.isFullAdmin
      ? isNull(users.deletedAt)
      : and(eq(users.assignedManagerId, staff.id), isNull(users.deletedAt)));

  const clientIds = clientRows.map(u => u.id);

  const accountRows = p.viewAccounts && clientIds.length
    ? await db
        .select()
        .from(accounts)
        .where(and(inArray(accounts.userId, clientIds), isNull(accounts.deletedAt)))
    : [];

  return clientRows.map(u => ({
    // Basic profile: always visible
    id: u.id,
    fullName: u.fullName,
    email: u.email,
    username: u.username,
    profilePhoto: avatarUrl(u.id, u.profilePhoto),
    createdAt: u.createdAt.toISOString(),
    ...(p.viewContactInfo && {
      contact: {
        phoneNumber: u.phoneNumber,
        dateOfBirth: u.dateOfBirth,
        gender: u.gender,
        nationality: u.nationality,
        address: [u.address, u.city, u.state, u.postalCode, u.country].filter(Boolean).join(', ') || null,
        occupation: u.occupation,
        employer: u.employer,
      },
    }),
    ...(p.viewAccounts && {
      accounts: accountRows
        .filter(a => a.userId === u.id)
        .map(a => ({
          id: a.id,
          accountNumber: a.accountNumber,
          accountType: a.accountType,
          balance: a.balance,
          isActivated: a.isActivated,
        })),
    }),
  }));
}

export type VisibleClient = Awaited<ReturnType<typeof getVisibleClients>>[number];

/** Recent transactions for one client (caller must check permission and assignment) */
export async function getClientTransactions(clientId: string, limit = 25) {
  const clientAccounts = await db
    .select({ id: accounts.id, accountNumber: accounts.accountNumber })
    .from(accounts)
    .where(and(eq(accounts.userId, clientId), isNull(accounts.deletedAt)));

  if (!clientAccounts.length) return [];

  const rows = await db
    .select()
    .from(transactions)
    .where(and(inArray(transactions.accountId, clientAccounts.map(a => a.id)), isNull(transactions.deletedAt)))
    .orderBy(desc(transactions.createdAt))
    .limit(limit);

  return rows.map(t => ({
    id: t.id,
    type: t.type,
    amount: t.amount,
    status: t.status,
    description: t.description,
    createdAt: t.createdAt.toISOString(),
  }));
}
