import { NextRequest, NextResponse } from 'next/server';
import { getSession } from './session';
import { redirect } from 'next/navigation';

export async function requireSuperAdmin() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  if (!session.isSuperAdmin) {
    redirect('/dashboard');
  }

  return session;
}

export async function requireSuperAdminAPI(request: NextRequest) {
  const session = await getSession();

  if (!session || !session.isSuperAdmin) {
    return NextResponse.json(
      { error: 'Unauthorized - Super Admin access required' },
      { status: 403 }
    );
  }

  return session;
}
