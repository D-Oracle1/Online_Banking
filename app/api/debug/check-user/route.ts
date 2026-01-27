import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { users } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/lib/session';

// Temporary debug endpoint - remove after troubleshooting
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    // Check for admin user
    const adminUser = await db.query.users.findFirst({
      where: eq(users.email, 'admin@sterlingcapitalbank.com'),
    });

    return NextResponse.json({
      currentSession: session,
      adminUserExists: !!adminUser,
      adminUserDetails: adminUser ? {
        id: adminUser.id,
        email: adminUser.email,
        username: adminUser.username,
        role: adminUser.role,
        fullName: adminUser.fullName,
      } : null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
