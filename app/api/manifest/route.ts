import { NextResponse } from 'next/server';
import { getSiteSettings } from '@/lib/site-settings';

export async function GET() {
  const settings = await getSiteSettings();

  const manifest = {
    name: settings.bankName,
    short_name: settings.bankName.split(' ').slice(0, 2).join(' '),
    description: `Manage your funds, apply for loans, and track your financial growth with ${settings.bankName}.`,
    start_url: '/',
    id: '/',
    display: 'standalone',
    display_override: ['standalone', 'fullscreen'],
    background_color: '#ffffff',
    theme_color: settings.primaryColor,
    orientation: 'portrait-primary',
    icons: [
      {
        src: settings.appIconUrl || '/icon-72.png',
        sizes: '72x72',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: settings.appIconUrl || '/icon-96.png',
        sizes: '96x96',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: settings.appIconUrl || '/icon-128.png',
        sizes: '128x128',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: settings.appIconUrl || '/icon-144.png',
        sizes: '144x144',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: settings.appIconUrl || '/icon-152.png',
        sizes: '152x152',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: settings.appIconUrl || '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: settings.appIconUrl || '/icon-384.png',
        sizes: '384x384',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: settings.appIconUrl || '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: settings.appIconUrl || '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: settings.appIconUrl || '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
    categories: ['finance', 'business'],
    screenshots: [],
    shortcuts: [
      {
        name: 'Dashboard',
        short_name: 'Dashboard',
        description: 'View your account dashboard',
        url: '/dashboard',
        icons: [{ src: settings.appIconUrl || '/icon-192.png', sizes: '192x192' }]
      },
      {
        name: 'Transfers',
        short_name: 'Transfer',
        description: 'Make a transfer',
        url: '/dashboard/transfer',
        icons: [{ src: settings.appIconUrl || '/icon-192.png', sizes: '192x192' }]
      }
    ],
    scope: '/',
    lang: 'en-US',
    dir: 'ltr',
    prefer_related_applications: false
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
}
