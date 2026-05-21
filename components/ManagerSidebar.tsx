'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Users, MessageSquare, LayoutDashboard, Shield, Menu, X } from 'lucide-react';
import ManagerLogoutButton from './ManagerLogoutButton';
import { usePathname } from 'next/navigation';

interface ManagerSidebarProps {
  fullName: string;
}

export default function ManagerSidebar({ fullName }: ManagerSidebarProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const links = [
    { href: '/manager', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/manager/users', label: 'My Users', icon: Users },
    { href: '/manager/messages', label: 'Messages', icon: MessageSquare },
  ];

  const navContent = (
    <>
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-lg leading-tight">Manager Panel</h1>
            <p className="text-xs text-gray-400 truncate">{fullName}</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setOpen(false)}
            className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
              pathname === href
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-800'
            }`}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{label}</span>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-800">
        <ManagerLogoutButton />
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-gray-900 text-white flex-col h-screen sticky top-0 flex-shrink-0">
        {navContent}
      </aside>

      {/* Mobile overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 w-64 bg-gray-900 text-white flex flex-col z-50 transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 text-gray-400 hover:text-white p-1"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
        {navContent}
      </aside>

      {/* Mobile hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-3 left-3 z-30 bg-gray-900 text-white p-2 rounded-lg shadow-lg"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>
    </>
  );
}
