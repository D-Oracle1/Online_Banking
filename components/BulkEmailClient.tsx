'use client';

import { useState } from 'react';
import { Send, CheckCircle, AlertCircle, User, Mail } from 'lucide-react';

interface User {
  id: string;
  fullName: string;
  email: string;
  username: string;
}

interface BulkEmailClientProps {
  users: User[];
}

export default function BulkEmailClient({ users }: BulkEmailClientProps) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.id));
    }
  };

  const handleToggleUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (selectedUsers.length === 0) {
      setError('Please select at least one user');
      return;
    }

    if (!subject.trim()) {
      setError('Please enter a subject');
      return;
    }

    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch('/api/admin/bulk-email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: selectedUsers,
          subject,
          message,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send emails');
      }

      const data = await response.json();
      setSuccess(`Successfully sent ${data.sentCount} email(s) to ${selectedUsers.length} user(s)`);
      setSelectedUsers([]);
      setSubject('');
      setMessage('');
    } catch (err: any) {
      setError(err.message || 'Failed to send emails');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* User Selection */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl shadow-md border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Select Recipients</h3>
              <span className="text-sm text-gray-600">
                {selectedUsers.length} of {users.length}
              </span>
            </div>
            <button
              type="button"
              onClick={handleSelectAll}
              className="w-full px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-lg transition text-sm"
            >
              {selectedUsers.length === users.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="max-h-[500px] overflow-y-auto">
            {users.map((user) => (
              <div
                key={user.id}
                onClick={() => handleToggleUser(user.id)}
                className={`p-4 border-b border-gray-100 cursor-pointer transition ${
                  selectedUsers.includes(user.id)
                    ? 'bg-blue-50 hover:bg-blue-100'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="mt-1">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => {}}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.fullName}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <p className="text-xs text-gray-600 truncate">{user.email}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Email Form */}
      <div className="lg:col-span-2">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 border border-gray-200 space-y-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Compose Email</h3>

            {/* Subject */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                placeholder="Enter email subject"
              />
            </div>

            {/* Message */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message *
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={12}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                placeholder="Enter your message here..."
              />
              <p className="text-xs text-gray-500 mt-1">
                You can use basic HTML formatting in your message
              </p>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span className="text-sm">{success}</span>
            </div>
          )}

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <strong>Recipients:</strong> {selectedUsers.length} user(s) selected
            </p>
            {selectedUsers.length > 0 && (
              <p className="text-xs text-gray-600 mt-1">
                Email will be sent to all selected users
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSending || selectedUsers.length === 0 || !subject || !message}
            className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <Send className="w-5 h-5" />
            <span>{isSending ? 'Sending...' : `Send Email to ${selectedUsers.length} User(s)`}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
