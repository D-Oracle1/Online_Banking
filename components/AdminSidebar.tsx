'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import NavigationLink from '@/components/NavigationLink';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, DollarSign, ArrowLeftRight,
  MessageSquare, FileText, Settings, Shield, CreditCard, Menu, X, UserCheck, Mail, Key, Crown, ChevronLeft, ChevronRight
} from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Overview', href: '/admin' },
  { icon: Users, label: 'Users Management', href: '/admin/users' },
  { icon: UserCheck, label: 'User Verification', href: '/admin/user-verification' },
  { icon: Key, label: 'Code Generator', href: '/admin/code-generator' },
  { icon: DollarSign, label: 'Deposits Approval', href: '/admin/deposits', badgeKey: 'pendingDeposits' },
  { icon: ArrowLeftRight, label: 'Transactions', href: '/admin/transactions' },
  { icon: MessageSquare, label: 'User Messages', href: '/admin/messages', badgeKey: 'unreadMessages' },
  { icon: FileText, label: 'Loan Applications', href: '/admin/loans', badgeKey: 'pendingLoans' },
  { icon: CreditCard, label: 'Loan Repayments', href: '/admin/loan-repayments' },
  { icon: Mail, label: 'Bulk Email', href: '/admin/bulk-email' },
  { icon: Settings, label: 'Settings', href: '/admin/settings' },
];

interface NotificationCounts {
  pendingDeposits: number;
  unreadMessages: number;
  pendingLoans: number;
}

interface AdminSidebarProps {
  isSuperAdmin?: boolean;
}

interface SiteSettings {
  bankName: string;
  faviconUrl: string | null;
  primaryColor: string;
}

export default function AdminSidebar({ isSuperAdmin = false }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>({
    bankName: 'Sterling Capital Bank',
    faviconUrl: null,
    primaryColor: '#1e3a8a',
  });
  const [notificationCounts, setNotificationCounts] = useState<NotificationCounts>({
    pendingDeposits: 0,
    unreadMessages: 0,
    pendingLoans: 0,
  });

  // Fetch site settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/site-settings');
        if (response.ok) {
          const data = await response.json();
          setSettings({
            bankName: data.bankName || 'Sterling Capital Bank',
            faviconUrl: data.faviconUrl,
            primaryColor: data.primaryColor || '#1e3a8a',
          });
        }
      } catch (error) {
        console.error('Error fetching site settings:', error);
      }
    };

    fetchSettings();
  }, []);

  // Fetch notification counts
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/admin/notifications');
        if (response.ok) {
          const data = await response.json();
          console.log('Notification counts:', data);
          setNotificationCounts(data);
        } else {
          console.error('Failed to fetch notifications:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();

    // Refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const SidebarContent = ({ collapsed = false, showCloseButton = false }: { collapsed?: boolean, showCloseButton?: boolean }) => (
    <>
      <div className={`p-6 border-b border-gray-800 ${collapsed ? 'px-3' : ''}`}>
        <div className="flex items-center justify-between">
          <div className={`flex items-center ${collapsed ? 'justify-center w-full' : 'space-x-3'}`}>
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center p-1 flex-shrink-0"
              style={{ backgroundColor: settings.primaryColor }}
            >
              <Shield className="w-6 h-6" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="font-bold text-lg whitespace-nowrap">Admin Panel</h1>
                <p className="text-xs text-gray-400">{settings.bankName}</p>
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
          {menuItems.map((item) => {
            const badgeCount = item.badgeKey ? notificationCounts[item.badgeKey as keyof NotificationCounts] : 0;
            return (
              <NavigationLink
                key={item.href}
                href={item.href}
                onClick={closeMobileMenu}
                loadingMessage={`Loading ${item.label}...`}
                title={collapsed ? item.label : ''}
                className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-3 py-3 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} relative`}>
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                  {collapsed && badgeCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </div>
                {!collapsed && badgeCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </NavigationLink>
            );
          })}

          {/* Super Admin Link - Only visible to super admins */}
          {isSuperAdmin && (
            <>
              <div className="my-2 border-t border-gray-700" />
              <NavigationLink
                href="/superadmin"
                onClick={closeMobileMenu}
                loadingMessage="Loading Super Admin Panel..."
                title={collapsed ? 'Super Admin' : ''}
                className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-3 py-3 rounded-lg transition-colors ${
                  pathname?.startsWith('/superadmin')
                    ? 'bg-yellow-600 text-white'
                    : 'text-yellow-300 hover:bg-gray-800'
                }`}
              >
                <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'}`}>
                  <Crown className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span className="text-sm font-medium">Super Admin</span>}
                </div>
              </NavigationLink>
            </>
          )}
        </div>
      </nav>

      <div className={`p-4 border-t border-gray-800 ${collapsed ? 'px-2' : ''}`}>
        <NavigationLink
          href="/dashboard"
          onClick={closeMobileMenu}
          loadingMessage="Switching to User Dashboard..."
          title={collapsed ? 'Back to User Dashboard' : ''}
          className={`flex items-center ${collapsed ? 'justify-center' : 'justify-center space-x-2'} px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm`}
        >
          {collapsed ? (
            <span className="text-xl">←</span>
          ) : (
            <span>← Back to User Dashboard</span>
          )}
        </NavigationLink>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 bg-gray-900 text-white p-2 rounded-lg shadow-lg hover:bg-gray-800 transition-colors"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Desktop Sidebar */}
      <aside className={`hidden lg:flex ${isCollapsed ? 'w-20' : 'w-64'} bg-gray-900 text-white flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out`}>
        <SidebarContent collapsed={isCollapsed} />

        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 bg-gray-900 text-white border-2 border-gray-700 rounded-full p-1.5 hover:bg-gray-800 transition-colors shadow-lg z-10"
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
        className={`lg:hidden fixed top-0 left-0 h-full w-64 bg-gray-900 text-white flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent showCloseButton={true} />
      </aside>
    </>
  );
}
