'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ManagerLogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center justify-center space-x-2 w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm text-white"
    >
      <LogOut className="w-4 h-4" />
      <span>Sign Out</span>
    </button>
  );
}
