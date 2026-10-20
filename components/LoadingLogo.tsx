'use client';

import { useEffect, useState } from 'react';

interface Branding {
  bankName: string;
  primaryColor: string;
  logo: string | null;
}

const defaultBranding: Branding = { bankName: 'Sterling Capital Bank', primaryColor: '#1e3a8a', logo: null };

// Fetched once per page session so loaders don't each refetch and pop the logo in late
let cachedBranding: Branding | null = null;
let brandingRequest: Promise<Branding> | null = null;

export function preloadLoadingLogo() {
  return loadBranding();
}

function loadBranding() {
  brandingRequest ??= fetch('/api/site-settings')
    .then(res => (res.ok ? res.json() : {}))
    .then((data: any) => {
      cachedBranding = {
        bankName: data.bankName || defaultBranding.bankName,
        primaryColor: data.primaryColor || defaultBranding.primaryColor,
        logo: data.logoUrl || data.faviconUrl || null,
      };
      return cachedBranding;
    })
    .catch(() => defaultBranding);
  return brandingRequest;
}

/**
 * Animated loading mark: a spinning ring around the bank's logo
 * (or its initial when no logo is set), with bouncing dots underneath.
 */
export default function LoadingLogo({ message, size = 72 }: { message?: string; size?: number }) {
  const [branding, setBranding] = useState<Branding>(cachedBranding || defaultBranding);

  useEffect(() => {
    if (cachedBranding) return;
    let active = true;
    loadBranding().then(b => { if (active) setBranding(b); });
    return () => { active = false; };
  }, []);

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
            <img src={logo} alt="" className="w-full h-full object-contain p-1.5" />
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
