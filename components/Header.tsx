'use client';

import { useRouter } from 'next/navigation';
import { LogOut, User } from 'lucide-react';
import Image from 'next/image';

interface HeaderProps {
  user: {
    fullName: string;
    username: string;
    profilePhoto?: string | null;
  };
}

export default function Header({ user }: HeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 md:space-x-4 min-w-0 flex-1">
          {/* Profile Picture */}
          <div className="flex-shrink-0">
            {user.profilePhoto ? (
              <Image
                src={user.profilePhoto}
                alt={user.fullName}
                width={40}
                height={40}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div
                className="w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border-2 border-gray-200"
                style={{ backgroundColor: 'var(--color-primary, #1e3a8a)' }}
              >
                <User className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
            )}
          </div>
          {/* User Info */}
          <div className="min-w-0 flex-1">
            <h2 className="text-base md:text-xl font-semibold text-gray-800 truncate">
              Welcome, <span className="hidden sm:inline">{user.fullName}</span><span className="sm:hidden">{user.fullName.split(' ')[0]}</span>
            </h2>
            <p className="text-xs md:text-sm text-gray-500 truncate">@{user.username}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center space-x-1 md:space-x-2 px-3 md:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex-shrink-0"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
