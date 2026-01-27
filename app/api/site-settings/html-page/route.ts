import { NextResponse } from 'next/server';
import { getHtmlPageSettings } from '@/lib/site-settings';

// Default fallback settings for HTML pages
const defaultHtmlSettings = {
  bankName: 'Online Banking',
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
};

/**
 * GET /api/site-settings/html-page
 * Returns only the settings needed for static HTML pages
 * Optimized for client-side dynamic content replacement
 */
export async function GET() {
  try {
    const settings = await getHtmlPageSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching HTML page settings:', error);
    return NextResponse.json(defaultHtmlSettings, { status: 200 });
  }
}
