import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { users } from '@/shared/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user || user.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate 6-digit codes
    const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

    const amlCode = generateCode();
    const twoFACode = generateCode();
    const unlockCode = generateCode();

    // Set expiration times (codes valid for 24 hours)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // IMPORTANT: This will INVALIDATE all previous codes for this user.
    // Old codes will no longer work as they are being replaced with new ones.
    // The database update ensures only the new codes are valid going forward.
    await db.update(users)
      .set({
        amlCode,
        amlCodeExpiresAt: expiresAt,
        twoFACode,
        twoFACodeExpiresAt: expiresAt,
        unlockCode,
        unlockCodeExpiresAt: expiresAt,
      })
      .where(eq(users.id, userId));

    console.log(`[CODE GENERATION] Generated new codes for user ${userId}. All previous codes have been invalidated.`);

    return NextResponse.json({
      success: true,
      codes: {
        amlCode,
        twoFACode,
        unlockCode,
      },
      expiresAt,
    });
  } catch (error: any) {
    console.error('Error generating codes:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate codes' },
      { status: 500 }
    );
  }
}
