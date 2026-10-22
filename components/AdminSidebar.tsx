'use client';

import { useState, useEffect } from 'react';
import NavigationLink from '@/components/NavigationLink';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, DollarSign, ArrowLeftRight,
  MessageSquare, FileText, Settings, CreditCard, Menu, X, UserCheck, Mail, Key, Crown, ChevronLeft, ChevronRight,
  ShieldAlert, UserCog, UserX, MessageSquareDashed, SlidersHorizontal, LogOut, ArrowLeft,
} from 'lucide-react';
import AdminNotificationBadge from '@/components/AdminNotificationBadge';
import { useSiteSettings } from '@/hooks/useSiteSettings';

type BadgeKey = 'pendingDeposits' | 'unreadMessages' | 'pendingLoans';

interface MenuItem {
  icon: typeof LayoutDashboard;
  label: string;
  href: string;
  badgeKey?: BadgeKey;
}

// Grouped like the dashboard design: a primary item, then labelled sections
const menuSections: { title: string | null; items: MenuItem[] }[] = [
  {
    title: null,
    items: [{ icon: LayoutDashboard, label: 'Overview', href: '/admin' }],
  },
  {
    title: 'Customers',
    items: [
      { icon: Users, label: 'Users Management', href: '/admin/users' },
      { icon: UserCheck, label: 'User Verification', href: '/admin/user-verification' },
      { icon: ShieldAlert, label: 'Account Restrictions', href: '/admin/restrictions' },
      { icon: UserX, label: 'Deleted Users', href: '/admin/deleted-users' },
    ],
  },
  {
    title: 'Money',
    items: [
      { icon: DollarSign, label: 'Deposits Approval', href: '/admin/deposits', badgeKey: 'pendingDeposits' },
      { icon: ArrowLeftRight, label: 'Transactions', href: '/admin/transactions' },
      { icon: FileText, label: 'Loan Applications', href: '/admin/loans', badgeKey: 'pendingLoans' },
      { icon: CreditCard, label: 'Loan Repayments', href: '/admin/loan-repayments' },
    ],
  },
  {
    title: 'Support',
    items: [
      { icon: MessageSquare, label: 'User Messages', href: '/admin/messages', badgeKey: 'unreadMessages' },
      { icon: MessageSquareDashed, label: 'Deleted Messages', href: '/admin/deleted-messages' },
      { icon: Mail, label: 'Bulk Email', href: '/admin/bulk-email' },
    ],
  },
  {
    title: 'Team',
    items: [
      { icon: SlidersHorizontal, label: 'Manager Rules', href: '/admin/managers' },
      { icon: UserCog, label: 'Manager Portal', href: '/manager' },
      { icon: Key, label: 'Code Generator', href: '/admin/code-generator' },
    ],
  },
];

const DEFAULT_LOGO = '/assets/images/brand/favicon.png';

interface AdminSidebarProps {
  isSuperAdmin?: boolean;
}

