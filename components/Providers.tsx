'use client';

import { LoadingProvider } from '@/contexts/LoadingContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import GlobalLoadingIndicator from '@/components/GlobalLoadingIndicator';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LoadingProvider>
        {children}
        <GlobalLoadingIndicator />
        <PWAInstallPrompt />
      </LoadingProvider>
    </ThemeProvider>
  );
}
