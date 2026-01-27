import { NextResponse } from 'next/server';
import { pushEnv, validatePushConfig } from '@/lib/env';

export async function GET(request: Request) {
  try {
    console.log('[VAPID] Fetching VAPID public key...');
    console.log('[VAPID] Environment check:', {
      hasKey: !!pushEnv.vapidPublicKey,
      keyLength: pushEnv.vapidPublicKey.length,
      nodeEnv: process.env.NODE_ENV
    });

    // Validate configuration
    const validation = validatePushConfig();
    if (!validation.valid) {
      console.error('[VAPID] Validation failed:', validation.error);
      return NextResponse.json({
        error: 'Push notifications not configured',
        details: validation.error
      }, { status: 503 });
    }

    console.log('[VAPID] Public key found, returning to client');
    return NextResponse.json({ publicKey: pushEnv.vapidPublicKey });
  } catch (error) {
    console.error('[VAPID] Error fetching VAPID public key:', error);
    return NextResponse.json({
      error: 'Failed to fetch VAPID public key',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
