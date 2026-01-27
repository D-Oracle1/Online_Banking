'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Paperclip, X, Moon, Sun } from 'lucide-react';
import { format } from 'date-fns';

interface Message {
  id: string;
  userId: string;
  message: string;
  attachment: string | null;
  response: string | null;
  senderType: 'user' | 'admin';
  isRead: boolean;
  createdAt: Date;
}

interface UserMessagesClientProps {
  messages: Message[];
  userName: string;
}

export default function UserMessagesClientV2({ messages: initialMessages, userName }: UserMessagesClientProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update activity status
  useEffect(() => {
    const updateActivity = async () => {
      try {
        await fetch('/api/chat/activity', { method: 'POST' });
      } catch (error) {
        console.error('Error updating activity:', error);
      }
    };

    updateActivity();
    const activityInterval = setInterval(updateActivity, 30000); // Every 30 seconds

    return () => clearInterval(activityInterval);
  }, []);

  // Auto-refresh messages every 3 seconds
  useEffect(() => {
    const refreshMessages = async () => {
      try {
        const response = await fetch('/api/messages/check');
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages);
        }
      } catch (error) {
        console.error('Error refreshing messages:', error);
      }
    };

    const interval = setInterval(refreshMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleTyping = async (typing: boolean) => {
    try {
      await fetch('/api/chat/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isTyping: typing }),
      });
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    if (!isTyping && e.target.value.trim()) {
      setIsTyping(true);
      handleTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        handleTyping(false);
      }
    }, 2000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        alert('Only image files are allowed');
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedFile) return;

    // Clear typing status
    if (isTyping) {
      setIsTyping(false);
      handleTyping(false);
    }

    setIsSending(true);

    try {
      let attachmentBase64 = null;

      if (selectedFile) {
        const reader = new FileReader();
        attachmentBase64 = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
      }

      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: newMessage || '',
          attachment: attachmentBase64
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const data = await response.json();
      setMessages([...messages, data.message]);
      setNewMessage('');
      handleRemoveFile();
      setTimeout(scrollToBottom, 100);
    } catch (error: any) {
      alert(error.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className={`flex flex-col h-[calc(100vh-8rem)] max-w-full rounded-lg overflow-hidden shadow-lg ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Header - Compact */}
      <div className={`p-2.5 border-b ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gradient-to-r from-blue-900 to-blue-800 border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <MessageSquare className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-white'}`} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 border-2 border-white rounded-full animate-pulse"></span>
            </div>
            <div>
              <h1 className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-white'}`}>Support Chat</h1>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-blue-100'}`}>Online now</p>
            </div>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-blue-800 hover:bg-blue-700'}`}
          >
            {darkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-white" />}
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className={`flex-1 p-3 overflow-y-auto ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="space-y-2 max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-gray-700' : 'text-gray-300'}`} />
              <h3 className={`text-sm font-semibold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>No messages yet</h3>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Send your first message to our support team below</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id}>
                {msg.senderType === 'user' ? (
                  /* User Message */
                  <div className="flex justify-end">
                    <div className="max-w-[80%]">
                      <div className={`rounded-2xl rounded-tr-sm p-2.5 shadow-sm ${darkMode ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white'}`}>
                        {msg.message && <p className="whitespace-pre-wrap text-sm break-words">{msg.message}</p>}
                        {msg.attachment && (
                          <div className={msg.message ? "mt-2" : ""}>
                            <div className="rounded-lg overflow-hidden border-2 border-blue-400">
                              <img
                                src={msg.attachment}
                                alt="Attachment"
                                className="w-full h-auto cursor-pointer hover:opacity-90 transition max-w-[200px]"
                                onClick={() => setLightboxImage(msg.attachment!)}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-end space-x-1.5 mt-0.5">
                        <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          {format(new Date(msg.createdAt), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Admin Message */
                  <div className="flex justify-start">
                    <div className="max-w-[80%]">
                      <div className="flex items-center space-x-1.5 mb-1">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${darkMode ? 'bg-green-700' : 'bg-green-600'}`}>
                          <MessageSquare className="w-3 h-3 text-white" />
                        </div>
                        <p className={`text-xs font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Support Team</p>
                      </div>
                      <div className={`rounded-2xl rounded-tl-sm p-2.5 shadow-sm ${darkMode ? 'bg-gray-800 border border-gray-700 text-gray-200' : 'bg-white border border-gray-200 text-gray-900'}`}>
                        {msg.message && <p className="whitespace-pre-wrap text-sm break-words">{msg.message}</p>}
                        {msg.attachment && (
                          <div className={msg.message ? "mt-2" : ""}>
                            <div className="rounded-lg overflow-hidden border-2 border-gray-300">
                              <img
                                src={msg.attachment}
                                alt="Attachment"
                                className="w-full h-auto cursor-pointer hover:opacity-90 transition max-w-[200px]"
                                onClick={() => setLightboxImage(msg.attachment!)}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-start space-x-1.5 mt-0.5">
                        <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          {format(new Date(msg.createdAt), 'HH:mm')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input - Compact */}
      <div className={`p-2.5 border-t ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
          {/* File Preview - Smaller */}
          {previewUrl && (
            <div className="mb-2 relative inline-block">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-blue-500">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="flex gap-1.5 items-end">
            <div className="flex-1">
              <input
                type="text"
                value={newMessage}
                onChange={handleInputChange}
                placeholder="Type a message..."
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
            </div>

            {/* Attachment Button - Smaller */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
              title="Attach image"
            >
              <Paperclip className={`w-4 h-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} />
            </button>

            {/* Send Button - Smaller */}
            <button
              type="submit"
              disabled={isSending || (!newMessage.trim() && !selectedFile)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5 font-semibold shadow-lg hover:shadow-xl text-sm"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">{isSending ? 'Sending...' : 'Send'}</span>
            </button>
          </div>

          <p className={`text-xs mt-1.5 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            <span className="hidden sm:inline">Press Enter to send • </span>Max: 5MB
          </p>
        </form>
      </div>

      {/* Image Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
            aria-label="Close"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <img
              src={lightboxImage}
              alt="Full size view"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-4 py-2 rounded-full">
            Click anywhere to close
          </div>
        </div>
      )}
    </div>
  );
}
