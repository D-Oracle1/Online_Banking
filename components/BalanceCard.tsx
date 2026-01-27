'use client';

import { useState, useEffect, useCallback } from 'react';
import { Eye, EyeOff, RefreshCw, DollarSign, Send, Lock, CreditCard } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const THEME_BROADCAST_CHANNEL = 'theme-sync-channel';
const THEME_STORAGE_KEY = 'theme-update-event';

interface BalanceCardProps {
  balance: string;
  accountNumber: string;
  accountType: string;
}

export default function BalanceCard({ balance, accountNumber, accountType }: BalanceCardProps) {
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [primaryColor, setPrimaryColor] = useState('#1e3a8a');
  const [bankName, setBankName] = useState('Sterling Capital Bank');
  const router = useRouter();

  // Fetch site settings
  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/site-settings');
      if (response.ok) {
        const data = await response.json();
        setPrimaryColor(data.primaryColor || '#1e3a8a');
        setBankName(data.bankName || 'Sterling Capital Bank');
      }
    } catch (error) {
      console.error('Error fetching site settings:', error);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Listen for theme changes
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(THEME_BROADCAST_CHANNEL);
      channel.onmessage = (event) => {
        if (event.data?.type === 'THEME_UPDATE' && event.data?.theme?.primaryColor) {
          setPrimaryColor(event.data.theme.primaryColor);
        }
        if (event.data?.type === 'SETTINGS_UPDATED') {
          fetchSettings();
        }
      };
    } catch (e) {
      // BroadcastChannel not supported
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY && event.newValue) {
        try {
          const data = JSON.parse(event.newValue);
          if (data.theme?.primaryColor) {
            setPrimaryColor(data.theme.primaryColor);
          }
        } catch (e) {
          console.warn('Could not parse theme update:', e);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    const handleThemeChange = (event: CustomEvent) => {
      if (event.detail?.primaryColor) {
        setPrimaryColor(event.detail.primaryColor);
      }
    };

    window.addEventListener('themechange' as any, handleThemeChange);

    const handleSettingsUpdate = () => {
      fetchSettings();
    };
    window.addEventListener('settingsUpdated', handleSettingsUpdate);

    return () => {
      channel?.close();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('themechange' as any, handleThemeChange);
      window.removeEventListener('settingsUpdated', handleSettingsUpdate);
    };
  }, [fetchSettings]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Refresh the page data
    router.refresh();
    // Reset animation after a delay
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Compute gradient colors based on primary color
  const gradientStyle = {
    background: `linear-gradient(to bottom right, ${primaryColor}, color-mix(in srgb, ${primaryColor} 85%, black), ${primaryColor})`,
  };

  return (
    <div className="rounded-2xl p-4 md:p-8 text-white shadow-xl" style={gradientStyle}>
      <div className="mb-4 md:mb-6">
        <p className="text-xs md:text-sm mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
          {bankName.toUpperCase()} - {accountType || 'Basic Savings'}
        </p>
        <p className="text-xs md:text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>Acct No: {accountNumber || 'N/A'}</p>
      </div>

      <div className="mb-6 md:mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-3xl md:text-5xl font-bold">
            {isBalanceVisible ? formatCurrency(balance || '0') : '••••••'}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBalanceVisible(!isBalanceVisible)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title={isBalanceVisible ? 'Hide balance' : 'Show balance'}
            >
              {isBalanceVisible ? (
                <EyeOff className="w-5 h-5 md:w-6 md:h-6" />
              ) : (
                <Eye className="w-5 h-5 md:w-6 md:h-6" />
              )}
            </button>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
              title="Refresh balance"
            >
              <RefreshCw
                className={`w-5 h-5 md:w-6 md:h-6 ${isRefreshing ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
        </div>
        <p className="text-sm md:text-base" style={{ color: 'rgba(255,255,255,0.7)' }}>Available Balance</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Link
          href="/dashboard/deposit"
          className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg p-3 md:p-4 text-center transition-colors"
        >
          <DollarSign className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-1 md:mb-2" />
          <p className="text-xs md:text-sm font-medium">Deposit</p>
        </Link>

        <Link
          href="/dashboard/transfer"
          className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg p-3 md:p-4 text-center transition-colors"
        >
          <Send className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-1 md:mb-2" />
          <p className="text-xs md:text-sm font-medium">Transfer</p>
        </Link>

        <Link
          href="/dashboard/transaction-pin"
          className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg p-3 md:p-4 text-center transition-colors"
        >
          <Lock className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-1 md:mb-2" />
          <p className="text-xs md:text-sm font-medium">Set PIN</p>
        </Link>

        <Link
          href="/dashboard/debit-card"
          className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg p-3 md:p-4 text-center transition-colors"
        >
          <CreditCard className="w-5 h-5 md:w-6 md:h-6 mx-auto mb-1 md:mb-2" />
          <p className="text-xs md:text-sm font-medium">Debit Card</p>
        </Link>
      </div>
    </div>
  );
}
