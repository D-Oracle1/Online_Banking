'use client';

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { subscribeToPushNotifications, isPushSubscribed } from '@/lib/push-notifications';

export default function PushNotificationPrompt() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    const subscribed = await isPushSubscribed();
    setIsSubscribed(subscribed);

    // Show prompt if not subscribed and not dismissed
    const dismissed = localStorage.getItem('push-notification-prompt-dismissed');
    if (!subscribed && !dismissed) {
      setTimeout(() => setShowPrompt(true), 3000); // Show after 3 seconds
    }
  };

  const handleEnable = async () => {
    setIsLoading(true);
    try {
      const result = await subscribeToPushNotifications();
      if (result.success) {
        setIsSubscribed(true);
        setShowPrompt(false);
        alert('✅ Push notifications enabled successfully! You will now receive real-time updates.');
      } else {
        const errorMessage = result.error || 'Failed to enable push notifications. Please check your browser settings.';
        alert('❌ ' + errorMessage);
        console.error('[PushPrompt] Subscription failed:', result.error);
      }
    } catch (error) {
      console.error('Error enabling push notifications:', error);
      alert('❌ An unexpected error occurred while enabling push notifications.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('push-notification-prompt-dismissed', 'true');
  };

  if (isSubscribed || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-white rounded-lg shadow-xl border border-gray-200 p-4 animate-slide-up">
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        title="Dismiss"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <Bell className="w-6 h-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            Enable Push Notifications
          </h3>
          <p className="text-xs text-gray-600 mb-3">
            Stay updated with real-time notifications about your account activity, messages, and more.
          </p>
          <button
            onClick={handleEnable}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isLoading ? 'Enabling...' : 'Enable Notifications'}
          </button>
        </div>
      </div>
    </div>
  );
}
