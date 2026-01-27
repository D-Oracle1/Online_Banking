'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import Link from 'next/link';

interface Notifications {
  pendingDeposits: number;
  pendingLoans: number;
  unreadMessages: number;
  total: number;
}

export default function AdminNotificationBadge() {
  const [notifications, setNotifications] = useState<Notifications>({
    pendingDeposits: 0,
    pendingLoans: 0,
    unreadMessages: 0,
    total: 0,
  });
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 5 seconds (reduced from 30s to minimize false alerts)
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/admin/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6" />
        {notifications.total > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {notifications.total > 9 ? '9+' : notifications.total}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          ></div>

          {/* Dropdown Content */}
          <div className="absolute right-0 mt-2 w-[calc(100vw-1rem)] max-w-sm md:w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-20 overflow-hidden">
            <div className="bg-blue-900 text-white px-3 py-2.5 md:px-4 md:py-3">
              <h3 className="font-semibold text-sm md:text-base">Notifications</h3>
              <p className="text-xs text-blue-200">
                {notifications.total} pending item{notifications.total !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="divide-y divide-gray-200 max-h-[60vh] md:max-h-96 overflow-y-auto">
              {notifications.pendingDeposits > 0 && (
                <Link
                  href="/admin/deposits"
                  onClick={() => setShowDropdown(false)}
                  className="block px-3 py-2.5 md:px-4 md:py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 md:gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-sm">Pending Deposits</p>
                      <p className="text-xs text-gray-600 line-clamp-1">
                        {notifications.pendingDeposits} deposit{notifications.pendingDeposits !== 1 ? 's' : ''} awaiting approval
                      </p>
                    </div>
                    <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-0.5 md:px-2.5 md:py-1 rounded-full flex-shrink-0">
                      {notifications.pendingDeposits}
                    </span>
                  </div>
                </Link>
              )}

              {notifications.pendingLoans > 0 && (
                <Link
                  href="/admin/loans"
                  onClick={() => setShowDropdown(false)}
                  className="block px-3 py-2.5 md:px-4 md:py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 md:gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-sm">Pending Loans</p>
                      <p className="text-xs text-gray-600 line-clamp-1">
                        {notifications.pendingLoans} loan application{notifications.pendingLoans !== 1 ? 's' : ''} to review
                      </p>
                    </div>
                    <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2 py-0.5 md:px-2.5 md:py-1 rounded-full flex-shrink-0">
                      {notifications.pendingLoans}
                    </span>
                  </div>
                </Link>
              )}

              {notifications.unreadMessages > 0 && (
                <Link
                  href="/admin/messages"
                  onClick={() => setShowDropdown(false)}
                  className="block px-3 py-2.5 md:px-4 md:py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 md:gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 text-sm">Unread Messages</p>
                      <p className="text-xs text-gray-600 line-clamp-1">
                        {notifications.unreadMessages} new message{notifications.unreadMessages !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 md:px-2.5 md:py-1 rounded-full flex-shrink-0">
                      {notifications.unreadMessages}
                    </span>
                  </div>
                </Link>
              )}

              {notifications.total === 0 && (
                <div className="px-3 py-6 md:px-4 text-center">
                  <Bell className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No pending notifications</p>
                  <p className="text-gray-400 text-xs mt-1">You're all caught up!</p>
                </div>
              )}
            </div>

            {notifications.total > 0 && (
              <div className="bg-gray-50 px-3 py-2 md:px-4 text-center border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    fetchNotifications();
                  }}
                  className="text-xs text-blue-900 hover:text-blue-700 font-medium active:text-blue-800"
                >
                  Refresh Notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
