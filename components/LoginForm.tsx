'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface LoginFormProps {
  bankName?: string;
}

export default function LoginForm({ bankName = 'Sterling Capital Bank' }: LoginFormProps) {
  const router = useRouter();
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generatedToken, setGeneratedToken] = useState('');
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    username: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/login';
      const body = isSignup
        ? formData
        : { email: formData.email, password: formData.password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Handle signup success - show 2FA token
      if (isSignup && data.twoFactorToken) {
        setGeneratedToken(data.twoFactorToken);
        setSuccess(data.message || 'Account created successfully!');
        return; // Don't redirect yet, let user see and copy their token
      }

      // Handle login - check if 2FA is required
      if (data.requiresTwoFactor) {
        setShowTwoFactorModal(true);
        return;
      }

      // Clear chatbot localStorage for fresh start
      localStorage.removeItem('chatbot_messages');
      localStorage.removeItem('chatbot_guest_name');
      localStorage.removeItem('chatbot_guest_id');
      localStorage.removeItem('chatbot_sent_ids');

      // Redirect based on user role after successful login
      if (data.user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          twoFactorToken: twoFactorCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      // Clear chatbot localStorage for fresh start
      localStorage.removeItem('chatbot_messages');
      localStorage.removeItem('chatbot_guest_name');
      localStorage.removeItem('chatbot_guest_id');
      localStorage.removeItem('chatbot_sent_ids');

      // Redirect based on user role after successful login
      if (data.user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Invalid 2FA token');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="space-y-4">
      {/* 2FA Token Success Modal */}
      {generatedToken && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Created Successfully!</h2>
              <p className="text-gray-600 mb-4">{success}</p>
            </div>

            <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-900 mb-2">Your 2FA Token:</p>
              <div className="bg-white border-2 border-blue-500 rounded-lg p-4 mb-3">
                <p className="text-3xl font-mono font-bold text-center text-blue-900 tracking-widest">
                  {generatedToken}
                </p>
              </div>
              <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 mb-3">
                <p className="text-xs text-yellow-800 font-semibold">
                  ⚠️ IMPORTANT: Save this token securely! You will need it every time you log in.
                </p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedToken);
                  alert('2FA token copied to clipboard!');
                }}
                className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
              >
                Copy Token to Clipboard
              </button>
            </div>

            <button
              onClick={() => {
                setGeneratedToken('');
                setSuccess('');
                setIsSignup(false);
                setFormData({
                  email: '',
                  password: '',
                  fullName: '',
                  username: '',
                });
              }}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 px-4 rounded-lg transition duration-200"
            >
              Continue to Login
            </button>
          </div>
        </div>
      )}

      {/* 2FA Input Modal */}
      {showTwoFactorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowTwoFactorModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Two-Factor Authentication</h2>
              <p className="text-gray-600 mb-4">Enter your 6-digit 2FA token to continue</p>
            </div>

            <form onSubmit={handleTwoFactorSubmit} className="space-y-4">
              <div>
                <label htmlFor="twoFactorCode" className="block text-sm font-medium text-gray-700 mb-2">
                  2FA Token
                </label>
                <input
                  type="text"
                  id="twoFactorCode"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  required
                  maxLength={6}
                  pattern="\d{6}"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent text-center text-2xl font-mono tracking-widest"
                  placeholder="123456"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-2">
                  Enter the 6-digit token you received when you created your account
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800 mb-2">
                  Lost access to your 2FA token?
                </p>
                <a
                  href="/reset-2fa"
                  className="text-sm text-blue-900 hover:text-blue-700 font-semibold underline"
                >
                  Reset 2FA with admin code →
                </a>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowTwoFactorModal(false);
                    setTwoFactorCode('');
                    setError('');
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 px-4 rounded-lg transition duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignup && (
          <>
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                placeholder="johndoe"
              />
            </div>
          </>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            {!isSignup && (
              <a
                href="/forgot-password"
                className="text-sm text-blue-900 hover:text-blue-800 font-medium transition-colors"
              >
                Forgot Password?
              </a>
            )}
          </div>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Please wait...' : isSignup ? 'Sign Up' : 'Log In'}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          if (!isSignup) {
            // Redirect to enhanced signup page
            router.push('/signup');
          } else {
            setIsSignup(false);
            setError('');
          }
        }}
        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 px-4 rounded-lg transition duration-200"
      >
        {isSignup ? 'Log In Instead' : 'Create New Account'}
      </button>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
        <p className="text-blue-900 font-medium mb-1">Welcome to {bankName}</p>
        <p className="text-blue-700">
          {isSignup
            ? 'Create an account to access secure online banking services.'
            : 'Log in to access your secure online banking account.'}
        </p>
      </div>
    </div>
  );
}
