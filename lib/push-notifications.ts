// Utility functions for managing browser push notifications

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('[Push] Service workers are not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('[Push] Service worker registered successfully');
    return registration;
  } catch (error) {
    console.error('[Push] Service worker registration failed:', error);
    return null;
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('[Push] Notifications are not supported');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission;
  }

  return Notification.permission;
}

export async function subscribeToPushNotifications(): Promise<{success: boolean; error?: string}> {
  try {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      const error = 'Your browser does not support notifications';
      console.error('[Push]', error);
      return { success: false, error };
    }

    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      const error = 'Your browser does not support service workers';
      console.error('[Push]', error);
      return { success: false, error };
    }

    // Check if push manager is supported
    if (!('PushManager' in window)) {
      const error = 'Your browser does not support push notifications';
      console.error('[Push]', error);
      return { success: false, error };
    }

    // Request notification permission
    const permission = await requestNotificationPermission();

    if (permission !== 'granted') {
      const error = permission === 'denied'
        ? 'Notification permission was denied. Please enable notifications in your browser settings.'
        : 'Notification permission was not granted';
      console.warn('[Push]', error);
      return { success: false, error };
    }

    // Register service worker
    const registration = await registerServiceWorker();

    if (!registration) {
      const error = 'Failed to register service worker. Please make sure your browser allows service workers.';
      console.error('[Push]', error);
      return { success: false, error };
    }

    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;
    console.log('[Push] Service worker is ready');

    // Get VAPID public key
    const response = await fetch('/api/push/vapid-public-key');
    if (!response.ok) {
      let error = 'Failed to fetch configuration from server';
      try {
        const errorData = await response.json();
        console.error('[Push] Server error:', errorData);
        if (errorData.details) {
          error = `${error}: ${errorData.details}`;
        }
      } catch (e) {
        console.error('[Push] Could not parse error response');
      }
      console.error('[Push]', error, 'Status:', response.status);

      // Provide helpful message for 503 (service unavailable)
      if (response.status === 503) {
        error = 'Push notifications are not configured on the server. Please restart the application.';
      }

      return { success: false, error };
    }

    const data = await response.json();
    if (!data.publicKey) {
      const error = 'Server configuration is incomplete. The VAPID public key is missing.';
      console.error('[Push]', error, 'Response:', data);
      return { success: false, error };
    }

    const { publicKey } = data;
    console.log('[Push] VAPID public key received');

    // Convert VAPID public key to Uint8Array
    const convertedKey = urlBase64ToUint8Array(publicKey);

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey as BufferSource,
    });

    console.log('[Push] Push subscription successful');

    // Send subscription to server
    const subscribeResponse = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription }),
    });

    if (!subscribeResponse.ok) {
      const error = 'Failed to save subscription to server';
      console.error('[Push]', error, 'Status:', subscribeResponse.status);
      return { success: false, error };
    }

    console.log('[Push] Subscription sent to server successfully');
    return { success: true };
  } catch (error: any) {
    console.error('[Push] Error subscribing to push notifications:', error);
    let errorMessage = 'An unexpected error occurred';

    if (error.name === 'NotAllowedError') {
      errorMessage = 'Notification permission was denied. Please check your browser settings.';
    } else if (error.name === 'NotSupportedError') {
      errorMessage = 'Push notifications are not supported in this browser.';
    } else if (error.name === 'AbortError') {
      errorMessage = 'Subscription was aborted. Please try again.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return { success: false, error: errorMessage };
  }
}

export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.getRegistration();

    if (!registration) {
      console.warn('[Push] No service worker registration found');
      return false;
    }

    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      console.warn('[Push] No push subscription found');
      return false;
    }

    // Unsubscribe from push notifications
    await subscription.unsubscribe();
    console.log('[Push] Unsubscribed from push notifications');

    // Notify server
    await fetch('/api/push/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });

    return true;
  } catch (error) {
    console.error('[Push] Error unsubscribing from push notifications:', error);
    return false;
  }
}

export async function isPushSubscribed(): Promise<boolean> {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return false;
    }

    const registration = await navigator.serviceWorker.getRegistration();

    if (!registration) {
      return false;
    }

    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch (error) {
    console.error('[Push] Error checking push subscription status:', error);
    return false;
  }
}

// Helper function to convert VAPID public key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}
