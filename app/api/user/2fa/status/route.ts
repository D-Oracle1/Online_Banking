import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { db } from '@/server/db';
import { users } from '@/shared/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await requireAuth();

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.id),
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const enabled = !!user.twoFactorToken && user.twoFactorToken.trim() !== '';

    return NextResponse.json({
      enabled,
      token: enabled ? user.twoFactorToken : null,
    });
  } catch (error: any) {
    console.error('Error checking 2FA status:', error);
    return NextResponse.json(
      { error: 'Failed to check 2FA status' },
      { status: 500 }
    );
  }
}
