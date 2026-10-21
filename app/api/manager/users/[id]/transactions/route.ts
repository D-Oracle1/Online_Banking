import { NextResponse } from 'next/server';
import { requireStaffPermission } from '@/lib/manager-permissions';
import { getClientTransactions } from '@/server/manager-clients';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const staff = await requireStaffPermission('viewTransactions', id);
  if ('error' in staff) {
    return NextResponse.json({ error: staff.error }, { status: staff.status });
  }

  return NextResponse.json({ transactions: await getClientTransactions(id) });
}
