import { requireManager } from '@/lib/manager';
import Link from 'next/link';
import { Users, MessageSquare, LayoutDashboard, Shield, LogOut } from 'lucide-react';

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const session = await requireManager();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col h-screen sticky top-0">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Manager Panel</h1>
              <p className="text-xs text-gray-400">{session.fullName}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          <Link
            href="/manager"
            className="flex items-center space-x-3 px-3 py-3 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-sm font-medium">Dashboard</span>
          </Link>
          <Link
            href="/manager/users"
            className="flex items-center space-x-3 px-3 py-3 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
          >
            <Users className="w-5 h-5" />
            <span className="text-sm font-medium">My Users</span>
          </Link>
          <Link
            href="/manager/messages"
            className="flex items-center space-x-3 px-3 py-3 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-sm font-medium">Messages</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <Link
            href="/dashboard"
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm"
          >
            <span>← Back to My Dashboard</span>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Manager Dashboard</h2>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">{session.fullName}</span>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-700 font-semibold text-sm">{session.fullName[0]}</span>
            </div>
          </div>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
