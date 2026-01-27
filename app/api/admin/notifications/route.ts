import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { db } from '@/server/db';
import { deposits, loans, messages } from '@/shared/schema';
import { eq, and } from 'drizzle-orm';

export async function GET() {
  try {
    await requireAdmin();

    // Get counts of pending items
    const [pendingDeposits, pendingLoans, unreadMessages] = await Promise.all([
      db.select().from(deposits).where(eq(deposits.status, 'PENDING')),
      db.select().from(loans).where(eq(loans.status, 'PENDING')),
      // Only count unread messages sent by users (not admin messages)
      db.select().from(messages).where(and(eq(messages.isRead, false), eq(messages.senderType, 'user'))),
    ]);

    const notifications = {
      pendingDeposits: pendingDeposits.length,
      pendingLoans: pendingLoans.length,
      unreadMessages: unreadMessages.length,
      total: pendingDeposits.length + pendingLoans.length + unreadMessages.length,
    };

    return NextResponse.json(notifications);
  } catch (error: any) {
    console.error('Get admin notifications error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}
