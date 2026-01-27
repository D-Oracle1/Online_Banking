'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { KeyRound, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import SupportChatbot from '@/components/SupportChatbot';

export default function Reset2FAPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/verify-2fa-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          twoFACode: resetCode.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset 2FA');
      }

      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset 2FA. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                2FA Reset Successful!
              </h1>
              <p className="text-gray-600 mb-6">
                Your two-factor authentication has been reset successfully. You can now set up 2FA again from your account settings.
              </p>
              <p className="text-sm text-gray-500">
                Redirecting to login page...
              </p>
            </div>
          </div>
        </div>
        <SupportChatbot />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Image
                src="/logo_1760007385.png"
                alt="Sterling Capital Bank Logo"
                width={200}
                height={80}
                priority
                className="object-contain"
              />
            </div>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <KeyRound className="w-8 h-8 text-blue-900" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset 2FA</h1>
            <p className="text-gray-600">
              Enter your email and the 2FA reset code provided by support
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent text-gray-900 placeholder-gray-400"
              />
            </div>

            <div>
              <label htmlFor="resetCode" className="block text-sm font-semibold text-gray-700 mb-2">
                2FA Reset Code
              </label>
              <input
                id="resetCode"
                type="text"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                maxLength={6}
                placeholder="Enter 6-digit code"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent text-gray-900 placeholder-gray-400 text-center text-2xl tracking-widest font-mono"
              />
              <p className="text-xs text-gray-500 mt-2">
                Contact support if you don't have a reset code
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !email || resetCode.length !== 6}
              className="w-full bg-blue-900 hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
            >
              {loading ? 'Resetting 2FA...' : 'Reset 2FA'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center text-sm text-blue-900 hover:text-blue-800 font-semibold"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Link>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">How to get a reset code:</h3>
            <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
              <li>Contact our support team via chat or email</li>
              <li>Verify your identity with our support staff</li>
              <li>Receive your unique 6-digit reset code</li>
              <li>Enter it here to reset your 2FA settings</li>
            </ol>
          </div>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>By using this service, you agree to our Terms of Service and Privacy Policy</p>
          </div>
        </div>

        <p className="text-white text-center mt-6 text-sm">
          © 2025 Sterling Capital Bank. All rights reserved.
        </p>
      </div>
      <SupportChatbot />
    </div>
  );
}
