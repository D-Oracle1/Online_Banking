'use client';

import { useSiteSettings } from '@/hooks/useSiteSettings';

// Square bank-building mark from the brand assets; the wide wordmark doesn't fit the ring
const DEFAULT_LOGO = '/assets/images/brand/favicon.png';

/** Warm the browser cache so the first loader shows its logo straight away */
export function preloadLoadingLogo(src: string = DEFAULT_LOGO) {
  if (typeof window === 'undefined') return;
  const img = new Image();
  img.src = src;
}

/**
 * Animated loading mark: a spinning ring around the bank's logo
 * (or its initial when no logo is set), with bouncing dots underneath.
 */
export default function LoadingLogo({ message, size = 72 }: { message?: string; size?: number }) {
  // Branding comes from the shared site settings (seeded on the server)
  const { settings } = useSiteSettings();
  const branding = {
    bankName: settings.bankName,
    primaryColor: settings.primaryColor || '#1e3a8a',
    logo: settings.faviconUrl || DEFAULT_LOGO,
  };

  const color = branding.primaryColor;
  const logo = branding.logo;

  return (
    <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Track + spinning arc */}
        <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
        <div
          className="absolute inset-0 rounded-full border-4 border-transparent animate-spin"
          style={{ borderTopColor: color, borderRightColor: color, animationDuration: '0.9s' }}
        />
        {/* Pulsing logo in the middle */}
        <div className="absolute inset-[10px] rounded-full bg-white flex items-center justify-center overflow-hidden shadow-inner animate-pulse">
          {logo ? (
            <img src={logo} alt="" className="w-full h-full object-contain" />
          ) : (
            <span className="font-bold text-xl" style={{ color }}>
              {(branding.bankName || 'B').charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5" aria-hidden="true">
        {[0, 150, 300].map(delay => (
          <span
            key={delay}
            className="w-2 h-2 rounded-full animate-bounce"
            style={{ backgroundColor: color, animationDelay: `${delay}ms` }}
          />
        ))}
      </div>

      {message && <p className="text-sm font-medium text-gray-600 text-center">{message}</p>}
      <span className="sr-only">{message || 'Loading'}</span>
    </div>
  );
}
