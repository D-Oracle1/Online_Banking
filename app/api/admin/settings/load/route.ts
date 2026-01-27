import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { db } from '@/server/db';
import { platformSettings } from '@/shared/schema';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();

    if (session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Fetch all settings
    const allSettings = await db.select().from(platformSettings);

    // Convert array of settings to object
    const settingsObject: Record<string, any> = {};
    allSettings.forEach((setting) => {
      try {
        settingsObject[setting.key] = JSON.parse(setting.value);
      } catch (error) {
        console.error(`Error parsing setting ${setting.key}:`, error);
        settingsObject[setting.key] = setting.value;
      }
    });

    return NextResponse.json({
      settings: settingsObject,
    });
  } catch (error: any) {
    console.error('Error loading settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load settings' },
      { status: 500 }
    );
  }
}
