'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Crown, Users, Settings, Shield, Menu, X, ChevronLeft, ChevronRight
} from 'lucide-react';

const menuItems = [
  { icon: Shield, label: 'Super Admin Dashboard', href: '/superadmin' },
];

export default function SuperAdminSidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isActive = (href: string) => {
    if (href === '/superadmin') {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const SidebarContent = ({ collapsed = false, showCloseButton = false }: { collapsed?: boolean, showCloseButton?: boolean }) => (
    <>
      <div className={`p-6 border-b border-yellow-700 ${collapsed ? 'px-3' : ''}`}>
        <div className="flex items-center justify-between">
          <div className={`flex items-center ${collapsed ? 'justify-center w-full' : 'space-x-3'}`}>
            <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center p-1 flex-shrink-0">
              <Crown className="w-6 h-6 text-yellow-900" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="font-bold text-lg whitespace-nowrap">Super Admin</h1>
                <p className="text-xs text-yellow-200">System Control</p>
              </div>
            )}
          </div>
          {/* Close button for mobile */}
          {showCloseButton && (
            <button
              onClick={closeMobileMenu}
              className="lg:hidden text-white hover:text-gray-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        <div className={`${collapsed ? 'px-2' : 'px-3'} space-y-1`}>
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMobileMenu}
              title={collapsed ? item.label : ''}
              className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-3 py-3 rounded-lg transition-colors ${
                isActive(item.href)
                  ? 'bg-yellow-500 text-yellow-900'
                  : 'text-yellow-100 hover:bg-yellow-800'
              }`}
            >
              <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'}`}>
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </div>
            </Link>
          ))}
        </div>
      </nav>

      <div className={`p-4 border-t border-yellow-700 space-y-2 ${collapsed ? 'px-2' : ''}`}>
        <Link
          href="/admin"
          onClick={closeMobileMenu}
          title={collapsed ? 'Admin Panel' : ''}
          className={`flex items-center justify-center ${collapsed ? '' : 'space-x-2'} px-4 py-2 bg-yellow-800 hover:bg-yellow-700 rounded-lg transition-colors text-sm`}
        >
          {collapsed ? <span className="text-xl">↑</span> : <span>← Admin Panel</span>}
        </Link>
        <Link
          href="/dashboard"
          onClick={closeMobileMenu}
          title={collapsed ? 'User Dashboard' : ''}
          className={`flex items-center justify-center ${collapsed ? '' : 'space-x-2'} px-4 py-2 bg-yellow-800 hover:bg-yellow-700 rounded-lg transition-colors text-sm`}
        >
          {collapsed ? <span className="text-xl">←</span> : <span>← User Dashboard</span>}
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 bg-yellow-600 text-yellow-900 p-2 rounded-lg shadow-lg hover:bg-yellow-500 transition-colors"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex ${isCollapsed ? 'w-20' : 'w-64'} bg-yellow-900 text-white flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out`}>
        <SidebarContent collapsed={isCollapsed} />

        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 bg-yellow-900 text-white border-2 border-yellow-700 rounded-full p-1.5 hover:bg-yellow-800 transition-colors shadow-lg z-10"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-64 bg-yellow-900 text-white flex-col z-50 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent showCloseButton={true} />
      </aside>
    </>
  );
}
