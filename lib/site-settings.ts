import { db } from '@/server/db';
import { siteSettings } from '@/shared/schema';

export interface SiteSettings {
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
  tagline: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
  address: string | null;
  copyrightText: string | null;

  // Social Media Links
  facebookUrl: string | null;
  twitterUrl: string | null;
  instagramUrl: string | null;
  linkedinUrl: string | null;
  whatsappNumber: string | null;

  // System Settings
  maintenanceMode: boolean;
  registrationEnabled: boolean;
}

const defaultSettings: SiteSettings = {
  id: 'default',

  // Logo & Icons
  logoUrl: null,
  faviconUrl: null,
  splashLogoUrl: null,
  appIconUrl: null,

  // Brand Colors
  primaryColor: '#1e3a8a', // blue-900
  secondaryColor: '#10b981', // green-500
  accentColor: '#ef4444', // red-500

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
  bankName: 'Online Banking',
  tagline: null,
  supportEmail: null,
  supportPhone: null,
  address: null,
  copyrightText: null,

  // Social Media Links
  facebookUrl: null,
  twitterUrl: null,
  instagramUrl: null,
  linkedinUrl: null,
  whatsappNumber: null,

  // System Settings
  maintenanceMode: false,
  registrationEnabled: true,
};

/**
 * Get site settings from database with caching
 * Falls back to default settings if none exist
 */
export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const settings = await db
      .select()
      .from(siteSettings)
      .limit(1);

    if (settings.length > 0) {
      return settings[0] as SiteSettings;
    }

    return defaultSettings;
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return defaultSettings;
  }
}

/**
 * Get only the bank name (lightweight query)
 */
export async function getBankName(): Promise<string> {
  try {
    const settings = await db
      .select({ bankName: siteSettings.bankName })
      .from(siteSettings)
      .limit(1);

    if (settings.length > 0) {
      return settings[0].bankName;
    }

    return defaultSettings.bankName;
  } catch (error) {
    console.error('Error fetching bank name:', error);
    return defaultSettings.bankName;
  }
}

/**
 * Settings specific to HTML pages
 * Used for dynamic content replacement in static HTML files
 */
export interface HtmlPageSettings {
  bankName: string;
  tagline: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
  address: string | null;
  copyrightText: string | null;
  facebookUrl: string | null;
  twitterUrl: string | null;
  instagramUrl: string | null;
  linkedinUrl: string | null;
  whatsappNumber: string | null;
}

/**
 * Get settings optimized for HTML pages
 * Returns only the fields needed for static page content replacement
 */
export async function getHtmlPageSettings(): Promise<HtmlPageSettings> {
  try {
    const settings = await db
      .select({
        bankName: siteSettings.bankName,
        tagline: siteSettings.tagline,
        supportEmail: siteSettings.supportEmail,
        supportPhone: siteSettings.supportPhone,
        address: siteSettings.address,
        copyrightText: siteSettings.copyrightText,
        facebookUrl: siteSettings.facebookUrl,
        twitterUrl: siteSettings.twitterUrl,
        instagramUrl: siteSettings.instagramUrl,
        linkedinUrl: siteSettings.linkedinUrl,
        whatsappNumber: siteSettings.whatsappNumber,
      })
      .from(siteSettings)
      .limit(1);

    if (settings.length > 0) {
      return settings[0];
    }

    return {
      bankName: defaultSettings.bankName,
      tagline: defaultSettings.tagline,
      supportEmail: defaultSettings.supportEmail,
      supportPhone: defaultSettings.supportPhone,
      address: defaultSettings.address,
      copyrightText: defaultSettings.copyrightText,
      facebookUrl: defaultSettings.facebookUrl,
      twitterUrl: defaultSettings.twitterUrl,
      instagramUrl: defaultSettings.instagramUrl,
      linkedinUrl: defaultSettings.linkedinUrl,
      whatsappNumber: defaultSettings.whatsappNumber,
    };
  } catch (error) {
    console.error('Error fetching HTML page settings:', error);
    return {
      bankName: defaultSettings.bankName,
      tagline: defaultSettings.tagline,
      supportEmail: defaultSettings.supportEmail,
      supportPhone: defaultSettings.supportPhone,
      address: defaultSettings.address,
      copyrightText: defaultSettings.copyrightText,
      facebookUrl: defaultSettings.facebookUrl,
      twitterUrl: defaultSettings.twitterUrl,
      instagramUrl: defaultSettings.instagramUrl,
      linkedinUrl: defaultSettings.linkedinUrl,
      whatsappNumber: defaultSettings.whatsappNumber,
    };
  }
}

/**
 * Generate copyright text with the current year
 */
export function generateCopyrightText(bankName: string): string {
  const currentYear = new Date().getFullYear();
  return `Copyright ${currentYear} by ${bankName}. All Rights Reserved.`;
}
