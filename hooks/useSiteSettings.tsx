'use client';

import { useState, useEffect, createContext, useContext, useCallback } from 'react';

const THEME_BROADCAST_CHANNEL = 'theme-sync-channel';
const THEME_STORAGE_KEY = 'theme-update-event';

export interface SiteSettings {
  id: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  splashLogoUrl: string | null;
  appIconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundLight: string;
  backgroundDark: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  buttonPrimary: string;
  buttonSecondary: string;
  buttonSuccess: string;
  buttonWarning: string;
  buttonDanger: string;
  borderColor: string;
  shadowColor: string;
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
  maintenanceMode: boolean;
  registrationEnabled: boolean;
}

const defaultSettings: SiteSettings = {
  id: 'default',
  logoUrl: null,
  faviconUrl: null,
  splashLogoUrl: null,
  appIconUrl: null,
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
  bankName: 'Sterling Capital Bank',
  tagline: null,
  supportEmail: null,
  supportPhone: null,
  address: null,
  copyrightText: null,
  facebookUrl: null,
  twitterUrl: null,
  instagramUrl: null,
  linkedinUrl: null,
  whatsappNumber: null,
  maintenanceMode: false,
  registrationEnabled: true,
};

// Context for site settings
const SiteSettingsContext = createContext<{
  settings: SiteSettings;
  loading: boolean;
  refetch: () => Promise<void>;
}>({
  settings: defaultSettings,
  loading: true,
  refetch: async () => {},
});

// Hook to use site settings
export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}

// Hook to fetch settings (for use outside provider)
export function useFetchSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/site-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings({ ...defaultSettings, ...data });
      }
    } catch (error) {
      console.error('Error fetching site settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update settings with partial theme changes
  const updateSettingsFromTheme = useCallback((themeUpdate: Partial<SiteSettings>) => {
    setSettings(prev => ({ ...prev, ...themeUpdate }));
  }, []);

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
    };

    window.addEventListener('storage', handleStorageChange);

    // Listen for custom theme change event (same-tab communication)
    const handleThemeChange = (event: CustomEvent) => {
      if (event.detail) {
        updateSettingsFromTheme(event.detail);
      }
    };

    window.addEventListener('themechange' as any, handleThemeChange);

    return () => {
      channel?.close();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('themechange' as any, handleThemeChange);
    };
  }, [updateSettingsFromTheme]);

  return { settings, loading, refetch: fetchSettings };
}

// Provider component
export function SiteSettingsProvider({
  children,
  initialSettings
}: {
  children: React.ReactNode;
  initialSettings?: SiteSettings;
}) {
  const [settings, setSettings] = useState<SiteSettings>(initialSettings || defaultSettings);
  const [loading, setLoading] = useState(!initialSettings);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/site-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings({ ...defaultSettings, ...data });
      }
    } catch (error) {
      console.error('Error fetching site settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update settings with partial theme changes
  const updateSettingsFromTheme = useCallback((themeUpdate: Partial<SiteSettings>) => {
    setSettings(prev => ({ ...prev, ...themeUpdate }));
  }, []);

  useEffect(() => {
    if (!initialSettings) {
      fetchSettings();
    }
  }, [initialSettings, fetchSettings]);

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
    };

    window.addEventListener('storage', handleStorageChange);

    // Listen for custom theme change event (same-tab communication)
    const handleThemeChange = (event: CustomEvent) => {
      if (event.detail) {
        updateSettingsFromTheme(event.detail);
      }
    };

    window.addEventListener('themechange' as any, handleThemeChange);

    return () => {
      channel?.close();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('themechange' as any, handleThemeChange);
    };
  }, [updateSettingsFromTheme]);

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, refetch: fetchSettings }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

// Utility function to generate inline styles for theme colors
export function getThemeStyles(settings: SiteSettings) {
  return {
    '--color-primary': settings.primaryColor,
    '--color-secondary': settings.secondaryColor,
    '--color-accent': settings.accentColor,
    '--color-bg-light': settings.backgroundLight,
    '--color-bg-dark': settings.backgroundDark,
    '--color-text-primary': settings.textPrimary,
    '--color-text-secondary': settings.textSecondary,
    '--color-text-muted': settings.textMuted,
    '--color-btn-primary': settings.buttonPrimary,
    '--color-btn-secondary': settings.buttonSecondary,
    '--color-btn-success': settings.buttonSuccess,
    '--color-btn-warning': settings.buttonWarning,
    '--color-btn-danger': settings.buttonDanger,
    '--color-border': settings.borderColor,
    '--color-shadow': settings.shadowColor,
  } as React.CSSProperties;
}

export { defaultSettings, SiteSettingsContext };