export default function AdminSidebar({ isSuperAdmin = false }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  // Start from the server-provided branding so the right name/logo show immediately
  const { settings: site } = useSiteSettings();
  const [bankName, setBankName] = useState(site.bankName);
  const [logo, setLogo] = useState(site.faviconUrl || DEFAULT_LOGO);
  const [notificationCounts, setNotificationCounts] = useState<Record<BadgeKey, number>>({
    pendingDeposits: 0,
    unreadMessages: 0,
    pendingLoans: 0,
  });

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  // Bank name and logo
  useEffect(() => {
    fetch('/api/site-settings')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (!data) return;
        if (data.bankName) setBankName(data.bankName);
        if (data.faviconUrl) setLogo(data.faviconUrl);
      })
      .catch(error => console.error('Error fetching site settings:', error));
  }, []);

  // Badge counts on menu items, refreshed every 30 seconds
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/admin/notifications');
        if (response.ok) setNotificationCounts(await response.json());
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const isActive = (href: string) => (href === '/admin' ? pathname === href : !!pathname?.startsWith(href));

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const itemClass = (active: boolean, collapsed: boolean) =>
    `flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-full text-sm transition-colors ${
      active ? 'bg-brand text-white shadow-sm' : 'text-gray-700 hover:bg-brand-tint hover:text-brand'
    }`;

  const SidebarContent = ({ collapsed = false, showCloseButton = false }: { collapsed?: boolean; showCloseButton?: boolean }) => (
    <>
      {/* Brand */}
      <div className={`pt-6 pb-4 ${collapsed ? 'px-3' : 'px-6'}`}>
        <div className="flex items-center justify-between">
          <div className={`flex items-center ${collapsed ? 'justify-center w-full' : 'gap-3'} min-w-0`}>
            <img src={logo} alt="" className="w-9 h-9 object-contain flex-shrink-0" />
            {!collapsed && (
              <div className="min-w-0">
                <p className="font-bold text-lg leading-tight text-gray-900 truncate">{bankName}</p>
                <p className="text-xs text-gray-500">Admin Panel</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* On phones the page's own bell is hidden behind the drawer, so offer one here */}
            {showCloseButton && <AdminNotificationBadge variant="light" />}
            {showCloseButton && (
              <button onClick={closeMobileMenu} className="text-gray-500 hover:text-gray-900 p-1" aria-label="Close menu">
                <X className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className={`flex-1 overflow-y-auto pb-4 scrollbar-hide ${collapsed ? 'px-2' : 'px-4'}`}>
        {menuSections.map((section, index) => (
          <div key={section.title ?? index} className={index > 0 ? 'mt-5' : ''}>
            {section.title && !collapsed && (
              <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">{section.title}</p>
            )}
            {section.title && collapsed && <div className="mx-3 mb-2 border-t border-gray-200" />}
            <div className="space-y-1">
              {section.items.map(item => {
                const badgeCount = item.badgeKey ? notificationCounts[item.badgeKey] : 0;
                const active = isActive(item.href);
                return (
                  <NavigationLink
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileMenu}
                    loadingMessage={`Loading ${item.label}...`}
                    title={collapsed ? item.label : ''}
                    className={itemClass(active, collapsed)}
                  >
                    <span className={`flex items-center ${collapsed ? '' : 'gap-3'} relative min-w-0`}>
                      <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                      {!collapsed && <span className="font-medium truncate">{item.label}</span>}
                      {collapsed && badgeCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                      )}
                    </span>
                    {!collapsed && badgeCount > 0 && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full min-w-[22px] text-center ${
                        active ? 'bg-white text-brand' : 'bg-brand text-white'
                      }`}>
                        {badgeCount > 99 ? '99+' : badgeCount}
                      </span>
                    )}
                  </NavigationLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom: settings and account actions */}
      <div className={`py-4 border-t border-gray-100 space-y-1 ${collapsed ? 'px-2' : 'px-4'}`}>
        <NavigationLink
          href="/admin/settings"
          onClick={closeMobileMenu}
          loadingMessage="Loading Settings..."
          title={collapsed ? 'Settings' : ''}
          className={itemClass(isActive('/admin/settings'), collapsed)}
        >
          <span className={`flex items-center ${collapsed ? '' : 'gap-3'}`}>
            <Settings className="w-[18px] h-[18px]" />
            {!collapsed && <span className="font-medium">Settings</span>}
          </span>
        </NavigationLink>

        {isSuperAdmin && (
          <NavigationLink
            href="/superadmin"
            onClick={closeMobileMenu}
            loadingMessage="Loading Super Admin Panel..."
            title={collapsed ? 'Super Admin' : ''}
            className={itemClass(!!pathname?.startsWith('/superadmin'), collapsed)}
          >
            <span className={`flex items-center ${collapsed ? '' : 'gap-3'}`}>
              <Crown className="w-[18px] h-[18px] text-amber-500" />
              {!collapsed && <span className="font-medium">Super Admin</span>}
            </span>
          </NavigationLink>
        )}

        <NavigationLink
          href="/dashboard"
          onClick={closeMobileMenu}
          loadingMessage="Switching to User Dashboard..."
          title={collapsed ? 'Back to User Dashboard' : ''}
          className={itemClass(false, collapsed)}
        >
          <span className={`flex items-center ${collapsed ? '' : 'gap-3'}`}>
            <ArrowLeft className="w-[18px] h-[18px]" />
            {!collapsed && <span className="font-medium">User Dashboard</span>}
          </span>
        </NavigationLink>

        <button
          onClick={handleLogout}
          title={collapsed ? 'Logout' : ''}
          className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-full text-sm font-medium text-red-600 hover:bg-red-50 transition-colors`}
        >
          <LogOut className="w-[18px] h-[18px]" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 bg-white text-gray-900 p-2 rounded-full shadow-md hover:bg-gray-50 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Desktop Sidebar: a floating white card */}
      <aside
        className={`hidden lg:flex ${isCollapsed ? 'w-20' : 'w-64'} m-4 mr-0 h-[calc(100vh-2rem)] bg-white rounded-3xl shadow-sm flex-col sticky top-4 z-30 flex-shrink-0 transition-all duration-300 ease-in-out`}
      >
        <SidebarContent collapsed={isCollapsed} />

        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 bg-white text-gray-700 border border-gray-200 rounded-full p-1.5 hover:bg-gray-50 transition-colors shadow-md z-10"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/40 z-40" onClick={closeMobileMenu} />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-full w-72 max-w-[85vw] bg-white flex flex-col z-50 rounded-r-3xl shadow-xl transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent showCloseButton={true} />
      </aside>
    </>
  );
}
