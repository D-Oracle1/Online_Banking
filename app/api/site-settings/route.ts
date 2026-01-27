import { NextResponse } from 'next/server';
import { getSiteSettings } from '@/lib/site-settings';

// Default fallback settings (centralized)
const defaultFallback = {
  bankName: 'Online Banking',
  primaryColor: '#1e3a8a',
  secondaryColor: '#10b981',
};

export async function GET() {
  try {
    const settings = await getSiteSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return NextResponse.json(defaultFallback, { status: 200 });
  }
}
