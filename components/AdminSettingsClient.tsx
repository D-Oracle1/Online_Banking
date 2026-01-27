'use client';

import { useState, useEffect } from 'react';
import { Save, Settings, DollarSign, Lock, Mail } from 'lucide-react';

export default function AdminSettingsClient() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Payment Method Settings
  const [paymentMethods, setPaymentMethods] = useState({
    btc: {
      enabled: true,
      address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    },
    eth: {
      enabled: true,
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
    },
    usdt: {
      enabled: true,
      address: 'TYDzsYUEpvnYmQk4zGP9JgUvXwKMdQTiW3',
      network: 'TRC20',
    },
    bank: {
      enabled: true,
      accountName: 'Sterling Capital Bank',
      accountNumber: '1234567890',
      routingNumber: '021000021',
      swiftCode: 'STERBUS33',
    },
    cashapp: {
      enabled: true,
      handle: '$SterlingCapital',
    },
    paypal: {
      enabled: true,
      email: 'payments@sterlingcapitalbank.com',
    },
  });

  // Platform Settings
  const [platformSettings, setplatformSettings] = useState({
    minDepositAmount: '3000',
    maintenanceMode: false,
    allowNewRegistrations: true,
    requireEmailVerification: false,
  });

  // Email Settings
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    fromEmail: 'noreply@sterlingcapitalbank.com',
    fromName: 'Sterling Capital Bank',
  });

  // Load settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings/load');
        if (response.ok) {
          const data = await response.json();
          if (data.settings.paymentMethods) {
            setPaymentMethods(data.settings.paymentMethods);
          }
          if (data.settings.platformSettings) {
            setplatformSettings(data.settings.platformSettings);
          }
          if (data.settings.emailSettings) {
            setEmailSettings(data.settings.emailSettings);
          }
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSavePaymentMethods = async () => {
    setIsProcessing(true);
    try {
      // Add name and icon fields for display
      const paymentMethodsWithMetadata = {
        btc: {
          ...paymentMethods.btc,
          name: 'Bitcoin (BTC)',
          icon: '₿',
        },
        eth: {
          ...paymentMethods.eth,
          name: 'Ethereum (ETH)',
          icon: 'Ξ',
        },
        usdt: {
          ...paymentMethods.usdt,
          name: 'Tether (USDT)',
          icon: '₮',
        },
        bank: {
          ...paymentMethods.bank,
          name: 'Bank Transfer',
          icon: '🏦',
        },
        cashapp: {
          ...paymentMethods.cashapp,
          name: 'Cash App',
          icon: '$',
        },
        paypal: {
          ...paymentMethods.paypal,
          name: 'PayPal',
          icon: 'P',
        },
      };

      const response = await fetch('/api/admin/settings/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: { paymentMethods: paymentMethodsWithMetadata },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      alert('Payment method settings saved successfully!');
    } catch (error) {
      alert('Failed to save payment settings');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSavePlatformSettings = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/settings/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: { platformSettings },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      alert('Platform settings saved successfully!');
    } catch (error) {
      alert('Failed to save platform settings');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveEmailSettings = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/settings/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: { emailSettings },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      alert('Email settings saved successfully!');
    } catch (error) {
      alert('Failed to save email settings');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-900 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Methods */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200">
        <div className="bg-blue-900 text-white p-6 rounded-t-xl flex items-center">
          <DollarSign className="w-6 h-6 mr-2" />
          <h2 className="text-xl font-bold">Payment Methods Configuration</h2>
        </div>
        <div className="p-6 space-y-6">
          {/* Bitcoin */}
          <div className="border-b pb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Bitcoin (BTC)</h3>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={paymentMethods.btc.enabled}
                  onChange={(e) =>
                    setPaymentMethods({
                      ...paymentMethods,
                      btc: { ...paymentMethods.btc, enabled: e.target.checked },
                    })
                  }
                  className="w-4 h-4 text-blue-900 rounded focus:ring-2 focus:ring-blue-900"
                />
                <span className="ml-2 text-sm text-gray-700">Enabled</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wallet Address
              </label>
              <input
                type="text"
                value={paymentMethods.btc.address}
                onChange={(e) =>
                  setPaymentMethods({
                    ...paymentMethods,
                    btc: { ...paymentMethods.btc, address: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm"
              />
            </div>
          </div>

          {/* Ethereum */}
          <div className="border-b pb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Ethereum (ETH)</h3>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={paymentMethods.eth.enabled}
                  onChange={(e) =>
                    setPaymentMethods({
                      ...paymentMethods,
                      eth: { ...paymentMethods.eth, enabled: e.target.checked },
                    })
                  }
                  className="w-4 h-4 text-blue-900 rounded focus:ring-2 focus:ring-blue-900"
                />
                <span className="ml-2 text-sm text-gray-700">Enabled</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wallet Address
              </label>
              <input
                type="text"
                value={paymentMethods.eth.address}
                onChange={(e) =>
                  setPaymentMethods({
                    ...paymentMethods,
                    eth: { ...paymentMethods.eth, address: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm"
              />
            </div>
          </div>

          {/* USDT */}
          <div className="border-b pb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Tether (USDT)</h3>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={paymentMethods.usdt.enabled}
                  onChange={(e) =>
                    setPaymentMethods({
                      ...paymentMethods,
                      usdt: { ...paymentMethods.usdt, enabled: e.target.checked },
                    })
                  }
                  className="w-4 h-4 text-blue-900 rounded focus:ring-2 focus:ring-blue-900"
                />
                <span className="ml-2 text-sm text-gray-700">Enabled</span>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wallet Address
                </label>
                <input
                  type="text"
                  value={paymentMethods.usdt.address}
                  onChange={(e) =>
                    setPaymentMethods({
                      ...paymentMethods,
                      usdt: { ...paymentMethods.usdt, address: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Network</label>
                <select
                  value={paymentMethods.usdt.network}
                  onChange={(e) =>
                    setPaymentMethods({
                      ...paymentMethods,
                      usdt: { ...paymentMethods.usdt, network: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="TRC20">TRC20</option>
                  <option value="ERC20">ERC20</option>
                  <option value="BEP20">BEP20</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bank Transfer */}
          <div className="border-b pb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Bank Transfer</h3>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={paymentMethods.bank.enabled}
                  onChange={(e) =>
                    setPaymentMethods({
                      ...paymentMethods,
                      bank: { ...paymentMethods.bank, enabled: e.target.checked },
                    })
                  }
                  className="w-4 h-4 text-blue-900 rounded focus:ring-2 focus:ring-blue-900"
                />
                <span className="ml-2 text-sm text-gray-700">Enabled</span>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  value={paymentMethods.bank.accountName}
                  onChange={(e) =>
                    setPaymentMethods({
                      ...paymentMethods,
                      bank: { ...paymentMethods.bank, accountName: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  value={paymentMethods.bank.accountNumber}
                  onChange={(e) =>
                    setPaymentMethods({
                      ...paymentMethods,
                      bank: { ...paymentMethods.bank, accountNumber: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Routing Number
                </label>
                <input
                  type="text"
                  value={paymentMethods.bank.routingNumber}
                  onChange={(e) =>
                    setPaymentMethods({
                      ...paymentMethods,
                      bank: { ...paymentMethods.bank, routingNumber: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SWIFT Code
                </label>
                <input
                  type="text"
                  value={paymentMethods.bank.swiftCode}
                  onChange={(e) =>
                    setPaymentMethods({
                      ...paymentMethods,
                      bank: { ...paymentMethods.bank, swiftCode: e.target.value },
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono"
                />
              </div>
            </div>
          </div>

          {/* Cash App */}
          <div className="border-b pb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Cash App</h3>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={paymentMethods.cashapp.enabled}
                  onChange={(e) =>
                    setPaymentMethods({
                      ...paymentMethods,
                      cashapp: { ...paymentMethods.cashapp, enabled: e.target.checked },
                    })
                  }
                  className="w-4 h-4 text-blue-900 rounded focus:ring-2 focus:ring-blue-900"
                />
                <span className="ml-2 text-sm text-gray-700">Enabled</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cashtag</label>
              <input
                type="text"
                value={paymentMethods.cashapp.handle}
                onChange={(e) =>
                  setPaymentMethods({
                    ...paymentMethods,
                    cashapp: { ...paymentMethods.cashapp, handle: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          {/* PayPal */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">PayPal</h3>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={paymentMethods.paypal.enabled}
                  onChange={(e) =>
                    setPaymentMethods({
                      ...paymentMethods,
                      paypal: { ...paymentMethods.paypal, enabled: e.target.checked },
                    })
                  }
                  className="w-4 h-4 text-blue-900 rounded focus:ring-2 focus:ring-blue-900"
                />
                <span className="ml-2 text-sm text-gray-700">Enabled</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PayPal Email</label>
              <input
                type="email"
                value={paymentMethods.paypal.email}
                onChange={(e) =>
                  setPaymentMethods({
                    ...paymentMethods,
                    paypal: { ...paymentMethods.paypal, email: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <button
            onClick={handleSavePaymentMethods}
            disabled={isProcessing}
            className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <Save className="w-5 h-5" />
            <span>{isProcessing ? 'Saving...' : 'Save Payment Methods'}</span>
          </button>
        </div>
      </div>

      {/* Platform Settings */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200">
        <div className="bg-blue-900 text-white p-6 rounded-t-xl flex items-center">
          <Settings className="w-6 h-6 mr-2" />
          <h2 className="text-xl font-bold">Platform Settings</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Deposit Amount ($)
            </label>
            <input
              type="number"
              value={platformSettings.minDepositAmount}
              onChange={(e) =>
                setplatformSettings({ ...platformSettings, minDepositAmount: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <h3 className="font-semibold">Maintenance Mode</h3>
              <p className="text-sm text-gray-600">
                When enabled, only admins can access the platform
              </p>
            </div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={platformSettings.maintenanceMode}
                onChange={(e) =>
                  setplatformSettings({ ...platformSettings, maintenanceMode: e.target.checked })
                }
                className="w-4 h-4 text-blue-900 rounded focus:ring-2 focus:ring-blue-900"
              />
              <span className="ml-2 text-sm text-gray-700">Enabled</span>
            </label>
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <h3 className="font-semibold">Allow New Registrations</h3>
              <p className="text-sm text-gray-600">Allow new users to create accounts</p>
            </div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={platformSettings.allowNewRegistrations}
                onChange={(e) =>
                  setplatformSettings({
                    ...platformSettings,
                    allowNewRegistrations: e.target.checked,
                  })
                }
                className="w-4 h-4 text-blue-900 rounded focus:ring-2 focus:ring-blue-900"
              />
              <span className="ml-2 text-sm text-gray-700">Enabled</span>
            </label>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <h3 className="font-semibold">Require Email Verification</h3>
              <p className="text-sm text-gray-600">Users must verify email before login</p>
            </div>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={platformSettings.requireEmailVerification}
                onChange={(e) =>
                  setplatformSettings({
                    ...platformSettings,
                    requireEmailVerification: e.target.checked,
                  })
                }
                className="w-4 h-4 text-blue-900 rounded focus:ring-2 focus:ring-blue-900"
              />
              <span className="ml-2 text-sm text-gray-700">Enabled</span>
            </label>
          </div>

          <button
            onClick={handleSavePlatformSettings}
            disabled={isProcessing}
            className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <Save className="w-5 h-5" />
            <span>{isProcessing ? 'Saving...' : 'Save Platform Settings'}</span>
          </button>
        </div>
      </div>

      {/* Email Settings */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200">
        <div className="bg-blue-900 text-white p-6 rounded-t-xl flex items-center">
          <Mail className="w-6 h-6 mr-2" />
          <h2 className="text-xl font-bold">Email Configuration</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Host</label>
              <input
                type="text"
                value={emailSettings.smtpHost}
                onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Port</label>
              <input
                type="text"
                value={emailSettings.smtpPort}
                onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Username</label>
              <input
                type="text"
                value={emailSettings.smtpUser}
                onChange={(e) => setEmailSettings({ ...emailSettings, smtpUser: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SMTP Password</label>
              <input
                type="password"
                value={emailSettings.smtpPassword}
                onChange={(e) =>
                  setEmailSettings({ ...emailSettings, smtpPassword: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Email</label>
              <input
                type="email"
                value={emailSettings.fromEmail}
                onChange={(e) => setEmailSettings({ ...emailSettings, fromEmail: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Name</label>
              <input
                type="text"
                value={emailSettings.fromName}
                onChange={(e) => setEmailSettings({ ...emailSettings, fromName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <button
            onClick={handleSaveEmailSettings}
            disabled={isProcessing}
            className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <Save className="w-5 h-5" />
            <span>{isProcessing ? 'Saving...' : 'Save Email Settings'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
