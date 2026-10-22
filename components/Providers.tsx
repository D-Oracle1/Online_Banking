'use client';

import { LoadingProvider } from '@/contexts/LoadingContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SiteSettingsProvider, type SiteSettings } from '@/hooks/useSiteSettings';
import GlobalLoadingIndicator from '@/components/GlobalLoadingIndicator';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';

export default function Providers({
  children,
  initialSettings,
}: {
  children: React.ReactNode;
  /** Loaded on the server so the bank's name and logo are right on first paint */
  initialSettings?: SiteSettings;
}) {
  return (
    <SiteSettingsProvider initialSettings={initialSettings}>
      <ThemeProvider>
        <LoadingProvider>
          {children}
          <GlobalLoadingIndicator />
          <PWAInstallPrompt />
        </LoadingProvider>
      </ThemeProvider>
    </SiteSettingsProvider>
  );
}
