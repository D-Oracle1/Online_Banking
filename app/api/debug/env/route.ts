import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET(request: Request) {
  try {
    // Only allow authenticated admins to access this endpoint
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check environment variables from different sources
    const envCheck = {
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,

      // Check process.env directly
      processEnv: {
        hasVapidPublic: !!process.env.VAPID_PUBLIC_KEY,
        vapidPublicLength: process.env.VAPID_PUBLIC_KEY?.length || 0,
        vapidPublicPreview: process.env.VAPID_PUBLIC_KEY?.substring(0, 10) + '...',
        hasVapidPrivate: !!process.env.VAPID_PRIVATE_KEY,
        vapidPrivateLength: process.env.VAPID_PRIVATE_KEY?.length || 0,
        hasVapidEmail: !!process.env.VAPID_EMAIL,
        vapidEmail: process.env.VAPID_EMAIL,
      },

      // Try dynamic import
      allEnvKeys: Object.keys(process.env).filter(key => key.includes('VAPID')),
    };

    return NextResponse.json(envCheck);
  } catch (error) {
    console.error('[Debug] Error checking environment:', error);
    return NextResponse.json({
      error: 'Failed to check environment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
