'use client';

import { useState } from 'react';
import { Search, MessageSquare, Send, Eye, Check, CheckCheck, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';

interface Message {
  id: string;
  userId: string;
  message: string;
  attachment: string | null;
  response: string | null;
  isRead: boolean;
  createdAt: Date;
  user: {
    id: string;
    fullName: string;
    email: string;
    username: string;
  } | null;
}

interface AdminMessagesClientProps {
  messages: Message[];
}

export default function AdminMessagesClient({ messages: initialMessages }: AdminMessagesClientProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [responseText, setResponseText] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'REPLIED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredMessages = messages.filter((msg) => {
    // Filter by status
    const statusMatch =
      filter === 'ALL' ||
      (filter === 'UNREAD' && !msg.isRead) ||
      (filter === 'REPLIED' && msg.response);

    // Filter by search term
    const searchMatch =
      !searchTerm ||
      msg.user?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.message.toLowerCase().includes(searchTerm.toLowerCase());

    return statusMatch && searchMatch;
  });

  const handleSendResponse = async (messageId: string) => {
    if (!responseText.trim()) {
      alert('Please enter a response');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/messages/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, response: responseText }),
      });

      if (!response.ok) throw new Error('Failed to send response');

      // Update local state
      setMessages(
        messages.map((msg) =>
          msg.id === messageId
            ? { ...msg, response: responseText, isRead: true }
            : msg
        )
      );

      setResponseText('');
      setSelectedMessage(null);
      alert('Response sent successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to send response');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/messages/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId }),
      });

      if (!response.ok) throw new Error('Failed to mark as read');

      // Update local state
      setMessages(messages.map((msg) => (msg.id === messageId ? { ...msg, isRead: true } : msg)));
    } catch (error: any) {
      alert(error.message || 'Failed to mark as read');
    } finally {
      setIsProcessing(false);
    }
  };

  const unreadCount = messages.filter((msg) => !msg.isRead).length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Messages</p>
              <p className="text-3xl font-bold text-gray-900">{messages.length}</p>
            </div>
            <MessageSquare className="w-12 h-12 text-blue-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unread</p>
              <p className="text-3xl font-bold text-yellow-600">{unreadCount}</p>
            </div>
            <MessageSquare className="w-12 h-12 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Replied</p>
              <p className="text-3xl font-bold text-green-600">
                {messages.filter((m) => m.response).length}
              </p>
            </div>
            <CheckCheck className="w-12 h-12 text-green-600" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex space-x-2">
            {['ALL', 'UNREAD', 'REPLIED'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === status
                    ? 'bg-blue-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Messages Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Message
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMessages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No messages found
                  </td>
                </tr>
              ) : (
                filteredMessages.map((message) => (
                  <tr key={message.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div title={message.isRead ? "Read" : "Unread"}>
                        {message.isRead ? (
                          <CheckCheck className="w-5 h-5 text-green-600" />
                        ) : (
                          <Check className="w-5 h-5 text-yellow-600" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {message.user?.fullName || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">{message.user?.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-md truncate">
                        {message.message}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {message.attachment && (
                          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-800">
                            <ImageIcon className="w-3 h-3 mr-1" />
                            Image
                          </span>
                        )}
                        {message.response && (
                          <div className="text-xs text-green-600">✓ Replied</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {format(new Date(message.createdAt), 'MMM dd, yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedMessage(message)}
                          className="text-blue-600 hover:text-blue-800"
                          title="View & Reply"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        {!message.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(message.id)}
                            disabled={isProcessing}
                            className="text-green-600 hover:text-green-800 disabled:opacity-50"
                            title="Mark as Read"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Message Detail & Reply Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto">
            <div className="bg-blue-900 text-white p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold">Message Details</h2>
            </div>

            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="border-b pb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">User</label>
                    <p className="text-gray-900 font-semibold">
                      {selectedMessage.user?.fullName}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900">{selectedMessage.user?.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Username</label>
                    <p className="text-gray-900">@{selectedMessage.user?.username}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <p className="text-gray-900">
                      {format(new Date(selectedMessage.createdAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User Message
                </label>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-gray-900 whitespace-pre-wrap">{selectedMessage.message}</p>
                  {selectedMessage.attachment && (
                    <div className="mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <ImageIcon className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">Attachment:</span>
                      </div>
                      <div className="rounded-lg overflow-hidden border-2 border-blue-300 max-w-sm mx-auto">
                        <Image
                          src={selectedMessage.attachment}
                          alt="User attachment"
                          width={400}
                          height={300}
                          className="w-full h-auto max-h-48 object-contain cursor-pointer hover:opacity-90 transition"
                          onClick={() => window.open(selectedMessage.attachment!, '_blank')}
                        />
                      </div>
                      <p className="text-xs text-gray-500 text-center mt-2">Click image to view full size</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Previous Response */}
              {selectedMessage.response && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Response
                  </label>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-gray-900">{selectedMessage.response}</p>
                  </div>
                </div>
              )}

              {/* Reply Form */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {selectedMessage.response ? 'Update Response' : 'Send Response'}
                </label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Type your response here..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
                  rows={5}
                />
              </div>

              {/* Actions */}
              <div className="flex space-x-4 border-t pt-4">
                <button
                  onClick={() => handleSendResponse(selectedMessage.id)}
                  disabled={isProcessing || !responseText.trim()}
                  className="flex-1 bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  <Send className="w-5 h-5" />
                  <span>{isProcessing ? 'Sending...' : 'Send Response'}</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedMessage(null);
                    setResponseText('');
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
