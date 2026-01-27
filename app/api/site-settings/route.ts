import { NextResponse } from 'next/server';
import { getSiteSettings } from '@/lib/site-settings';

export async function GET() {
  try {
    const settings = await getSiteSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return NextResponse.json(
      {
        bankName: 'Sterling Capital Bank',
        primaryColor: '#1e3a8a',
        secondaryColor: '#10b981',
      },
      { status: 200 }
    );
  }
}
