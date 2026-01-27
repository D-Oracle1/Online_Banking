import { db } from './db';
import { auditLogs } from '@shared/schema';
import { Request } from 'express';

/**
 * Audit logging helper for compliance and security
 * Automatically logs all critical operations including deletes
 */

interface AuditLogEntry {
  userId: string;
  action: AuditAction;
  entityType: EntityType;
  entityId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export type AuditAction =
  | 'SOFT_DELETE'
  | 'RESTORE'
  | 'PERMANENT_DELETE'
  | 'DELETE_USER'
  | 'CREATE_USER'
  | 'UPDATE_USER'
  | 'CREATE_ACCOUNT'
  | 'UPDATE_ACCOUNT'
  | 'CREATE_TRANSACTION'
  | 'UPDATE_TRANSACTION'
  | 'CREATE_LOAN'
  | 'APPROVE_LOAN'
  | 'REJECT_LOAN'
  | 'DELETE_MESSAGE'
  | 'RESTORE_MESSAGE'
  | 'ADMIN_LOGIN'
  | 'ADMIN_LOGOUT'
  | 'SETTINGS_CHANGE'
  | 'BULK_DELETE'
  | 'BULK_RESTORE';

export type EntityType =
  | 'user'
  | 'account'
  | 'transaction'
  | 'loan'
  | 'message'
  | 'deposit'
  | 'loan_repayment'
  | 'debit_card'
  | 'fixed_savings'
  | 'aml_alert'
  | 'site_settings';

/**
 * Log an audit event
 * @param entry - The audit log entry
 * @returns The created audit log record
 */
export async function logAudit(entry: AuditLogEntry) {
  const auditId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const result = await db.insert(auditLogs).values({
    id: auditId,
    userId: entry.userId,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    details: entry.details ? JSON.stringify(entry.details) : null,
    ipAddress: entry.ipAddress || null,
    userAgent: entry.userAgent || null,
    createdAt: new Date(),
  }).returning();

  return result[0];
}

/**
 * Log a soft-delete operation
 * @param userId - The admin user performing the delete
 * @param entityType - The type of entity being deleted
 * @param entityId - The ID of the entity
 * @param entityData - The data of the entity (for audit trail)
 * @param req - Optional Express request object for IP/UserAgent
 */
export async function logSoftDelete(
  userId: string,
  entityType: EntityType,
  entityId: string,
  entityData: Record<string, any>,
  req?: Request
) {
  return logAudit({
    userId,
    action: 'SOFT_DELETE',
    entityType,
    entityId,
    details: {
      deletedData: entityData,
      deletedAt: new Date().toISOString(),
    },
    ipAddress: req?.ip || req?.socket?.remoteAddress,
    userAgent: req?.get('user-agent'),
  });
}

/**
 * Log a restore operation
 * @param userId - The admin user performing the restore
 * @param entityType - The type of entity being restored
 * @param entityId - The ID of the entity
 * @param req - Optional Express request object for IP/UserAgent
 */
export async function logRestore(
  userId: string,
  entityType: EntityType,
  entityId: string,
  req?: Request
) {
  return logAudit({
    userId,
    action: 'RESTORE',
    entityType,
    entityId,
    details: {
      restoredAt: new Date().toISOString(),
    },
    ipAddress: req?.ip || req?.socket?.remoteAddress,
    userAgent: req?.get('user-agent'),
  });
}

/**
 * Log a permanent delete operation (GDPR, etc.)
 * @param userId - The admin user performing the permanent delete
 * @param entityType - The type of entity being permanently deleted
 * @param entityId - The ID of the entity
 * @param reason - The reason for permanent deletion
 * @param entityData - The data being permanently deleted (for audit trail)
 * @param req - Optional Express request object for IP/UserAgent
 */
export async function logPermanentDelete(
  userId: string,
  entityType: EntityType,
  entityId: string,
  reason: string,
  entityData: Record<string, any>,
  req?: Request
) {
  return logAudit({
    userId,
    action: 'PERMANENT_DELETE',
    entityType,
    entityId,
    details: {
      reason,
      deletedData: entityData,
      permanentlyDeletedAt: new Date().toISOString(),
      warning: 'PERMANENT - DATA CANNOT BE RECOVERED',
    },
    ipAddress: req?.ip || req?.socket?.remoteAddress,
    userAgent: req?.get('user-agent'),
  });
}

/**
 * Log a user deletion
 * @param adminId - The admin performing the deletion
 * @param deletedUserId - The user being deleted
 * @param userData - The user data being deleted
 * @param req - Optional Express request object for IP/UserAgent
 */
export async function logUserDeletion(
  adminId: string,
  deletedUserId: string,
  userData: Record<string, any>,
  req?: Request
) {
  // Remove sensitive data from audit log
  const { password, passwordResetToken, twoFactorToken, ...safeUserData } = userData;

  return logAudit({
    userId: adminId,
    action: 'DELETE_USER',
    entityType: 'user',
    entityId: deletedUserId,
    details: {
      user: safeUserData,
      deletedAt: new Date().toISOString(),
    },
    ipAddress: req?.ip || req?.socket?.remoteAddress,
    userAgent: req?.get('user-agent'),
  });
}

/**
 * Log bulk delete operations
 * @param userId - The admin user performing the bulk delete
 * @param entityType - The type of entities being deleted
 * @param entityIds - Array of entity IDs
 * @param req - Optional Express request object for IP/UserAgent
 */
export async function logBulkDelete(
  userId: string,
  entityType: EntityType,
  entityIds: string[],
  req?: Request
) {
  return logAudit({
    userId,
    action: 'BULK_DELETE',
    entityType,
    details: {
      entityIds,
      count: entityIds.length,
      deletedAt: new Date().toISOString(),
    },
    ipAddress: req?.ip || req?.socket?.remoteAddress,
    userAgent: req?.get('user-agent'),
  });
}

/**
 * Log bulk restore operations
 * @param userId - The admin user performing the bulk restore
 * @param entityType - The type of entities being restored
 * @param entityIds - Array of entity IDs
 * @param req - Optional Express request object for IP/UserAgent
 */
export async function logBulkRestore(
  userId: string,
  entityType: EntityType,
  entityIds: string[],
  req?: Request
) {
  return logAudit({
    userId,
    action: 'BULK_RESTORE',
    entityType,
    details: {
      entityIds,
      count: entityIds.length,
      restoredAt: new Date().toISOString(),
    },
    ipAddress: req?.ip || req?.socket?.remoteAddress,
    userAgent: req?.get('user-agent'),
  });
}

/**
 * Get audit logs for a specific entity
 * @param entityType - The type of entity
 * @param entityId - The ID of the entity
 * @returns Array of audit log entries
 */
export async function getAuditLogsForEntity(
  entityType: EntityType,
  entityId: string
) {
  return db.query.auditLogs.findMany({
    where: (auditLogs, { eq, and }) =>
      and(
        eq(auditLogs.entityType, entityType),
        eq(auditLogs.entityId, entityId)
      ),
    orderBy: (auditLogs, { desc }) => [desc(auditLogs.createdAt)],
  });
}

/**
 * Get audit logs for a specific user's actions
 * @param userId - The user ID
 * @param limit - Maximum number of logs to return (default: 100)
 * @returns Array of audit log entries
 */
export async function getAuditLogsByUser(userId: string, limit: number = 100) {
  return db.query.auditLogs.findMany({
    where: (auditLogs, { eq }) => eq(auditLogs.userId, userId),
    orderBy: (auditLogs, { desc }) => [desc(auditLogs.createdAt)],
    limit,
  });
}

/**
 * Get recent audit logs
 * @param limit - Maximum number of logs to return (default: 50)
 * @returns Array of audit log entries
 */
export async function getRecentAuditLogs(limit: number = 50) {
  return db.query.auditLogs.findMany({
    orderBy: (auditLogs, { desc }) => [desc(auditLogs.createdAt)],
    limit,
  });
}
