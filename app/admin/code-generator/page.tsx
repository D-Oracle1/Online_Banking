'use client';

import { useState } from 'react';
import { Key, Shield, Unlock, Search, Copy, CheckCircle } from 'lucide-react';

export default function CodeGeneratorPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [generatedCodes, setGeneratedCodes] = useState({
    aml: '',
    twoFA: '',
    unlock: '',
  });
  const [copiedField, setCopiedField] = useState('');

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      alert('Please enter a name to search');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      setSearchResults(data.users || []);
      if (data.users.length === 0) {
        alert('No users found with that name');
      }
    } catch (error: any) {
      alert(error.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const generateCodes = async (user: any) => {
    setSelectedUser(user);
    setLoading(true);

    try {
      const response = await fetch('/api/admin/generate-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate codes');
      }

      setGeneratedCodes({
        aml: data.codes.amlCode,
        twoFA: data.codes.twoFACode,
        unlock: data.codes.unlockCode,
      });

      // Show success message with invalidation notice
      alert(`✅ New codes generated successfully!\n\n⚠️ IMPORTANT: All previous codes for ${user.fullName} have been invalidated and can no longer be used. Only the new codes shown below are now valid.`);
    } catch (error: any) {
      alert(error.message || 'Failed to generate codes');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(''), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Code Generator</h1>
        <p className="text-gray-600 mt-2">Generate AML, 2FA, and unlock codes for users</p>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Search User</h2>
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter user's full name, first name, or last name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded-lg transition duration-200 flex items-center gap-2"
          >
            <Search className="w-5 h-5" />
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="font-semibold text-gray-700">Search Results:</h3>
            {searchResults.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <div>
                  <p className="font-semibold text-gray-900">{user.fullName}</p>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <p className="text-sm text-gray-500">Account: {user.accountNumber || 'N/A'}</p>
                </div>
                <button
                  onClick={() => generateCodes(user)}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition duration-200"
                >
                  Generate Codes
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generated Codes Section */}
      {selectedUser && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Generated Codes</h2>
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
            <p className="text-blue-900 font-medium">
              Codes generated for: <span className="font-bold">{selectedUser.fullName}</span>
            </p>
            <p className="text-sm text-blue-700 mt-1">{selectedUser.email}</p>
          </div>

          <div className="space-y-4">
            {/* AML Code */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">AML Protection Code</h3>
                </div>
                <button
                  onClick={() => copyToClipboard(generatedCodes.aml, 'aml')}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition"
                  disabled={loading}
                >
                  {copiedField === 'aml' ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span className="text-sm">Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-3xl font-mono font-bold text-gray-900 tracking-widest text-center">
                  {generatedCodes.aml || '------'}
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                6-digit code to unlock AML-protected transfers. Valid for 24 hours.
              </p>
            </div>

            {/* 2FA Code */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-gray-900">2FA Reset Code</h3>
                </div>
                <button
                  onClick={() => copyToClipboard(generatedCodes.twoFA, 'twoFA')}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition"
                  disabled={loading}
                >
                  {copiedField === 'twoFA' ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span className="text-sm">Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-3xl font-mono font-bold text-gray-900 tracking-widest text-center">
                  {generatedCodes.twoFA || '------'}
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                6-digit code to reset user's 2FA settings. Valid for 24 hours.
              </p>
            </div>

            {/* Unlock Code */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Unlock className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-gray-900">Account Unlock Code</h3>
                </div>
                <button
                  onClick={() => copyToClipboard(generatedCodes.unlock, 'unlock')}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition"
                  disabled={loading}
                >
                  {copiedField === 'unlock' ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span className="text-sm">Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-3xl font-mono font-bold text-gray-900 tracking-widest text-center">
                  {generatedCodes.unlock || '------'}
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                6-digit code to unlock user's account or reset restrictions. Valid for 24 hours.
              </p>
            </div>
          </div>

          {/* Warnings */}
          <div className="mt-6 space-y-3">
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
              <p className="text-red-900 font-medium text-sm">
                🔒 <strong>Important:</strong> These new codes have REPLACED all previous codes. Old codes are now invalid and cannot be used to access the account.
              </p>
            </div>
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
              <p className="text-yellow-900 font-medium text-sm">
                ⚠️ <strong>Security Notice:</strong> These codes are sensitive. Only share them with authorized users through secure channels.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
