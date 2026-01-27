'use client';

import { useState, useEffect } from 'react';
import { X, Download, Smartphone, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface SiteSettings {
  bankName: string;
  primaryColor: string;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>({
    bankName: 'Sterling Bank',
    primaryColor: '#4f46e5'
  });

  // Fetch site settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/site-settings');
        if (response.ok) {
          const data = await response.json();
          setSettings({
            bankName: data.bankName || 'Sterling Bank',
            primaryColor: data.primaryColor || '#4f46e5'
          });
        }
      } catch (error) {
        console.error('[PWA] Failed to fetch site settings:', error);
      }
    };

    fetchSettings();

    // Listen for theme changes
    const handleThemeChange = (event: CustomEvent) => {
      const theme = event.detail;
      if (theme?.primaryColor) {
        setSettings(prev => ({
          ...prev,
          primaryColor: theme.primaryColor
        }));
      }
      if (theme?.bankName) {
        setSettings(prev => ({
          ...prev,
          bankName: theme.bankName
        }));
      }
    };

    // Listen for settings updates
    const handleSettingsUpdate = () => {
      fetchSettings();
    };

    window.addEventListener('themechange', handleThemeChange as EventListener);
    window.addEventListener('settingsUpdated', handleSettingsUpdate);

    // Listen for BroadcastChannel updates
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('theme-sync-channel');
      channel.onmessage = (event) => {
        if (event.data?.type === 'THEME_UPDATE' && event.data?.theme) {
          const theme = event.data.theme;
          setSettings(prev => ({
            bankName: theme.bankName || prev.bankName,
            primaryColor: theme.primaryColor || prev.primaryColor
          }));
        } else if (event.data?.type === 'SETTINGS_UPDATED') {
          fetchSettings();
        }
      };
    } catch (e) {
      // BroadcastChannel not supported
    }

    return () => {
      window.removeEventListener('themechange', handleThemeChange as EventListener);
      window.removeEventListener('settingsUpdated', handleSettingsUpdate);
      if (channel) {
        channel.close();
      }
    };
  }, []);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isInStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(isInStandaloneMode);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Check if mobile
    const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(mobile);

    // Check if user has already dismissed the prompt
    const promptDismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedTime = promptDismissed ? parseInt(promptDismissed) : 0;
    const daysSinceDismissal = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

    // Don't show if already installed
    if (isInStandaloneMode) {
      console.log('[PWA] App is already installed');
      return;
    }

    // Don't show if dismissed within last 3 days (reduced from 7)
    if (daysSinceDismissal < 3) {
      console.log('[PWA] Prompt dismissed recently');
      return;
    }

    // Listen for the beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('[PWA] beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after 2 seconds (reduced from 3)
      setTimeout(() => {
        console.log('[PWA] Showing install prompt');
        setShowPrompt(true);
      }, 2000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS, show manual install instructions
    if (iOS && !isInStandaloneMode && daysSinceDismissal >= 3) {
      console.log('[PWA] Showing iOS install instructions');
      setTimeout(() => setShowPrompt(true), 2000);
    }

    // For Android mobile browsers that support PWA but haven't fired the event yet
    if (!iOS && mobile && !isInStandaloneMode && daysSinceDismissal >= 3) {
      // Wait a bit longer for the beforeinstallprompt event
      setTimeout(() => {
        // If we still don't have the prompt, show generic instructions
        if (!deferredPrompt) {
          console.log('[PWA] Showing generic mobile install instructions');
          setShowPrompt(true);
        }
      }, 5000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt && !isIOS) {
      return;
    }

    if (deferredPrompt) {
      // Android/Chrome installation
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt');
      } else {
        console.log('[PWA] User dismissed the install prompt');
      }

      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    setShowPrompt(false);
  };

  if (!showPrompt || isStandalone) {
    return null;
  }

  // Generate darker shade for gradient
  const darkerShade = `color-mix(in srgb, ${settings.primaryColor} 80%, black)`;

  return (
    <div className="fixed bottom-0 left-0 right-0 md:bottom-4 md:left-auto md:right-4 md:w-96 md:rounded-lg bg-white shadow-2xl border-t md:border border-gray-200 p-5 z-[9998] animate-slide-up">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-4">
        <div
          className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ background: `linear-gradient(to bottom right, ${settings.primaryColor}, ${darkerShade})` }}
        >
          <Smartphone className="w-7 h-7 text-white" />
        </div>

        <div className="flex-1 pr-6">
          <h3 className="font-bold text-gray-900 mb-1 text-lg">
            Install {settings.bankName}
          </h3>
          <p className="text-sm text-gray-600">
            Quick access from your home screen
          </p>
        </div>
      </div>

      {/* One-click install button for Android/Chrome */}
      {deferredPrompt && !isIOS && (
        <button
          onClick={handleInstallClick}
          className="mt-4 w-full text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-base"
          style={{
            background: `linear-gradient(to right, ${settings.primaryColor}, ${darkerShade})`,
          }}
        >
          <Download className="w-5 h-5" />
          Install App
        </button>
      )}

      {/* iOS Simple Instructions */}
      {isIOS && (
        <div
          className="mt-4 rounded-xl p-4"
          style={{
            backgroundColor: `color-mix(in srgb, ${settings.primaryColor} 10%, white)`,
            borderColor: `color-mix(in srgb, ${settings.primaryColor} 30%, white)`,
            borderWidth: '1px',
            borderStyle: 'solid'
          }}
        >
          <div className="flex items-center gap-3 mb-2">
            <Share className="w-5 h-5 flex-shrink-0" style={{ color: settings.primaryColor }} />
            <p className="text-sm font-semibold text-gray-900">
              Tap <span style={{ color: settings.primaryColor }}>Share</span> button, then select <span style={{ color: settings.primaryColor }}>"Add to Home Screen"</span>
            </p>
          </div>
        </div>
      )}

      {/* Fallback for other browsers */}
      {!deferredPrompt && !isIOS && isMobile && (
        <div className="mt-4 bg-gray-50 border border-gray-300 rounded-xl p-4">
          <p className="text-sm font-medium text-gray-700">
            Tap your browser menu <span className="text-lg">⋮</span> and select <span className="font-semibold">"Add to Home Screen"</span>
          </p>
        </div>
      )}

      <button
        onClick={handleDismiss}
        className="mt-3 w-full text-sm text-gray-500 hover:text-gray-700 transition-colors font-medium py-2"
      >
        Not now
      </button>
    </div>
  );
}
