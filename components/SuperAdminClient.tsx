'use client';

import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import {
  Users, Shield, Palette, Image as ImageIcon, Save, Upload,
  Search, MoreVertical, Crown, UserCog, BarChart3, FileText,
  Settings, Trash2, Ban, CheckCircle, XCircle, Activity,
  TrendingUp, DollarSign, CreditCard, Mail, AlertCircle,
  RefreshCw, Download, Eye, Power
} from 'lucide-react';
import { dispatchThemeChange, ThemeSettings } from '@/contexts/ThemeContext';

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  isSuperAdmin: boolean;
  verificationStatus: string | null;
  createdAt: Date;
}

interface SiteSettings {
  id: string;

  // Logo & Icons
  logoUrl: string | null;
  faviconUrl: string | null;
  splashLogoUrl: string | null;
  appIconUrl: string | null;

  // Brand Colors
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;

  // Background Colors
  backgroundLight: string;
  backgroundDark: string;

  // Text Colors
  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  // Button Colors
  buttonPrimary: string;
  buttonSecondary: string;
  buttonSuccess: string;
  buttonWarning: string;
  buttonDanger: string;

  // Border & UI Colors
  borderColor: string;
  shadowColor: string;

  // Site Information
  bankName: string;
  tagline?: string | null;
  supportEmail?: string | null;
  supportPhone?: string | null;
  address?: string | null;
  copyrightText?: string | null;

  // Social Media Links
  facebookUrl?: string | null;
  twitterUrl?: string | null;
  instagramUrl?: string | null;
  linkedinUrl?: string | null;
  whatsappNumber?: string | null;

  // System Settings
  maintenanceMode: boolean;
  registrationEnabled: boolean;
}

interface Statistics {
  users: {
    total: number;
    active: number;
    registrationTrend: Array<{ date: string; count: number }>;
  };
  accounts: {
    total: number;
    totalBalance: number;
  };
  transactions: {
    total: number;
    volume: number;
  };
  deposits: {
    pending: number;
  };
  loans: {
    total: number;
    active: number;
    pending: number;
  };
  messages: {
    unread: number;
  };
}

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: Date;
  userName: string | null;
  userEmail: string | null;
}

interface SuperAdminClientProps {
  initialUsers: User[];
  initialSettings: SiteSettings;
}

// Preset color themes
const colorThemes = {
  professional: {
    name: 'Professional Blue',
    primaryColor: '#1e3a8a',
    secondaryColor: '#10b981',
    accentColor: '#ef4444',
    backgroundLight: '#ffffff',
    backgroundDark: '#f9fafb',
    textPrimary: '#111827',
    textSecondary: '#6b7280',
    textMuted: '#9ca3af',
    buttonPrimary: '#1e3a8a',
    buttonSecondary: '#64748b',
    buttonSuccess: '#10b981',
    buttonWarning: '#f59e0b',
    buttonDanger: '#ef4444',
    borderColor: '#e5e7eb',
    shadowColor: '#000000',
  },
  vibrant: {
    name: 'Vibrant Purple',
    primaryColor: '#7c3aed',
    secondaryColor: '#06b6d4',
    accentColor: '#f43f5e',
    backgroundLight: '#fefefe',
    backgroundDark: '#faf5ff',
    textPrimary: '#1f2937',
    textSecondary: '#6b7280',
    textMuted: '#9ca3af',
    buttonPrimary: '#7c3aed',
    buttonSecondary: '#6366f1',
    buttonSuccess: '#14b8a6',
    buttonWarning: '#f59e0b',
    buttonDanger: '#f43f5e',
    borderColor: '#e9d5ff',
    shadowColor: '#000000',
  },
  emerald: {
    name: 'Emerald Green',
    primaryColor: '#047857',
    secondaryColor: '#0891b2',
    accentColor: '#dc2626',
    backgroundLight: '#ffffff',
    backgroundDark: '#f0fdf4',
    textPrimary: '#111827',
    textSecondary: '#6b7280',
    textMuted: '#9ca3af',
    buttonPrimary: '#047857',
    buttonSecondary: '#0d9488',
    buttonSuccess: '#10b981',
    buttonWarning: '#f59e0b',
    buttonDanger: '#dc2626',
    borderColor: '#d1fae5',
    shadowColor: '#000000',
  },
  sunset: {
    name: 'Sunset Orange',
    primaryColor: '#ea580c',
    secondaryColor: '#0284c7',
    accentColor: '#dc2626',
    backgroundLight: '#fffbeb',
    backgroundDark: '#fef3c7',
    textPrimary: '#1f2937',
    textSecondary: '#78716c',
    textMuted: '#a8a29e',
    buttonPrimary: '#ea580c',
    buttonSecondary: '#f59e0b',
    buttonSuccess: '#16a34a',
    buttonWarning: '#eab308',
    buttonDanger: '#dc2626',
    borderColor: '#fed7aa',
    shadowColor: '#000000',
  },
};

