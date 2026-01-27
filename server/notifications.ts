import { db } from './db';
import { notifications, pushSubscriptions } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import webpush from 'web-push';
import { pushEnv, validatePushConfig } from '@/lib/env';

// Initialize web-push with VAPID keys from shared environment loader
const validation = validatePushConfig();
if (validation.valid) {
  webpush.setVapidDetails(pushEnv.vapidEmail, pushEnv.vapidPublicKey, pushEnv.vapidPrivateKey);
  console.log('[Notifications] Web push configured successfully');
} else {
  console.warn('[Notifications] Web push not configured:', validation.error);
}

export interface NotificationData {
  userId: string;
  type: 'chat_message' | 'user_registration' | 'account_activity' | 'system_alert';
  title: string;
  message: string;
  data?: Record<string, any>;
}

/**
 * Create an in-app notification
 */
export async function createNotification(notificationData: NotificationData) {
  try {
    const notificationId = `notif-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const notification = await db.insert(notifications).values({
      id: notificationId,
      userId: notificationData.userId,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      data: notificationData.data ? JSON.stringify(notificationData.data) : null,
      isRead: false,
    }).returning();

    console.log(`[Notification] Created notification for user ${notificationData.userId}: ${notificationData.title}`);
    return notification[0];
  } catch (error) {
    console.error('[Notification] Error creating notification:', error);
    throw error;
  }
}

/**
 * Send browser push notification to a user
 */
export async function sendPushNotification(userId: string, payload: {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
}) {
  try {
    // Get all push subscriptions for this user
    const subscriptions = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    if (subscriptions.length === 0) {
      console.log(`[Push] No push subscriptions found for user ${userId}`);
      return;
    }

    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/logo.png',
      badge: payload.badge || '/logo.png',
      data: payload.data || {},
    });

    // Send push notification to all subscriptions
    const promises = subscriptions.map(async (subscription) => {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        };

        await webpush.sendNotification(pushSubscription, pushPayload);
        console.log(`[Push] Sent push notification to user ${userId}`);
      } catch (error: any) {
        console.error(`[Push] Error sending push notification:`, error);

        // If the subscription is invalid, remove it
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log(`[Push] Removing invalid subscription for user ${userId}`);
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, subscription.id));
        }
      }
    });

    await Promise.all(promises);
  } catch (error) {
    console.error('[Push] Error in sendPushNotification:', error);
    throw error;
  }
}

/**
 * Send complete notification (both in-app and push)
 */
export async function sendNotification(notificationData: NotificationData) {
  try {
    // Create in-app notification
    const notification = await createNotification(notificationData);

    // Send browser push notification if VAPID keys are configured
    const pushConfig = validatePushConfig();
    if (pushConfig.valid) {
      await sendPushNotification(notificationData.userId, {
        title: notificationData.title,
        body: notificationData.message,
        data: notificationData.data,
      });
    }

    return notification;
  } catch (error) {
    console.error('[Notification] Error sending notification:', error);
    throw error;
  }
}

/**
 * Send notification to multiple users
 */
export async function sendBulkNotification(userIds: string[], notificationData: Omit<NotificationData, 'userId'>) {
  try {
    const promises = userIds.map((userId) =>
      sendNotification({ ...notificationData, userId })
    );

    await Promise.all(promises);
    console.log(`[Notification] Sent bulk notification to ${userIds.length} users`);
  } catch (error) {
    console.error('[Notification] Error sending bulk notification:', error);
    throw error;
  }
}
