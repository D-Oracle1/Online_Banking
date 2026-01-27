'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, CheckCircle, Clock, Paperclip, X } from 'lucide-react';
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

export default function UserMessagesClient({ messages: initialMessages, userName }: UserMessagesClientProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-refresh messages every 5 seconds
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

    const interval = setInterval(refreshMessages, 5000);
    return () => clearInterval(interval);
  }, []);

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
          message: newMessage || '(Image attachment)',
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
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-full">
      {/* Header - Compact */}
      <div className="bg-white rounded-t-xl shadow-md p-2 md:p-3 border border-gray-200 border-b-0">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-blue-900" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full animate-pulse"></span>
          </div>
          <div>
            <h1 className="text-base md:text-lg font-bold text-gray-900">Support Chat</h1>
            <p className="text-xs text-gray-600">Real-time support • Online now</p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 bg-gray-50 p-3 md:p-6 overflow-y-auto border-x border-gray-200">
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-2">No messages yet</h3>
              <p className="text-sm md:text-base text-gray-600">Send your first message to our support team below</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="mb-4">
                {msg.senderType === 'user' ? (
                  /* User Message */
                  <div className="flex justify-end">
                    <div className="max-w-[85%] md:max-w-2xl">
                      <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm p-3 md:p-4 shadow-md break-words">
                        <p className="whitespace-pre-wrap text-sm md:text-base">{msg.message}</p>
                        {msg.attachment && (
                          <div className="mt-3 rounded-lg overflow-hidden border-2 border-blue-400">
                            <img
                              src={msg.attachment}
                              alt="Attachment"
                              className="w-full h-auto cursor-pointer hover:opacity-90 transition max-w-[200px] md:max-w-[250px]"
                              onClick={() => window.open(msg.attachment!, '_blank')}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-end space-x-2 mt-1">
                        <p className="text-xs text-gray-500">
                          {format(new Date(msg.createdAt), 'MMM dd, HH:mm')}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Admin Message */
                  <div className="flex justify-start">
                    <div className="max-w-[85%] md:max-w-2xl">
                      <div className="flex items-center space-x-2 mb-1">
                        <div className="w-5 h-5 md:w-6 md:h-6 bg-green-600 rounded-full flex items-center justify-center">
                          <MessageSquare className="w-3 h-3 md:w-4 md:h-4 text-white" />
                        </div>
                        <p className="text-xs text-gray-500 font-semibold">Support Team</p>
                      </div>
                      <div className="bg-white border-2 border-gray-200 rounded-2xl rounded-tl-sm p-3 md:p-4 shadow-md break-words">
                        <p className="text-gray-800 whitespace-pre-wrap text-sm md:text-base">{msg.message}</p>
                        {msg.attachment && (
                          <div className="mt-3 rounded-lg overflow-hidden border-2 border-gray-300">
                            <img
                              src={msg.attachment}
                              alt="Attachment"
                              className="w-full h-auto cursor-pointer hover:opacity-90 transition max-w-[200px] md:max-w-[250px]"
                              onClick={() => window.open(msg.attachment!, '_blank')}
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-start space-x-2 mt-1">
                        <p className="text-xs text-gray-500">
                          {format(new Date(msg.createdAt), 'MMM dd, HH:mm')}
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
      <div className="bg-white rounded-b-xl shadow-md p-2 md:p-3 border border-gray-200 border-t-0">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
          {/* File Preview - Smaller */}
          {previewUrl && (
            <div className="mb-2 relative inline-block">
              <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 border-blue-500">
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
              <p className="text-xs text-gray-500 mt-1 truncate max-w-[80px]">{selectedFile?.name}</p>
            </div>
          )}

          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                className="w-full px-3 py-1.5 md:py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all text-sm"
                rows={1}
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
              className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              title="Attach image"
            >
              <Paperclip className="w-4 h-4 md:w-5 md:h-5" />
            </button>

            {/* Send Button - Smaller */}
            <button
              type="submit"
              disabled={isSending || (!newMessage.trim() && !selectedFile)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-3 md:px-6 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5 font-semibold shadow-lg hover:shadow-xl text-sm"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">{isSending ? 'Sending...' : 'Send'}</span>
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-1">
            <span className="hidden sm:inline">Press Enter to send • Shift+Enter for new line • </span>Max: 5MB
          </p>
        </form>
      </div>
    </div>
  );
}
