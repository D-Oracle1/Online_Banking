import { requireManager } from '@/lib/manager';
import ManagerSidebar from '@/components/ManagerSidebar';

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const session = await requireManager();

  return (
    <div className="flex min-h-screen bg-gray-100">
      <ManagerSidebar fullName={session.fullName} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="pl-10 md:pl-0">
            <h2 className="text-base md:text-lg font-semibold text-gray-900">Manager Dashboard</h2>
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
