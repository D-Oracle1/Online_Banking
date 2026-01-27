import { requireSuperAdmin } from '@/lib/superadmin';
import SuperAdminClient from '@/components/SuperAdminClient';
import { db } from '@/server/db';
import { users, siteSettings } from '@/shared/schema';
import { eq } from 'drizzle-orm';

export default async function SuperAdminPage() {
  await requireSuperAdmin();

  // Fetch all users and admins
  const allUsers = await db.select().from(users);

  // Fetch current site settings
  const settings = await db.select().from(siteSettings);
  const currentSettings = settings[0] || {
    id: 'default',
    logoUrl: null,
    faviconUrl: null,
    // Brand Colors
    primaryColor: '#1e3a8a',
    secondaryColor: '#10b981',
    accentColor: '#ef4444',
    // Background Colors
    backgroundLight: '#ffffff',
    backgroundDark: '#f9fafb',
    // Text Colors
    textPrimary: '#111827',
    textSecondary: '#6b7280',
    textMuted: '#9ca3af',
    // Button Colors
    buttonPrimary: '#1e3a8a',
    buttonSecondary: '#64748b',
    buttonSuccess: '#10b981',
    buttonWarning: '#f59e0b',
    buttonDanger: '#ef4444',
    // Border & UI Colors
    borderColor: '#e5e7eb',
    shadowColor: '#000000',
    // Site Information
    bankName: 'Sterling Capital Bank',
    tagline: null,
    supportEmail: null,
    supportPhone: null,
    // System Settings
    maintenanceMode: false,
    registrationEnabled: true,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🔐 Super Admin Control Panel</h1>
          <p className="text-gray-600">Full system administration and customization</p>
        </div>

        <SuperAdminClient
          initialUsers={allUsers}
          initialSettings={currentSettings}
        />
      </div>
    </div>
  );
}
