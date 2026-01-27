import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { platformSettings } from '@/shared/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Fetch platform settings
    const platformSettingsData = await db
      .select()
      .from(platformSettings)
      .where(eq(platformSettings.key, 'platformSettings'));

    let settings = null;

    if (platformSettingsData.length > 0) {
      try {
        settings = JSON.parse(platformSettingsData[0].value);
      } catch (error) {
        console.error('Error parsing platform settings:', error);
      }
    }

    // Default settings if none configured
    if (!settings) {
      settings = {
        minDepositAmount: '3000',
        maintenanceMode: false,
        allowNewRegistrations: true,
        requireEmailVerification: false,
      };
    }

    return NextResponse.json({
      platformSettings: settings,
    });
  } catch (error: any) {
    console.error('Error loading platform settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load platform settings' },
      { status: 500 }
    );
  }
}
