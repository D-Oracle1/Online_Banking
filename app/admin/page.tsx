import { requireAdmin } from '@/lib/admin';
import { getAdminOverview } from '@/server/admin-overview';
import AdminDashboardView from '@/components/admin/AdminDashboardView';

export const dynamic = 'force-dynamic';

export default async function AdminOverviewPage() {
  const admin = await requireAdmin();
  const data = await getAdminOverview();

  return <AdminDashboardView admin={admin} data={data} />;
}
