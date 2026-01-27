import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { users } from '@/shared/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { newEmail } = await request.json();

    if (!newEmail) {
      return NextResponse.json({ error: 'New email is required' }, { status: 400 });
    }

    // Find the admin user
    const adminUsers = await db
      .select()
      .from(users)
      .where(eq(users.role, 'admin'));

    if (adminUsers.length === 0) {
      return NextResponse.json({ error: 'No admin user found' }, { status: 404 });
    }

    const oldEmail = adminUsers[0].email;

    if (oldEmail === newEmail) {
      return NextResponse.json({
        message: `Admin email is already set to ${newEmail}`,
        admin: {
          id: adminUsers[0].id,
          username: adminUsers[0].username,
          email: adminUsers[0].email,
          fullName: adminUsers[0].fullName,
        },
      });
    }

    // Update admin email
    await db
      .update(users)
      .set({ email: newEmail })
      .where(eq(users.id, adminUsers[0].id));

    return NextResponse.json({
      success: true,
      message: `Successfully updated admin email from ${oldEmail} to ${newEmail}`,
      admin: {
        id: adminUsers[0].id,
        username: adminUsers[0].username,
        oldEmail,
        newEmail,
        fullName: adminUsers[0].fullName,
      },
    });
  } catch (error) {
    console.error('Error updating admin email:', error);
    return NextResponse.json(
      { error: 'Failed to update admin email' },
      { status: 500 }
    );
  }
}

// GET endpoint to check current admin email
export async function GET() {
  try {
    const adminUsers = await db
      .select()
      .from(users)
      .where(eq(users.role, 'admin'));

    if (adminUsers.length === 0) {
      return NextResponse.json({ error: 'No admin user found' }, { status: 404 });
    }

    return NextResponse.json({
      admins: adminUsers.map(admin => ({
        id: admin.id,
        username: admin.username,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
      })),
    });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin users' },
      { status: 500 }
    );
  }
}
