import { db } from './db';
import { eq, isNull, isNotNull, and, SQL } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';
import * as schema from '@shared/schema';

/**
 * Soft-delete helper functions for data protection
 * These functions ensure data is never permanently deleted from the database
 */

interface SoftDeleteRecord {
  deletedAt?: Date | null;
  deletedBy?: string | null;
}

/**
 * Soft-delete a record by setting deletedAt and deletedBy timestamps
 * @param table - The table to delete from
 * @param recordId - The ID of the record to delete
 * @param deletedBy - The admin user ID performing the deletion
 * @returns The updated record
 */
export async function softDelete<T extends PgTable>(
  table: T,
  recordId: string,
  deletedBy: string
) {
  const result = await db
    .update(table)
    .set({
      deletedAt: new Date(),
      deletedBy: deletedBy,
    } as any)
    .where(eq((table as any).id, recordId))
    .returning();

  return result[0];
}

/**
 * Restore a soft-deleted record
 * @param table - The table to restore from
 * @param recordId - The ID of the record to restore
 * @returns The restored record
 */
export async function restoreDeleted<T extends PgTable>(
  table: T,
  recordId: string
) {
  const result = await db
    .update(table)
    .set({
      deletedAt: null,
      deletedBy: null,
    } as any)
    .where(eq((table as any).id, recordId))
    .returning();

  return result[0];
}

/**
 * Get all soft-deleted records from a table
 * @param table - The table to query
 * @returns Array of deleted records
 */
export async function getDeletedRecords<T extends PgTable>(table: T) {
  return db
    .select()
    .from(table)
    .where(isNotNull((table as any).deletedAt));
}

/**
 * Get all active (non-deleted) records from a table
 * @param table - The table to query
 * @returns Array of active records
 */
export async function getActiveRecords<T extends PgTable>(table: T) {
  return db
    .select()
    .from(table)
    .where(isNull((table as any).deletedAt));
}

/**
 * Permanent delete - USE WITH EXTREME CAUTION
 * This should only be used for compliance requirements (e.g., GDPR right to be forgotten)
 * @param table - The table to delete from
 * @param recordId - The ID of the record to permanently delete
 * @param adminId - The admin user ID performing the deletion
 * @param reason - The reason for permanent deletion (for audit trail)
 */
export async function permanentDelete<T extends PgTable>(
  table: T,
  recordId: string,
  adminId: string,
  reason: string
) {
  // First, log this action in audit logs
  await db.insert(schema.auditLogs).values({
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    userId: adminId,
    action: 'PERMANENT_DELETE',
    entityType: (table as any)._ ? (table as any)._.name : 'unknown',
    entityId: recordId,
    details: JSON.stringify({ reason }),
    createdAt: new Date(),
  });

  // Then perform the permanent deletion
  const result = await db
    .delete(table)
    .where(eq((table as any).id, recordId))
    .returning();

  return result[0];
}

/**
 * Check if a record is soft-deleted
 * @param table - The table to query
 * @param recordId - The ID of the record to check
 * @returns true if deleted, false if active
 */
export async function isDeleted<T extends PgTable>(
  table: T,
  recordId: string
): Promise<boolean> {
  const result = await db
    .select()
    .from(table)
    .where(eq((table as any).id, recordId))
    .limit(1);

  if (result.length === 0) return false;
  return (result[0] as any).deletedAt !== null;
}

/**
 * Bulk soft-delete multiple records
 * @param table - The table to delete from
 * @param recordIds - Array of record IDs to delete
 * @param deletedBy - The admin user ID performing the deletion
 * @returns Number of records deleted
 */
export async function bulkSoftDelete<T extends PgTable>(
  table: T,
  recordIds: string[],
  deletedBy: string
) {
  const results = await Promise.all(
    recordIds.map(id => softDelete(table, id, deletedBy))
  );

  return results.filter(r => r !== undefined).length;
}

/**
 * Bulk restore multiple records
 * @param table - The table to restore from
 * @param recordIds - Array of record IDs to restore
 * @returns Number of records restored
 */
export async function bulkRestore<T extends PgTable>(
  table: T,
  recordIds: string[]
) {
  const results = await Promise.all(
    recordIds.map(id => restoreDeleted(table, id))
  );

  return results.filter(r => r !== undefined).length;
}

/**
 * Get deletion metadata for a record
 * @param table - The table to query
 * @param recordId - The ID of the record
 * @returns Deletion metadata (deletedAt, deletedBy) or null if not deleted
 */
export async function getDeletionMetadata<T extends PgTable>(
  table: T,
  recordId: string
): Promise<{ deletedAt: Date; deletedBy: string } | null> {
  const result = await db
    .select()
    .from(table)
    .where(eq((table as any).id, recordId))
    .limit(1);

  if (result.length === 0) return null;

  const record = result[0] as any;
  if (!record.deletedAt) return null;

  return {
    deletedAt: record.deletedAt,
    deletedBy: record.deletedBy,
  };
}

/**
 * Create a query condition to exclude soft-deleted records
 * Use this in custom queries to automatically filter out deleted records
 */
export function excludeDeleted<T extends PgTable>(table: T): SQL {
  return isNull((table as any).deletedAt);
}

/**
 * Create a query condition to include ONLY soft-deleted records
 * Use this to query deleted records
 */
export function onlyDeleted<T extends PgTable>(table: T): SQL {
  return isNotNull((table as any).deletedAt);
}
