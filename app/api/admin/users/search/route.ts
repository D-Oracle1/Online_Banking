import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { db } from '@/server/db';
import { users, accounts } from '@/shared/schema';
import { or, ilike, eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
    }

    // Search users by full name, first name, last name, or email
    const searchTerm = `%${query.trim()}%`;

    const foundUsers = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        accountNumber: accounts.accountNumber,
      })
      .from(users)
      .leftJoin(accounts, eq(users.id, accounts.userId))
      .where(
        or(
          ilike(users.fullName, searchTerm),
          ilike(users.email, searchTerm)
        )
      )
      .limit(10);

    return NextResponse.json({ users: foundUsers });
  } catch (error: any) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search users' },
      { status: 500 }
    );
  }
}
