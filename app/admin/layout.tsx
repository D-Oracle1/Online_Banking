import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import AdminSidebar from '@/components/AdminSidebar';
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
    <div className="flex h-screen bg-gradient-to-br from-zinc-200 via-zinc-100 to-zinc-300">
      <AdminSidebar isSuperAdmin={session.isSuperAdmin || false} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* No top header: page actions flow with each page, logout lives in the sidebar.
            Extra top padding below lg keeps content clear of the floating menu button. */}
        {/* On desktop the content gets the same 1rem frame as the floating sidebar on every side */}
        <main className="admin-content flex-1 overflow-y-auto p-3 pt-16 md:p-6 md:pt-16 lg:p-4">

          {children}
        </main>
      </div>
      <PushNotificationPrompt />
    </div>
  );
}
