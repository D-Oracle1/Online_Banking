'use client';

import { useRouter } from 'next/navigation';
import { LogOut, Shield } from 'lucide-react';
import AdminNotificationBadge from './AdminNotificationBadge';

interface AdminHeaderProps {
  admin: {
    fullName: string;
    username: string;
    email: string;
  };
}

export default function AdminHeader({ admin }: AdminHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
          <Shield className="w-5 h-5 md:w-6 md:h-6 text-blue-900 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <h2 className="text-base md:text-xl font-semibold text-gray-800 truncate">
              Admin <span className="hidden sm:inline">Dashboard</span>
            </h2>
            <p className="text-xs md:text-sm text-gray-500 truncate">
              <span className="hidden sm:inline">Welcome back, </span>
              {admin.fullName.split(' ')[0]}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
          <AdminNotificationBadge />
          <button
            onClick={handleLogout}
            className="flex items-center space-x-1 md:space-x-2 px-3 md:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
