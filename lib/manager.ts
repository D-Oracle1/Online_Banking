import { db } from '@/server/db';
import { users } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function requireManager() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) {
    redirect('/auth/login');
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user || (!user.isManager && user.role !== 'admin' && !user.isSuperAdmin)) {
    redirect('/dashboard');
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    isManager: user.isManager,
    isSuperAdmin: user.isSuperAdmin,
  };
}