type TabType = 'users' | 'customization' | 'statistics' | 'logs' | 'system';

export default function SuperAdminClient({ initialUsers, initialSettings }: SuperAdminClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [users, setUsers] = useState(initialUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [settings, setSettings] = useState(initialSettings);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Filter users
  const filteredUsers = users.filter(user =>
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const regularUsers = filteredUsers.filter(u => u.role === 'user');
  const admins = filteredUsers.filter(u => u.role === 'admin');
  const superAdmins = filteredUsers.filter(u => u.isSuperAdmin);

  // Helper function to extract theme settings from full settings
  const extractThemeSettings = (s: SiteSettings): ThemeSettings => ({
    primaryColor: s.primaryColor,
    secondaryColor: s.secondaryColor,
    accentColor: s.accentColor,
    backgroundLight: s.backgroundLight,
    backgroundDark: s.backgroundDark,
    textPrimary: s.textPrimary,
    textSecondary: s.textSecondary,
    textMuted: s.textMuted,
    buttonPrimary: s.buttonPrimary,
    buttonSecondary: s.buttonSecondary,
    buttonSuccess: s.buttonSuccess,
    buttonWarning: s.buttonWarning,
    buttonDanger: s.buttonDanger,
    borderColor: s.borderColor,
    shadowColor: s.shadowColor,
    // Include branding settings for full theme sync
    bankName: s.bankName,
    logoUrl: s.logoUrl,
    faviconUrl: s.faviconUrl,
  });

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/superadmin/statistics');
      if (response.ok) {
        const data = await response.json();
        setStatistics(data);
      }
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  // Fetch audit logs
  const fetchAuditLogs = async () => {
    try {
      setLogsLoading(true);
      const response = await fetch('/api/superadmin/audit-logs?limit=50');
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data.logs);
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'statistics') {
      fetchStatistics();
    } else if (activeTab === 'logs') {
      fetchAuditLogs();
    }
  }, [activeTab]);

  // Apply theme changes in real-time as colors are modified (live preview)
  useEffect(() => {
    // Only apply if we're on the customization tab for instant preview
    if (activeTab === 'customization') {
      const themeSettings = extractThemeSettings(settings);
      // Apply to document without broadcasting (just local preview)
      const root = document.documentElement;
      Object.entries({
        '--color-primary': themeSettings.primaryColor,
        '--color-secondary': themeSettings.secondaryColor,
        '--color-accent': themeSettings.accentColor,
        '--color-bg-light': themeSettings.backgroundLight,
        '--color-bg-dark': themeSettings.backgroundDark,
        '--color-text-primary': themeSettings.textPrimary,
        '--color-text-secondary': themeSettings.textSecondary,
        '--color-text-muted': themeSettings.textMuted,
        '--color-btn-primary': themeSettings.buttonPrimary,
        '--color-btn-secondary': themeSettings.buttonSecondary,
        '--color-btn-success': themeSettings.buttonSuccess,
        '--color-btn-warning': themeSettings.buttonWarning,
        '--color-btn-danger': themeSettings.buttonDanger,
        '--color-border': themeSettings.borderColor,
        '--color-shadow': themeSettings.shadowColor,
      }).forEach(([cssVar, value]) => {
        root.style.setProperty(cssVar, value);
      });
    }
  }, [settings, activeTab]);

  // Handle role change
  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      setIsProcessing(true);
      const response = await fetch('/api/superadmin/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (response.ok) {
        const updatedUsers = users.map(u =>
          u.id === userId ? { ...u, role: newRole } : u
        );
        setUsers(updatedUsers);
        toast.success(`User role updated to ${newRole}`);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update role');
      }
    } catch (error) {
      toast.error('Error updating role');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsProcessing(true);
      const response = await fetch('/api/superadmin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        setUsers(users.filter(u => u.id !== userId));
        toast.success('User deleted successfully');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete user');
      }
    } catch (error) {
      toast.error('Error deleting user');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle user status toggle
  const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';

    try {
      setIsProcessing(true);
      const response = await fetch('/api/superadmin/toggle-user-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status: newStatus }),
      });

      if (response.ok) {
        const updatedUsers = users.map(u =>
          u.id === userId ? { ...u, verificationStatus: newStatus === 'active' ? 'approved' : 'suspended' } : u
        );
        setUsers(updatedUsers);
        toast.success(`User ${newStatus === 'active' ? 'activated' : 'suspended'} successfully`);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update user status');
      }
    } catch (error) {
      toast.error('Error updating user status');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle settings save
  const handleSaveSettings = async () => {
    try {
      setIsProcessing(true);
      const response = await fetch('/api/superadmin/update-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        // Apply theme changes instantly across all tabs/windows
        const themeSettings = extractThemeSettings(settings);
        dispatchThemeChange(themeSettings);

        // Dispatch settings updated event for components that need to refetch (like for logo changes)
        window.dispatchEvent(new CustomEvent('settingsUpdated'));

        // Also broadcast the settings updated event to other tabs
        try {
          const channel = new BroadcastChannel('theme-sync-channel');
          channel.postMessage({ type: 'SETTINGS_UPDATED' });
          channel.close();
        } catch (e) {
          // BroadcastChannel not supported, use localStorage fallback
          try {
            localStorage.setItem('settings-update-event', JSON.stringify({ timestamp: Date.now() }));
          } catch (storageError) {
            // Silent fail
          }
        }

        toast.success('Settings saved and applied across the entire site!', {
          duration: 4000,
          icon: '✅',
        });
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to save settings');
      }
    } catch (error) {
      toast.error('Error saving settings');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (type: 'logo' | 'favicon' | 'splashLogo' | 'appIcon', file: File) => {
    try {
      setIsProcessing(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch('/api/superadmin/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const { url } = await response.json();
        const urlFieldMap: Record<string, string> = {
          logo: 'logoUrl',
          favicon: 'faviconUrl',
          splashLogo: 'splashLogoUrl',
          appIcon: 'appIconUrl',
        };
        const typeNameMap: Record<string, string> = {
          logo: 'Logo',
          favicon: 'Favicon',
          splashLogo: 'Splash Logo',
          appIcon: 'App Icon',
        };
        setSettings({
          ...settings,
          [urlFieldMap[type]]: url,
        });
        toast.success(`${typeNameMap[type]} uploaded successfully!`);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Upload failed');
      }
    } catch (error) {
      toast.error('Error uploading file');
    } finally {
      setIsProcessing(false);
    }
  };

  // Apply color theme
  const applyTheme = (themeKey: string) => {
    const theme = colorThemes[themeKey as keyof typeof colorThemes];
    if (theme) {
      const newSettings = {
        ...settings,
        ...theme,
      };
      setSettings(newSettings);

      // Apply theme instantly for live preview
      dispatchThemeChange(extractThemeSettings(newSettings));

      toast.success(`Applied ${theme.name} theme - Don't forget to save!`, {
        duration: 3000,
        icon: '🎨',
      });
    }
  };

  const tabs: Array<{ id: TabType; label: string; icon: any }> = [
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'customization', label: 'Customization', icon: Palette },
    { id: 'statistics', label: 'Statistics', icon: BarChart3 },
    { id: 'logs', label: 'Audit Logs', icon: FileText },
    { id: 'system', label: 'System Settings', icon: Settings },
  ];

  const ColorPicker = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <div className="flex items-center space-x-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 w-20 rounded-lg border-2 border-gray-300 cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg font-mono text-sm"
          placeholder="#000000"
        />
      </div>
    </div>
  );

  return (
    <>
      <Toaster position="top-right" />
      <div className="space-y-6">
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  color: activeTab === tab.id ? settings.primaryColor : '#6b7280',
                  borderBottomColor: activeTab === tab.id ? settings.primaryColor : 'transparent',
                  backgroundColor: activeTab === tab.id ? `${settings.primaryColor}10` : 'transparent',
                }}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-all whitespace-nowrap border-b-2 hover:bg-gray-50`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* User Management Tab */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                {/* Search */}
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900"
                  />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm">Super Admins</p>
                        <p className="text-4xl font-bold mt-2">{superAdmins.length}</p>
                      </div>
                      <Crown className="w-12 h-12 text-purple-200" />
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm">Admins</p>
                        <p className="text-4xl font-bold mt-2">{admins.length}</p>
                      </div>
                      <Shield className="w-12 h-12 text-blue-200" />
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm">Regular Users</p>
                        <p className="text-4xl font-bold mt-2">{regularUsers.length}</p>
                      </div>
                      <Users className="w-12 h-12 text-green-200" />
                    </div>
                  </div>
                </div>

                {/* Users List */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="font-bold text-lg mb-4">All Users</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="bg-white rounded-lg p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            user.isSuperAdmin ? 'bg-purple-100' : user.role === 'admin' ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            {user.isSuperAdmin ? (
                              <Crown className="w-6 h-6 text-purple-600" />
                            ) : user.role === 'admin' ? (
                              <Shield className="w-6 h-6 text-blue-600" />
                            ) : (
                              <UserCog className="w-6 h-6 text-gray-600" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="font-semibold text-gray-900">{user.fullName}</p>
                              {user.isSuperAdmin && (
                                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full font-semibold">
                                  SUPER ADMIN
                                </span>
                              )}
                              {user.role === 'admin' && !user.isSuperAdmin && (
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-semibold">
                                  ADMIN
                                </span>
                              )}
                              {user.verificationStatus === 'suspended' && (
                                <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full font-semibold">
                                  SUSPENDED
                                </span>
                              )}
                              {user.verificationStatus === 'pending' && (
                                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full font-semibold">
                                  PENDING
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">{user.email}</p>
                            <p className="text-xs text-gray-400">@{user.username}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!user.isSuperAdmin && (
                            <>
                              <button
                                onClick={() => handleRoleChange(user.id, user.role === 'admin' ? 'user' : 'admin')}
                                disabled={isProcessing}
                                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                                  user.role === 'admin'
                                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                                title={user.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                              >
                                {user.role === 'admin' ? 'Demote' : 'Promote'}
                              </button>
                              <button
                                onClick={() => handleToggleUserStatus(user.id, user.verificationStatus || 'pending')}
                                disabled={isProcessing}
                                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                                  user.verificationStatus === 'suspended'
                                    ? 'bg-green-600 text-white hover:bg-green-700'
                                    : 'bg-yellow-600 text-white hover:bg-yellow-700'
                                }`}
                                title={user.verificationStatus === 'suspended' ? 'Activate User' : 'Suspend User'}
                              >
                                {user.verificationStatus === 'suspended' ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id, user.fullName)}
                                disabled={isProcessing}
                                className="px-4 py-2 rounded-lg font-medium text-sm bg-red-600 text-white hover:bg-red-700 transition-colors"
                                title="Delete User"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Customization Tab */}
            {activeTab === 'customization' && (
              <div className="space-y-8">
                {/* Preset Themes */}
                <div>
                  <h3 className="font-bold text-lg mb-4">Quick Themes</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {Object.entries(colorThemes).map(([key, theme]) => (
                      <button
                        key={key}
                        onClick={() => applyTheme(key)}
                        className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all"
                      >
                        <div className="flex space-x-1 mb-2">
                          <div className="w-8 h-8 rounded" style={{ backgroundColor: theme.primaryColor }}></div>
                          <div className="w-8 h-8 rounded" style={{ backgroundColor: theme.secondaryColor }}></div>
                          <div className="w-8 h-8 rounded" style={{ backgroundColor: theme.accentColor }}></div>
                        </div>
                        <p className="text-sm font-semibold">{theme.name}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bank Information */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-bold text-lg mb-4">Bank Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Bank Name</label>
                      <input
                        type="text"
                        value={settings.bankName}
                        onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Tagline</label>
                      <input
                        type="text"
                        value={settings.tagline || ''}
                        onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Support Email</label>
                      <input
                        type="email"
                        value={settings.supportEmail || ''}
                        onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Support Phone</label>
                      <input
                        type="tel"
                        value={settings.supportPhone || ''}
                        onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                      <textarea
                        value={settings.address || ''}
                        onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
                        rows={2}
                        placeholder="Enter your bank's physical address"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Copyright Text</label>
                      <input
                        type="text"
                        value={settings.copyrightText || ''}
                        onChange={(e) => setSettings({ ...settings, copyrightText: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
                        placeholder="e.g., 2025 Sterling Capital Bank. All rights reserved."
                      />
                    </div>
                  </div>
                </div>

                {/* Social Media Links */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="font-bold text-lg mb-4">Social Media & Contact Links</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Facebook URL</label>
                      <input
                        type="url"
                        value={settings.facebookUrl || ''}
                        onChange={(e) => setSettings({ ...settings, facebookUrl: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
                        placeholder="https://facebook.com/yourpage"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Twitter URL</label>
                      <input
                        type="url"
                        value={settings.twitterUrl || ''}
                        onChange={(e) => setSettings({ ...settings, twitterUrl: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
                        placeholder="https://twitter.com/yourhandle"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Instagram URL</label>
                      <input
                        type="url"
                        value={settings.instagramUrl || ''}
                        onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
                        placeholder="https://instagram.com/yourhandle"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">LinkedIn URL</label>
                      <input
                        type="url"
                        value={settings.linkedinUrl || ''}
                        onChange={(e) => setSettings({ ...settings, linkedinUrl: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
                        placeholder="https://linkedin.com/company/yourcompany"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">WhatsApp Number</label>
                      <input
                        type="tel"
                        value={settings.whatsappNumber || ''}
                        onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg"
                        placeholder="+1234567890 (include country code)"
                      />
                    </div>
                  </div>
                </div>

                {/* Logo & Icons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg">Bank Logo</h3>
                        <p className="text-sm text-gray-600">Main logo - Recommended: 200x50px</p>
                      </div>
                      {settings.logoUrl && (
                        <img src={settings.logoUrl} alt="Logo" className="h-12 object-contain" />
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload('logo', file);
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg">Favicon</h3>
                        <p className="text-sm text-gray-600">Browser tab icon - Recommended: 32x32px</p>
                      </div>
                      {settings.faviconUrl && (
                        <img src={settings.faviconUrl} alt="Favicon" className="h-8 w-8 object-contain" />
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload('favicon', file);
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg">Splash Screen Logo</h3>
                        <p className="text-sm text-gray-600">Loading screen logo - Recommended: 280x112px</p>
                      </div>
                      {settings.splashLogoUrl && (
                        <img src={settings.splashLogoUrl} alt="Splash Logo" className="h-12 object-contain" />
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload('splashLogo', file);
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg">App Icon (PWA)</h3>
                        <p className="text-sm text-gray-600">Mobile app icon - Recommended: 512x512px</p>
                      </div>
                      {settings.appIconUrl && (
                        <img src={settings.appIconUrl} alt="App Icon" className="h-12 w-12 object-contain rounded-lg" />
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload('appIcon', file);
                      }}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                </div>

                {/* Brand Colors */}
                <div>
                  <h3 className="font-bold text-lg mb-4">Brand Colors</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ColorPicker
                      label="Primary Color"
                      value={settings.primaryColor}
                      onChange={(v) => setSettings({ ...settings, primaryColor: v })}
                    />
                    <ColorPicker
                      label="Secondary Color"
                      value={settings.secondaryColor}
                      onChange={(v) => setSettings({ ...settings, secondaryColor: v })}
                    />
                    <ColorPicker
                      label="Accent Color"
                      value={settings.accentColor}
                      onChange={(v) => setSettings({ ...settings, accentColor: v })}
                    />
                  </div>
                </div>

                {/* Background Colors */}
                <div>
                  <h3 className="font-bold text-lg mb-4">Background Colors</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ColorPicker
                      label="Light Background"
                      value={settings.backgroundLight}
                      onChange={(v) => setSettings({ ...settings, backgroundLight: v })}
                    />
                    <ColorPicker
                      label="Dark Background"
                      value={settings.backgroundDark}
                      onChange={(v) => setSettings({ ...settings, backgroundDark: v })}
                    />
                  </div>
                </div>

                {/* Text Colors */}
                <div>
                  <h3 className="font-bold text-lg mb-4">Text Colors</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ColorPicker
                      label="Primary Text"
                      value={settings.textPrimary}
                      onChange={(v) => setSettings({ ...settings, textPrimary: v })}
                    />
                    <ColorPicker
                      label="Secondary Text"
                      value={settings.textSecondary}
                      onChange={(v) => setSettings({ ...settings, textSecondary: v })}
                    />
                    <ColorPicker
                      label="Muted Text"
                      value={settings.textMuted}
                      onChange={(v) => setSettings({ ...settings, textMuted: v })}
                    />
                  </div>
                </div>

                {/* Button Colors */}
                <div>
                  <h3 className="font-bold text-lg mb-4">Button Colors</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ColorPicker
                      label="Primary Button"
                      value={settings.buttonPrimary}
                      onChange={(v) => setSettings({ ...settings, buttonPrimary: v })}
                    />
                    <ColorPicker
                      label="Secondary Button"
                      value={settings.buttonSecondary}
                      onChange={(v) => setSettings({ ...settings, buttonSecondary: v })}
                    />
                    <ColorPicker
                      label="Success Button"
                      value={settings.buttonSuccess}
                      onChange={(v) => setSettings({ ...settings, buttonSuccess: v })}
                    />
                    <ColorPicker
                      label="Warning Button"
                      value={settings.buttonWarning}
                      onChange={(v) => setSettings({ ...settings, buttonWarning: v })}
                    />
                    <ColorPicker
                      label="Danger Button"
                      value={settings.buttonDanger}
                      onChange={(v) => setSettings({ ...settings, buttonDanger: v })}
                    />
                  </div>
                </div>

                {/* UI Colors */}
                <div>
                  <h3 className="font-bold text-lg mb-4">UI Colors</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ColorPicker
                      label="Border Color"
                      value={settings.borderColor}
                      onChange={(v) => setSettings({ ...settings, borderColor: v })}
                    />
                    <ColorPicker
                      label="Shadow Color"
                      value={settings.shadowColor}
                      onChange={(v) => setSettings({ ...settings, shadowColor: v })}
                    />
                  </div>
                </div>

                {/* Theme Preview */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-dashed border-gray-300">
                  <h3 className="font-bold text-lg mb-4 flex items-center space-x-2">
                    <Eye className="w-5 h-5" />
                    <span>Live Theme Preview</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Primary Button Preview */}
                    <div className="space-y-2">
                      <p className="text-xs text-gray-600 font-semibold">Buttons</p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          style={{ backgroundColor: settings.buttonPrimary }}
                          className="px-4 py-2 rounded-lg text-white font-medium text-sm"
                        >
                          Primary
                        </button>
                        <button
                          style={{ backgroundColor: settings.buttonSecondary }}
                          className="px-4 py-2 rounded-lg text-white font-medium text-sm"
                        >
                          Secondary
                        </button>
                        <button
                          style={{ backgroundColor: settings.buttonSuccess }}
                          className="px-4 py-2 rounded-lg text-white font-medium text-sm"
                        >
                          Success
                        </button>
                        <button
                          style={{ backgroundColor: settings.buttonWarning }}
                          className="px-4 py-2 rounded-lg text-white font-medium text-sm"
                        >
                          Warning
                        </button>
                        <button
                          style={{ backgroundColor: settings.buttonDanger }}
                          className="px-4 py-2 rounded-lg text-white font-medium text-sm"
                        >
                          Danger
                        </button>
                      </div>
                    </div>

                    {/* Text Colors Preview */}
                    <div className="space-y-2">
                      <p className="text-xs text-gray-600 font-semibold">Text Colors</p>
                      <div className="space-y-1">
                        <p style={{ color: settings.textPrimary }} className="font-semibold">
                          Primary Text
                        </p>
                        <p style={{ color: settings.textSecondary }} className="text-sm">
                          Secondary Text
                        </p>
                        <p style={{ color: settings.textMuted }} className="text-xs">
                          Muted Text
                        </p>
                      </div>
                    </div>

                    {/* Background Preview */}
                    <div className="space-y-2">
                      <p className="text-xs text-gray-600 font-semibold">Backgrounds</p>
                      <div className="flex gap-2">
                        <div
                          style={{ backgroundColor: settings.backgroundLight }}
                          className="flex-1 h-16 rounded-lg border-2"
                          title="Light Background"
                        >
                          <p className="text-center text-xs pt-6">Light</p>
                        </div>
                        <div
                          style={{ backgroundColor: settings.backgroundDark }}
                          className="flex-1 h-16 rounded-lg border-2"
                          title="Dark Background"
                        >
                          <p className="text-center text-xs pt-6">Dark</p>
                        </div>
                      </div>
                    </div>

                    {/* Brand Colors Preview */}
                    <div className="space-y-2">
                      <p className="text-xs text-gray-600 font-semibold">Brand Colors</p>
                      <div className="flex gap-2">
                        <div className="flex-1 space-y-1">
                          <div
                            style={{ backgroundColor: settings.primaryColor }}
                            className="h-12 rounded-lg"
                          ></div>
                          <p className="text-xs text-center">Primary</p>
                        </div>
                        <div className="flex-1 space-y-1">
                          <div
                            style={{ backgroundColor: settings.secondaryColor }}
                            className="h-12 rounded-lg"
                          ></div>
                          <p className="text-xs text-center">Secondary</p>
                        </div>
                        <div className="flex-1 space-y-1">
                          <div
                            style={{ backgroundColor: settings.accentColor }}
                            className="h-12 rounded-lg"
                          ></div>
                          <p className="text-xs text-center">Accent</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleSaveSettings}
                    disabled={isProcessing}
                    style={{ backgroundColor: settings.buttonPrimary }}
                    className="flex items-center space-x-2 text-white px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50 hover:opacity-90 shadow-lg"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        <span>Save All Settings</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Statistics Tab */}
            {activeTab === 'statistics' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-2xl">System Statistics</h3>
                  <button
                    onClick={fetchStatistics}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Refresh</span>
                  </button>
                </div>

                {statistics ? (
                  <>
                    {/* User Stats */}
                    <div>
                      <h4 className="font-semibold text-lg mb-3">Users</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-blue-100 text-sm">Total Users</p>
                              <p className="text-4xl font-bold mt-2">{statistics.users.total}</p>
                            </div>
                            <Users className="w-12 h-12 text-blue-200" />
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-green-100 text-sm">Active Users (30d)</p>
                              <p className="text-4xl font-bold mt-2">{statistics.users.active}</p>
                            </div>
                            <Activity className="w-12 h-12 text-green-200" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Account Stats */}
                    <div>
                      <h4 className="font-semibold text-lg mb-3">Accounts & Finances</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-purple-100 text-sm">Total Accounts</p>
                              <p className="text-4xl font-bold mt-2">{statistics.accounts.total}</p>
                            </div>
                            <CreditCard className="w-12 h-12 text-purple-200" />
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-emerald-100 text-sm">Total Balance</p>
                              <p className="text-3xl font-bold mt-2">${statistics.accounts.totalBalance.toLocaleString()}</p>
                            </div>
                            <DollarSign className="w-12 h-12 text-emerald-200" />
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-xl p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-cyan-100 text-sm">Transactions</p>
                              <p className="text-4xl font-bold mt-2">{statistics.transactions.total}</p>
                            </div>
                            <TrendingUp className="w-12 h-12 text-cyan-200" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pending Actions */}
                    <div>
                      <h4 className="font-semibold text-lg mb-3">Pending Actions</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-orange-100 text-sm">Pending Deposits</p>
                              <p className="text-4xl font-bold mt-2">{statistics.deposits.pending}</p>
                            </div>
                            <AlertCircle className="w-12 h-12 text-orange-200" />
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-xl p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-yellow-100 text-sm">Pending Loans</p>
                              <p className="text-4xl font-bold mt-2">{statistics.loans.pending}</p>
                            </div>
                            <AlertCircle className="w-12 h-12 text-yellow-200" />
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-red-100 text-sm">Unread Messages</p>
                              <p className="text-4xl font-bold mt-2">{statistics.messages.unread}</p>
                            </div>
                            <Mail className="w-12 h-12 text-red-200" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Loan Stats */}
                    <div>
                      <h4 className="font-semibold text-lg mb-3">Loans</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                          <p className="text-gray-600 text-sm mb-2">Total Loans</p>
                          <p className="text-3xl font-bold text-gray-900">{statistics.loans.total}</p>
                        </div>
                        <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                          <p className="text-gray-600 text-sm mb-2">Active Loans</p>
                          <p className="text-3xl font-bold text-green-600">{statistics.loans.active}</p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
                  </div>
                )}
              </div>
            )}

            {/* Audit Logs Tab */}
            {activeTab === 'logs' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-2xl">Audit Logs</h3>
                  <button
                    onClick={fetchAuditLogs}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Refresh</span>
                  </button>
                </div>

                {logsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {auditLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  log.action.includes('DELETE') ? 'bg-red-100 text-red-800' :
                                  log.action.includes('CREATE') || log.action.includes('ACTIVATE') ? 'bg-green-100 text-green-800' :
                                  log.action.includes('UPDATE') ? 'bg-blue-100 text-blue-800' :
                                  log.action.includes('SUSPEND') ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {log.action}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm font-medium text-gray-900">{log.userName}</div>
                                <div className="text-sm text-gray-500">{log.userEmail}</div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600 max-w-md truncate">
                                {log.details}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {log.ipAddress || 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(log.createdAt).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* System Settings Tab */}
            {activeTab === 'system' && (
              <div className="space-y-6">
                <h3 className="font-bold text-2xl">System Settings</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Maintenance Mode */}
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-lg mb-2">Maintenance Mode</h4>
                        <p className="text-sm text-gray-600 mb-4">
                          Enable maintenance mode to prevent users from accessing the platform
                        </p>
                      </div>
                      <Power className={`w-8 h-8 ${settings.maintenanceMode ? 'text-red-500' : 'text-gray-400'}`} />
                    </div>
                    <button
                      onClick={() => {
                        if (settings.maintenanceMode) {
                          setSettings({ ...settings, maintenanceMode: false });
                        } else {
                          if (confirm('⚠️ Warning: Enabling maintenance mode will prevent all users from accessing the platform. Continue?')) {
                            setSettings({ ...settings, maintenanceMode: true });
                          }
                        }
                      }}
                      className={`w-full px-4 py-3 rounded-lg font-semibold transition-colors ${
                        settings.maintenanceMode
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {settings.maintenanceMode ? 'Disable Maintenance Mode' : 'Enable Maintenance Mode'}
                    </button>
                  </div>

                  {/* Registration Toggle */}
                  <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-lg mb-2">User Registration</h4>
                        <p className="text-sm text-gray-600 mb-4">
                          Control whether new users can register on the platform
                        </p>
                      </div>
                      <UserCog className={`w-8 h-8 ${settings.registrationEnabled ? 'text-green-500' : 'text-red-400'}`} />
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, registrationEnabled: !settings.registrationEnabled })}
                      className={`w-full px-4 py-3 rounded-lg font-semibold transition-colors ${
                        settings.registrationEnabled
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {settings.registrationEnabled ? 'Disable Registration' : 'Enable Registration'}
                    </button>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleSaveSettings}
                    disabled={isProcessing}
                    style={{ backgroundColor: settings.buttonPrimary }}
                    className="flex items-center space-x-2 text-white px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50 hover:opacity-90 shadow-lg"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        <span>Save System Settings</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
