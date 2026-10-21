import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireManager } from '@/lib/manager';
import { getStaffContext } from '@/lib/manager-permissions';
import ManagerSidebar from '@/components/ManagerSidebar';

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const session = await requireManager();
  const staff = await getStaffContext();
  if (!staff) redirect('/dashboard');

  return (
    <div className="flex min-h-screen bg-gray-100">
      <ManagerSidebar
        fullName={session.fullName}
        canViewMessages={staff.permissions.viewMessages}
        isFullAdmin={staff.isFullAdmin}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 flex items-center justify-between gap-3 sticky top-0 z-20">
          <div className="pl-10 md:pl-0 flex items-center gap-3 min-w-0">
            {staff.isFullAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Admin Panel</span>
                <span className="sm:hidden">Admin</span>
              </Link>
            )}
            <h2 className="text-base md:text-lg font-semibold text-gray-900 truncate">Manager Dashboard</h2>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600 hidden sm:block truncate max-w-[150px]">{session.fullName}</span>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-blue-700 font-semibold text-sm">{session.fullName[0]}</span>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
