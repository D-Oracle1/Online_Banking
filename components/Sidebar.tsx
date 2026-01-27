'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import NavigationLink from '@/components/NavigationLink';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  Home, BarChart3, FileText, DollarSign, History,
  FileBarChart, Send, Clock, CreditCard, Landmark, MessageCircle, Menu, X, User, Shield, ChevronLeft, ChevronRight
} from 'lucide-react';

const THEME_BROADCAST_CHANNEL = 'theme-sync-channel';
const THEME_STORAGE_KEY = 'theme-update-event';

const menuItems = [
  { icon: Home, label: 'Dashboard', href: '/dashboard' },
  { icon: BarChart3, label: 'Account Chart', href: '/dashboard/account-chart' },
  { icon: FileText, label: 'Account Details', href: '/dashboard/account-details' },
  { icon: DollarSign, label: 'Deposit (Top Up)', href: '/dashboard/deposit' },
  { icon: History, label: 'Top-up History', href: '/dashboard/topup-history' },
  { icon: FileBarChart, label: 'Account Summary', href: '/dashboard/account-summary' },
];

const transferItems = [
  { icon: Send, label: 'Bank Transfer', href: '/dashboard/transfer' },
  { icon: Clock, label: 'Transfer History', href: '/dashboard/transfer-history' },
];

const loanItems = [
  { icon: CreditCard, label: 'Loan Application', href: '/dashboard/loan' },
  { icon: Landmark, label: 'Fixed Savings', href: '/dashboard/fixed-savings' },
];

const messageItems = [
  { icon: MessageCircle, label: 'Message Support', href: '/dashboard/messages' },
];

const profileItems = [
  { icon: User, label: 'Edit Profile', href: '/dashboard/profile' },
  { icon: Shield, label: 'Security', href: '/dashboard/security' },
];

interface SiteSettings {
  bankName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>({
    bankName: 'Sterling Capital Bank',
    logoUrl: null,
    faviconUrl: null,
    primaryColor: '#1e3a8a',
  });

  // Update settings from theme changes
  const updateSettingsFromTheme = useCallback((themeUpdate: Partial<SiteSettings>) => {
    setSettings(prev => ({ ...prev, ...themeUpdate }));
  }, []);

