import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdminAPI } from '@/lib/superadmin';
import { db } from '@/server/db';
import { users, accounts, transactions, loans, deposits } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { logUserDeletion } from '@/server/audit-logger';

export async function POST(request: NextRequest) {
  const sessionCheck = await requireSuperAdminAPI(request);
  if (sessionCheck instanceof NextResponse) return sessionCheck;

  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Prevent deleting super admins
    const userToDelete = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (userToDelete.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (userToDelete[0].isSuperAdmin) {
      return NextResponse.json(
        { error: 'Cannot delete super admin users' },
        { status: 403 }
      );
    }

    if (userToDelete[0].deletedAt) {
      return NextResponse.json(
        { error: 'User is already deleted' },
        { status: 400 }
      );
    }

    // Get current timestamp for consistent soft-delete
    const deletedAt = new Date();
    const deletedBy = sessionCheck.id;

    // Soft-delete user and all related data
    await db.update(transactions)
      .set({ deletedAt, deletedBy })
      .where(eq(transactions.accountId, userId));

    await db.update(deposits)
      .set({ deletedAt, deletedBy })
      .where(eq(deposits.userId, userId));

    await db.update(loans)
      .set({ deletedAt, deletedBy })
      .where(eq(loans.userId, userId));

    await db.update(accounts)
      .set({ deletedAt, deletedBy })
      .where(eq(accounts.userId, userId));

    await db.update(users)
      .set({ deletedAt, deletedBy })
      .where(eq(users.id, userId));

    // Log the action using the audit logger
    await logUserDeletion(
      sessionCheck.id,
      userId,
      userToDelete[0],
      request as any
    );

    return NextResponse.json({
      success: true,
      message: 'User soft-deleted successfully. Data can be restored if needed.'
    });
  } catch (error: any) {
    console.error('User deletion error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}
