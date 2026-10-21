import { NextResponse } from 'next/server';
import { getStaffContext } from '@/lib/manager-permissions';
import { getVisibleClients } from '@/server/manager-clients';

export const dynamic = 'force-dynamic';

export async function GET() {
  const staff = await getStaffContext();
  if (!staff) {
    return NextResponse.json({ error: 'Manager access required' }, { status: 403 });
  }

  // Admins see all users; managers only their assigned users, limited to what their rules allow
  const users = await getVisibleClients(staff);

  return NextResponse.json({ users, permissions: staff.permissions, isFullAdmin: staff.isFullAdmin });
}
