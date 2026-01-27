import { db } from '@/server/db';
import { users } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUserById } from './auth';

export async function requireAdmin() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) {
    redirect('/login');
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user || (user.role !== 'admin' && !user.isSuperAdmin)) {
    redirect('/dashboard');
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  };
}

export async function isAdmin(userId: string): Promise<boolean> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  return user?.role === 'admin' || user?.isSuperAdmin === true;
}

// API route version - returns NextResponse instead of redirecting
export async function requireAdminAPI(request?: Request) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) {
    return { error: 'Unauthorized - No session', status: 401 };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user || (user.role !== 'admin' && !user.isSuperAdmin)) {
    return { error: 'Unauthorized - Admin access required', status: 403 };
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    isSuperAdmin: user.isSuperAdmin,
  };
}
