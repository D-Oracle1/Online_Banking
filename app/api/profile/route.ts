import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { db } from '@/server/db';
import { users } from '@/shared/schema';
import { eq } from 'drizzle-orm';

// GET - Fetch user profile
export async function GET(request: NextRequest) {
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

    return NextResponse.json({
      fullName: user.fullName,
      email: user.email,
      username: user.username,
      phoneNumber: user.phoneNumber,
      address: user.address,
      profilePhoto: user.profilePhoto,
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const session = await requireAuth();
    const { fullName, phoneNumber, address, profilePhoto } = await request.json();

    // Validate required fields
    if (!fullName) {
      return NextResponse.json(
        { error: 'Full name is required' },
        { status: 400 }
      );
    }

    // Update user profile
    await db
      .update(users)
      .set({
        fullName,
        phoneNumber: phoneNumber || null,
        address: address || null,
        profilePhoto: profilePhoto || null,
      })
      .where(eq(users.id, session.id));

    // Fetch updated user data
    const updatedUser = await db.query.users.findFirst({
      where: eq(users.id, session.id),
    });

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        fullName: updatedUser?.fullName,
        phoneNumber: updatedUser?.phoneNumber,
        address: updatedUser?.address,
        profilePhoto: updatedUser?.profilePhoto,
      },
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update profile' },
      { status: 500 }
    );
  }
}
