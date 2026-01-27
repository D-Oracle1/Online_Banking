import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import AdminSettingsClient from '@/components/AdminSettingsClient';

export default async function AdminSettingsPage() {
  const session = await getSession();

  if (!session || session.role !== 'admin') {
    redirect('/login');
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Platform Settings</h1>
      <AdminSettingsClient />
    </div>
  );
}
