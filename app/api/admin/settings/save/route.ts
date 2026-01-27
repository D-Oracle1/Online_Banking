import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { db } from '@/server/db';
import { platformSettings } from '@/shared/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();

    if (session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { settings } = await request.json();

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: 'Settings object is required' },
        { status: 400 }
      );
    }

    // Convert settings object to key-value pairs
    const settingsArray = Object.entries(settings).map(([key, value]) => ({
      key,
      value: JSON.stringify(value),
    }));

    // Upsert each setting
    for (const setting of settingsArray) {
      const existingSetting = await db
        .select()
        .from(platformSettings)
        .where(eq(platformSettings.key, setting.key))
        .limit(1);

      if (existingSetting.length > 0) {
        // Update existing setting
        await db
          .update(platformSettings)
          .set({
            value: setting.value,
            updatedAt: new Date(),
          })
          .where(eq(platformSettings.key, setting.key));
      } else {
        // Insert new setting
        await db.insert(platformSettings).values({
          id: `setting-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          key: setting.key,
          value: setting.value,
          updatedAt: new Date(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully',
    });
  } catch (error: any) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save settings' },
      { status: 500 }
    );
  }
}
