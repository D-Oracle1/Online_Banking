'use client';

import { useState } from 'react';
import Image from 'next/image';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function CreateAdminPage() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const createAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus('Creating admin account...');
    setTwoFactorToken('');
    setAccountNumber('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setStatus('❌ ERROR: Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setStatus('❌ ERROR: Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/signup-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          username: formData.username,
          email: formData.email,
          password: formData.password,
        })
      });

      const data = await response.json();

      if (response.ok) {
        setTwoFactorToken(data.twoFactorToken);
        setAccountNumber(data.accountNumber);
        setStatus(`✅ SUCCESS! Admin account created!`);
      } else {
        setStatus(`❌ ERROR: ${data.error}`);
      }
    } catch (error: any) {
      setStatus(`❌ Failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Admin Account</h1>
          <p className="text-gray-600">Setup your administrative access</p>
        </div>

        {!status.includes('SUCCESS') ? (
          <form onSubmit={createAdmin} className="space-y-6">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="admin"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="admin@sterlingcapitalbank.org"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Min. 8 characters"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Confirm password"
                />
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800 font-semibold">
                ⚠️ Security Notice
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                After creating your admin account, make sure to disable the admin signup endpoint by setting ALLOW_ADMIN_SIGNUP to false in the API route for security.
              </p>
            </div>

            {status && !status.includes('SUCCESS') && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {status}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Admin Account...' : 'Create Admin Account'}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Account Created Successfully!</h2>
              <p className="text-gray-600">Please save your login credentials securely</p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-300 rounded-lg p-6 space-y-4">
              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">Email:</p>
                <p className="text-lg font-mono text-gray-900">{formData.email}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">Username:</p>
                <p className="text-lg font-mono text-gray-900">{formData.username}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-blue-900 mb-1">Account Number:</p>
                <p className="text-lg font-mono text-gray-900">{accountNumber}</p>
              </div>

              <div className="border-t-2 border-blue-300 pt-4">
                <p className="text-sm font-semibold text-blue-900 mb-2">Your 2FA Token:</p>
                <div className="bg-white border-2 border-blue-500 rounded-lg p-4 mb-3">
                  <p className="text-4xl font-mono font-bold text-center text-blue-900 tracking-widest">
                    {twoFactorToken}
                  </p>
                </div>
                <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 mb-3">
                  <p className="text-xs text-yellow-800 font-semibold">
                    ⚠️ CRITICAL: Save this 2FA token securely! You will need it every time you log in. This is the only time it will be displayed.
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(twoFactorToken);
                    alert('2FA token copied to clipboard!');
                  }}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
                >
                  Copy 2FA Token
                </button>
              </div>
            </div>

            <a
              href="/login"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-lg text-center transition-colors"
            >
              Go to Login Page
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