  // Fetch site settings
  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/site-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings({
          bankName: data.bankName || 'Sterling Capital Bank',
          logoUrl: data.logoUrl || null,
          faviconUrl: data.faviconUrl || null,
          primaryColor: data.primaryColor || '#1e3a8a',
        });
      }
    } catch (error) {
      console.error('Error fetching site settings:', error);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Listen for theme changes from other tabs/windows
  useEffect(() => {
    // BroadcastChannel listener
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(THEME_BROADCAST_CHANNEL);
      channel.onmessage = (event) => {
        if (event.data?.type === 'THEME_UPDATE' && event.data?.theme) {
          updateSettingsFromTheme(event.data.theme);
        }
        // Also handle full settings update (for logo changes, etc.)
        if (event.data?.type === 'SETTINGS_UPDATED') {
          fetchSettings();
        }
      };
    } catch (e) {
      // BroadcastChannel not supported
    }

    // localStorage listener (fallback)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY && event.newValue) {
        try {
          const data = JSON.parse(event.newValue);
          if (data.theme) {
            updateSettingsFromTheme(data.theme);
          }
        } catch (e) {
          console.warn('Could not parse theme update:', e);
        }
      }
      // Also handle settings update event via localStorage
      if (event.key === 'settings-update-event' && event.newValue) {
        fetchSettings();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Listen for custom theme change event (same-tab communication)
    const handleThemeChange = (event: CustomEvent) => {
      if (event.detail) {
        updateSettingsFromTheme(event.detail);
      }
    };

    window.addEventListener('themechange' as any, handleThemeChange);

    // Also listen for settings update event to refetch (for logo changes, etc.)
    const handleSettingsUpdate = () => {
      fetchSettings();
    };
    window.addEventListener('settingsUpdated', handleSettingsUpdate);

    return () => {
      channel?.close();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('themechange' as any, handleThemeChange);
      window.removeEventListener('settingsUpdated', handleSettingsUpdate);
    };
  }, [updateSettingsFromTheme, fetchSettings]);

  const isActive = (href: string) => pathname === href;

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Compute darker shade for borders and hovers
  const darkerShade = `color-mix(in srgb, ${settings.primaryColor} 70%, black)`;
  const hoverShade = `color-mix(in srgb, ${settings.primaryColor} 85%, black)`;
  const lightTextShade = `color-mix(in srgb, ${settings.primaryColor} 30%, white)`;

  const SidebarContent = ({ collapsed = false, showCloseButton = false }: { collapsed?: boolean, showCloseButton?: boolean }) => (
    <>
      <div
        className={`p-6 ${collapsed ? 'px-3' : ''}`}
        style={{ borderBottom: `1px solid ${darkerShade}` }}
      >
        <div className="flex items-center justify-between">
          <div className={`flex items-center ${collapsed ? 'justify-center w-full' : 'space-x-3'}`}>
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1 flex-shrink-0">
              {(settings.logoUrl || settings.faviconUrl) ? (
                <img
                  src={settings.logoUrl || settings.faviconUrl || ''}
                  alt={settings.bankName}
                  className="w-8 h-8 object-contain"
                />
              ) : (
                <Image
                  src="/favicon.png"
                  alt={settings.bankName}
                  width={32}
                  height={32}
                  className="object-contain"
                />
              )}
            </div>
            {!collapsed && (
              <div>
                <h1 className="font-bold text-lg whitespace-nowrap">{settings.bankName}</h1>
              </div>
            )}
          </div>
          {/* Close button for mobile */}
          {showCloseButton && (
            <button
              onClick={closeMobileMenu}
              className="lg:hidden text-white hover:opacity-80 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        <div className={`${collapsed ? 'px-2' : 'px-3'} mb-6`}>
          {!collapsed && <p className="text-xs font-semibold uppercase tracking-wider mb-2 px-3" style={{ color: lightTextShade }}>Menu</p>}
          <div className="space-y-1">
            {menuItems.map((item) => (
              <NavigationLink
                key={item.href}
                href={item.href}
                onClick={closeMobileMenu}
                loadingMessage={`Loading ${item.label}...`}
                title={collapsed ? item.label : ''}
                className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} px-3 py-2 rounded-lg transition-colors`}
                style={{
                  backgroundColor: isActive(item.href) ? darkerShade : 'transparent',
                  color: 'rgba(255,255,255,0.9)',
                }}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm">{item.label}</span>}
              </NavigationLink>
            ))}
          </div>
        </div>

        <div className={`${collapsed ? 'px-2' : 'px-3'} mb-6`}>
          {!collapsed && <p className="text-xs font-semibold uppercase tracking-wider mb-2 px-3" style={{ color: lightTextShade }}>Fund Transfer</p>}
          <div className="space-y-1">
            {transferItems.map((item) => (
              <NavigationLink
                key={item.href}
                href={item.href}
                onClick={closeMobileMenu}
                loadingMessage={`Loading ${item.label}...`}
                title={collapsed ? item.label : ''}
                className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} px-3 py-2 rounded-lg transition-colors`}
                style={{
                  backgroundColor: isActive(item.href) ? darkerShade : 'transparent',
                  color: 'rgba(255,255,255,0.9)',
                }}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm">{item.label}</span>}
              </NavigationLink>
            ))}
          </div>
        </div>

        <div className={`${collapsed ? 'px-2' : 'px-3'} mb-6`}>
          {!collapsed && <p className="text-xs font-semibold uppercase tracking-wider mb-2 px-3" style={{ color: lightTextShade }}>Loan</p>}
          <div className="space-y-1">
            {loanItems.map((item) => (
              <NavigationLink
                key={item.href}
                href={item.href}
                onClick={closeMobileMenu}
                loadingMessage={`Loading ${item.label}...`}
                title={collapsed ? item.label : ''}
                className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} px-3 py-2 rounded-lg transition-colors`}
                style={{
                  backgroundColor: isActive(item.href) ? darkerShade : 'transparent',
                  color: 'rgba(255,255,255,0.9)',
                }}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm">{item.label}</span>}
              </NavigationLink>
            ))}
          </div>
        </div>

        <div className={`${collapsed ? 'px-2' : 'px-3'} mb-6`}>
          {!collapsed && <p className="text-xs font-semibold uppercase tracking-wider mb-2 px-3" style={{ color: lightTextShade }}>Messages</p>}
          <div className="space-y-1">
            {messageItems.map((item) => (
              <NavigationLink
                key={item.href}
                href={item.href}
                onClick={closeMobileMenu}
                loadingMessage={`Loading ${item.label}...`}
                title={collapsed ? item.label : ''}
                className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} px-3 py-2 rounded-lg transition-colors`}
                style={{
                  backgroundColor: isActive(item.href) ? darkerShade : 'transparent',
                  color: 'rgba(255,255,255,0.9)',
                }}
              >
                <div className="relative">
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {/* Green online indicator */}
                  <span
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"
                    style={{ borderWidth: '2px', borderColor: settings.primaryColor }}
                  ></span>
                </div>
                {!collapsed && <span className="text-sm">{item.label}</span>}
              </NavigationLink>
            ))}
          </div>
        </div>

        <div className={`${collapsed ? 'px-2' : 'px-3'}`}>
          {!collapsed && <p className="text-xs font-semibold uppercase tracking-wider mb-2 px-3" style={{ color: lightTextShade }}>Account</p>}
          <div className="space-y-1">
            {profileItems.map((item) => (
              <NavigationLink
                key={item.href}
                href={item.href}
                onClick={closeMobileMenu}
                loadingMessage={`Loading ${item.label}...`}
                title={collapsed ? item.label : ''}
                className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} px-3 py-2 rounded-lg transition-colors`}
                style={{
                  backgroundColor: isActive(item.href) ? darkerShade : 'transparent',
                  color: 'rgba(255,255,255,0.9)',
                }}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm">{item.label}</span>}
              </NavigationLink>
            ))}
          </div>
        </div>
      </nav>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 text-white p-2 rounded-lg shadow-lg transition-colors"
        style={{ backgroundColor: settings.primaryColor }}
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex ${isCollapsed ? 'w-20' : 'w-64'} text-white flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out`}
        style={{ backgroundColor: settings.primaryColor }}
      >
        <SidebarContent collapsed={isCollapsed} />

        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 text-white border-2 rounded-full p-1.5 transition-colors shadow-lg z-10"
          style={{
            backgroundColor: settings.primaryColor,
            borderColor: `color-mix(in srgb, ${settings.primaryColor} 70%, black)`,
          }}
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
        className={`lg:hidden fixed top-0 left-0 h-full w-64 text-white flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ backgroundColor: settings.primaryColor }}
      >
        <SidebarContent showCloseButton={true} />
      </aside>
    </>
  );
}
