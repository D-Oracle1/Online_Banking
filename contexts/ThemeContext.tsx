'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';

export interface ThemeSettings {
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
  // Additional branding settings (not CSS variables but needed for theme sync)
  bankName?: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
}

interface ThemeContextValue {
  theme: ThemeSettings;
  updateTheme: (newTheme: Partial<ThemeSettings>) => void;
  broadcastThemeChange: (newTheme: ThemeSettings) => void;
}

const defaultTheme: ThemeSettings = {
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
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: defaultTheme,
  updateTheme: () => {},
  broadcastThemeChange: () => {},
});

// CSS variable keys (excludes non-color properties)
type CSSVariableKeys = Exclude<keyof ThemeSettings, 'bankName' | 'logoUrl' | 'faviconUrl'>;

// CSS variable mapping
const cssVariableMap: Record<CSSVariableKeys, string> = {
  primaryColor: '--color-primary',
  secondaryColor: '--color-secondary',
  accentColor: '--color-accent',
  backgroundLight: '--color-bg-light',
  backgroundDark: '--color-bg-dark',
  textPrimary: '--color-text-primary',
  textSecondary: '--color-text-secondary',
  textMuted: '--color-text-muted',
  buttonPrimary: '--color-btn-primary',
  buttonSecondary: '--color-btn-secondary',
  buttonSuccess: '--color-btn-success',
  buttonWarning: '--color-btn-warning',
  buttonDanger: '--color-btn-danger',
  borderColor: '--color-border',
  shadowColor: '--color-shadow',
};

// Apply theme to document root
function applyThemeToDocument(theme: ThemeSettings) {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  Object.entries(cssVariableMap).forEach(([key, cssVar]) => {
    const value = theme[key as keyof ThemeSettings];
    if (value) {
      root.style.setProperty(cssVar, value);
    }
  });
}

// Extract current theme from CSS variables
function getThemeFromDocument(): ThemeSettings | null {
  if (typeof document === 'undefined') return null;

  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);

  const theme: Partial<ThemeSettings> = {};
  Object.entries(cssVariableMap).forEach(([key, cssVar]) => {
    const value = computedStyle.getPropertyValue(cssVar).trim();
    if (value) {
      theme[key as keyof ThemeSettings] = value;
    }
  });

  // Only return if we have all values
  if (Object.keys(theme).length === Object.keys(cssVariableMap).length) {
    return theme as ThemeSettings;
  }
  return null;
}

const THEME_BROADCAST_CHANNEL = 'theme-sync-channel';
const THEME_STORAGE_KEY = 'theme-update-event';

export function ThemeProvider({
  children,
  initialTheme
}: {
  children: ReactNode;
  initialTheme?: Partial<ThemeSettings>;
}) {
  const [theme, setTheme] = useState<ThemeSettings>(() => {
    // Try to get theme from document first (SSR injected), then use initial or default
    const docTheme = getThemeFromDocument();
    return docTheme || { ...defaultTheme, ...initialTheme };
  });

  // Update theme and apply to document
  const updateTheme = useCallback((newTheme: Partial<ThemeSettings>) => {
    setTheme(prev => {
      const updated = { ...prev, ...newTheme };
      applyThemeToDocument(updated);
      return updated;
    });
  }, []);

  // Broadcast theme change to other tabs/windows
  const broadcastThemeChange = useCallback((newTheme: ThemeSettings) => {
    // Update local state and apply
    setTheme(newTheme);
    applyThemeToDocument(newTheme);

    // Try BroadcastChannel first (modern browsers)
    try {
      const channel = new BroadcastChannel(THEME_BROADCAST_CHANNEL);
      channel.postMessage({ type: 'THEME_UPDATE', theme: newTheme });
      channel.close();
    } catch (e) {
      // Fallback to localStorage event for older browsers
      try {
        localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({
          theme: newTheme,
          timestamp: Date.now()
        }));
      } catch (storageError) {
        console.warn('Could not broadcast theme change:', storageError);
      }
    }
  }, []);

  // Listen for theme changes from other tabs
  useEffect(() => {
    // BroadcastChannel listener
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(THEME_BROADCAST_CHANNEL);
      channel.onmessage = (event) => {
        if (event.data?.type === 'THEME_UPDATE' && event.data?.theme) {
          setTheme(event.data.theme);
          applyThemeToDocument(event.data.theme);
        }
      };
    } catch (e) {
      // BroadcastChannel not supported
    }

    // localStorage listener (fallback and for cross-origin iframes)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY && event.newValue) {
        try {
          const data = JSON.parse(event.newValue);
          if (data.theme) {
            setTheme(data.theme);
            applyThemeToDocument(data.theme);
          }
        } catch (e) {
          console.warn('Could not parse theme update:', e);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom event (for same-tab communication)
    const handleCustomEvent = (event: CustomEvent<ThemeSettings>) => {
      if (event.detail) {
        setTheme(event.detail);
        applyThemeToDocument(event.detail);
      }
    };

    window.addEventListener('themechange' as any, handleCustomEvent);

    return () => {
      channel?.close();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('themechange' as any, handleCustomEvent);
    };
  }, []);

  // Apply initial theme on mount
  useEffect(() => {
    applyThemeToDocument(theme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, broadcastThemeChange }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

// Utility function to dispatch theme change event (for use outside React)
export function dispatchThemeChange(theme: ThemeSettings) {
  // Apply immediately
  applyThemeToDocument(theme);

  // Dispatch custom event for same-tab React components
  window.dispatchEvent(new CustomEvent('themechange', { detail: theme }));

  // Broadcast to other tabs
  try {
    const channel = new BroadcastChannel(THEME_BROADCAST_CHANNEL);
    channel.postMessage({ type: 'THEME_UPDATE', theme });
    channel.close();
  } catch (e) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify({
        theme,
        timestamp: Date.now()
      }));
    } catch (storageError) {
      // Silent fail
    }
  }
}

export { defaultTheme };
