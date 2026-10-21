import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAPI } from '@/lib/admin';
import { db } from '@/server/db';
import { users } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { normalizePermissions, setManagerPermissions } from '@/lib/manager-permissions';
import { logAudit } from '@/server/audit-logger';

// POST /api/admin/managers/permissions
// Body: { managerId, permissions: { viewContactInfo, viewAccounts, ... } }
export async function POST(request: NextRequest) {
  const auth = await requireAdminAPI();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { managerId, permissions } = await request.json();

  if (!managerId || typeof permissions !== 'object' || permissions === null) {
    return NextResponse.json({ error: 'managerId and permissions are required' }, { status: 400 });
  }

  const manager = await db.query.users.findFirst({ where: eq(users.id, managerId) });
  if (!manager || !manager.isManager) {
    return NextResponse.json({ error: 'Manager not found' }, { status: 404 });
  }

  const normalized = normalizePermissions(permissions);
  await setManagerPermissions(managerId, normalized, auth.id);

  await logAudit({
    userId: auth.id,
    action: 'SETTINGS_CHANGE',
    entityType: 'user',
    entityId: managerId,
    details: { managerPermissions: normalized },
    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || undefined,
    userAgent: request.headers.get('user-agent') || undefined,
  });

  return NextResponse.json({ success: true, permissions: normalized });
}
