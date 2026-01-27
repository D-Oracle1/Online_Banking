// Shared environment variable loader
// This ensures .env file is loaded consistently across all parts of the application
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file explicitly
// This is done once when this module is first imported
let loaded = false;

export function loadEnv() {
  if (!loaded) {
    config({ path: resolve(process.cwd(), '.env'), override: true });
    loaded = true;
    console.log('[Env] Environment variables loaded from .env file');
  }
}

// Auto-load on import
loadEnv();

// Export typed environment variables for push notifications
export const pushEnv = {
  get vapidPublicKey() {
    return process.env.VAPID_PUBLIC_KEY || '';
  },
  get vapidPrivateKey() {
    return process.env.VAPID_PRIVATE_KEY || '';
  },
  get vapidEmail() {
    return process.env.VAPID_EMAIL || 'mailto:admin@example.com';
  },
};

// Validate push notification configuration
export function validatePushConfig(): { valid: boolean; error?: string } {
  if (!pushEnv.vapidPublicKey) {
    return { valid: false, error: 'VAPID_PUBLIC_KEY is missing' };
  }
  if (!pushEnv.vapidPrivateKey) {
    return { valid: false, error: 'VAPID_PRIVATE_KEY is missing' };
  }
  return { valid: true };
}
