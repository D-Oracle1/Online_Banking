'use client';

import { useState, useEffect } from 'react';
import { Shield, Key, CheckCircle, XCircle, Copy } from 'lucide-react';

export default function SecurityPage() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [currentToken, setCurrentToken] = useState('');
  const [newToken, setNewToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    checkTwoFactorStatus();
  }, []);

  const checkTwoFactorStatus = async () => {
    try {
      const response = await fetch('/api/user/2fa/status');
      const data = await response.json();

      if (response.ok) {
        setTwoFactorEnabled(data.enabled);
        setCurrentToken(data.token || '');
      }
    } catch (err) {
      console.error('Error checking 2FA status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/user/2fa/enable', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to enable 2FA');
      }

      setNewToken(data.token);
      setTwoFactorEnabled(true);
      setCurrentToken(data.token);
      setSuccess('2FA enabled successfully! Save your token securely.');
    } catch (err: any) {
      setError(err.message || 'Failed to enable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/user/2fa/disable', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to disable 2FA');
      }

      setTwoFactorEnabled(false);
      setCurrentToken('');
      setNewToken('');
      setSuccess('2FA disabled successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading && !twoFactorEnabled) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading security settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Security Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account security and two-factor authentication</p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
          <div className="flex items-start">
            <XCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
            <p className="text-green-800 text-sm">{success}</p>
          </div>
        </div>
      )}

      {/* 2FA Status Card */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start space-x-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              twoFactorEnabled ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              <Shield className={`w-6 h-6 ${twoFactorEnabled ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Two-Factor Authentication</h2>
              <p className="text-sm text-gray-600 mt-1">
                Add an extra layer of security to your account
              </p>
              <div className="mt-2">
                {twoFactorEnabled ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Enabled
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-800">
                    <XCircle className="w-4 h-4 mr-1" />
                    Disabled
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Current Token Display */}
        {twoFactorEnabled && currentToken && !newToken && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center">
                <Key className="w-5 h-5 text-blue-600 mr-2" />
                <h3 className="font-semibold text-blue-900">Your Current 2FA Token</h3>
              </div>
              <button
                onClick={() => copyToClipboard(currentToken)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition text-sm"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <div className="bg-white border-2 border-blue-300 rounded-lg p-4">
              <p className="text-3xl font-mono font-bold text-center text-blue-900 tracking-widest">
                {currentToken}
              </p>
            </div>
            <p className="text-xs text-blue-700 mt-2">
              Use this token when logging in to verify your identity
            </p>
          </div>
        )}

        {/* New Token Display */}
        {newToken && (
          <div className="mb-6 bg-green-50 border-2 border-green-300 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <Key className="w-5 h-5 text-green-600 mr-2" />
                <h3 className="font-semibold text-green-900">Your New 2FA Token</h3>
              </div>
              <button
                onClick={() => copyToClipboard(newToken)}
                className="flex items-center gap-2 text-green-600 hover:text-green-700 transition text-sm"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <div className="bg-white border-2 border-green-400 rounded-lg p-4 mb-3">
              <p className="text-3xl font-mono font-bold text-center text-green-900 tracking-widest">
                {newToken}
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3">
              <p className="text-sm text-yellow-800 font-semibold">
                ⚠️ IMPORTANT: Save this token securely! You'll need it every time you log in.
              </p>
            </div>
          </div>
        )}

        {/* What is 2FA */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">What is Two-Factor Authentication?</h3>
          <p className="text-sm text-gray-700 mb-3">
            Two-factor authentication (2FA) adds an extra layer of security to your account. When enabled,
            you'll need to enter your unique 6-digit token along with your password when logging in.
          </p>
          <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
            <li>Protects your account from unauthorized access</li>
            <li>Requires your unique token for every login</li>
            <li>Keep your token secure - don't share it with anyone</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!twoFactorEnabled ? (
            <button
              onClick={handleEnable2FA}
              disabled={loading}
              className="flex-1 bg-blue-900 hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center gap-2"
            >
              <Shield className="w-5 h-5" />
              {loading ? 'Enabling...' : 'Enable 2FA'}
            </button>
          ) : (
            <button
              onClick={handleDisable2FA}
              disabled={loading}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center gap-2"
            >
              <XCircle className="w-5 h-5" />
              {loading ? 'Disabling...' : 'Disable 2FA'}
            </button>
          )}
        </div>

        {/* Lost Token Notice */}
        {twoFactorEnabled && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Lost your 2FA token?</h4>
            <p className="text-xs text-blue-800 mb-2">
              If you've lost access to your 2FA token, you can reset it using an admin-provided code.
            </p>
            <a
              href="/reset-2fa"
              className="text-sm text-blue-900 hover:text-blue-700 font-semibold underline"
            >
              Reset 2FA with admin code →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
