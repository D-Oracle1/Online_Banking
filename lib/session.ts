import { cookies } from 'next/headers';
import { getUserById } from './auth';

export async function getSession() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  if (!userId) {
    return null;
  }

  const user = await getUserById(userId);
  return user;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function requireAdminAuth() {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  if (session.role !== 'admin') {
    throw new Error('Admin access required');
  }
  return session;
}

export async function setSession(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set('userId', userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete('userId');
  cookieStore.delete('token'); // Remove old token cookie if exists
}
