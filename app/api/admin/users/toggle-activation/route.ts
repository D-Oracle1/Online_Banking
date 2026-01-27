import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { db } from '@/server/db';
import { accounts } from '@/shared/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const { accountId, activate } = await request.json();

    if (!accountId || typeof activate !== 'boolean') {
      return NextResponse.json(
        { error: 'Account ID and activation status are required' },
        { status: 400 }
      );
    }

    // Get account
    const account = await db.query.accounts.findFirst({
      where: eq(accounts.id, accountId),
    });

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Update account activation status
    await db.update(accounts)
      .set({
        isActivated: activate,
      })
      .where(eq(accounts.id, accountId));

    return NextResponse.json({
      success: true,
      message: `Account ${activate ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error: any) {
    console.error('Error toggling account activation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to toggle account activation' },
      { status: 500 }
    );
  }
}
