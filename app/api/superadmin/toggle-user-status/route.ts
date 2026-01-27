import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdminAPI } from '@/lib/superadmin';
import { db } from '@/server/db';
import { users, auditLogs } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  const sessionCheck = await requireSuperAdminAPI(request);
  if (sessionCheck instanceof NextResponse) return sessionCheck;

  try {
    const body = await request.json();
    const { userId, status } = body;

    if (!userId || status === undefined) {
      return NextResponse.json(
        { error: 'User ID and status are required' },
        { status: 400 }
      );
    }

    // Get user details
    const userToUpdate = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (userToUpdate.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (userToUpdate[0].isSuperAdmin) {
      return NextResponse.json(
        { error: 'Cannot suspend super admin users' },
        { status: 403 }
      );
    }

    // Update user verification status
    await db
      .update(users)
      .set({
        verificationStatus: status === 'active' ? 'approved' : 'suspended'
      })
      .where(eq(users.id, userId));

    // Log the action
    await db.insert(auditLogs).values({
      id: nanoid(),
      userId: sessionCheck.id,
      action: status === 'active' ? 'ACTIVATE_USER' : 'SUSPEND_USER',
      entityType: 'user',
      entityId: userId,
      details: `${status === 'active' ? 'Activated' : 'Suspended'} user: ${userToUpdate[0].fullName} (${userToUpdate[0].email})`,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: `User ${status === 'active' ? 'activated' : 'suspended'} successfully`
    });
  } catch (error: any) {
    console.error('User status toggle error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update user status' },
      { status: 500 }
    );
  }
}
