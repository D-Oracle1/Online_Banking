import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { db } from '@/server/db';
import { users } from '@/shared/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { amlCode } = await request.json();

    if (!amlCode || amlCode.trim().length !== 6) {
      return NextResponse.json(
        { error: 'Valid 6-digit AML code is required' },
        { status: 400 }
      );
    }

    // Get user's AML code from database
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.id),
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if AML code exists
    if (!user.amlCode) {
      return NextResponse.json(
        {
          error: 'No AML code has been generated for your account. Please contact support to generate your AML protection code.',
          requiresCodeGeneration: true
        },
        { status: 400 }
      );
    }

    // Check if AML code has expired
    if (user.amlCodeExpiresAt && new Date() > new Date(user.amlCodeExpiresAt)) {
      return NextResponse.json(
        {
          error: 'Your AML code has expired. Please contact support to generate a new code.',
          codeExpired: true
        },
        { status: 400 }
      );
    }

    // Verify AML code matches
    if (user.amlCode !== amlCode.trim()) {
      return NextResponse.json(
        { error: 'Invalid AML code. Please check and try again.' },
        { status: 401 }
      );
    }

    // AML code is valid
    console.log(`[AML VERIFICATION] Valid AML code provided by user ${session.id}`);

    return NextResponse.json({
      success: true,
      message: 'AML code verified successfully',
    });
  } catch (error: any) {
    console.error('AML verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify AML code' },
      { status: 500 }
    );
  }
}
