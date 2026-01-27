import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import SuperAdminSidebar from '@/components/SuperAdminSidebar';
import SuperAdminHeader from '@/components/SuperAdminHeader';

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // Check if user is logged in
  if (!session) {
    redirect('/login');
  }

  // Check if user is super admin
  if (!session.isSuperAdmin) {
    redirect('/dashboard');
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <SuperAdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <SuperAdminHeader superAdmin={session} />
        <main className="flex-1 overflow-y-auto p-3 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
