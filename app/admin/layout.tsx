import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import AdminSidebar from '@/components/AdminSidebar';
import AdminHeader from '@/components/AdminHeader';
import PushNotificationPrompt from '@/components/PushNotificationPrompt';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // Check if user is logged in
  if (!session) {
    redirect('/login');
  }

  // Check if user is admin
  if (session.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar isSuperAdmin={session.isSuperAdmin || false} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader admin={session} />
        <main className="flex-1 overflow-y-auto p-3 md:p-6">
          {children}
        </main>
      </div>
      <PushNotificationPrompt />
    </div>
  );
}
