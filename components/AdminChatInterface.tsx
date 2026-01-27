'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Send, MessageSquare, User as UserIcon, Check, CheckCheck, Paperclip, X, Image as ImageIcon, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface User {
  id: string;
  fullName: string;
  email: string;
  username: string;
  profilePhoto: string | null;
}

interface Message {
  id: string;
  userId: string;
  message: string;
  attachment: string | null;
  senderType: 'user' | 'admin';
  isRead: boolean;
  createdAt: Date;
}

interface Conversation {
  user: User;
  lastMessage: Message;
  unreadCount: number;
}

interface AdminChatInterfaceProps {
  conversations: Conversation[];
  adminId: string;
}

export default function AdminChatInterface({ conversations: initialConversations, adminId }: AdminChatInterfaceProps) {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (selectedUser) {
      scrollToBottom();
    }
  }, [messages, selectedUser]);

  // Handle ESC key to close lightbox
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && lightboxImage) {
        setLightboxImage(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [lightboxImage]);

  // Load messages when user is selected
  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser.id);
    }
  }, [selectedUser]);

  // Auto-refresh conversations and messages
  useEffect(() => {
    const refreshData = async () => {
      try {
        // Refresh conversations list
        const convResponse = await fetch('/api/admin/chat/conversations');
        if (convResponse.ok) {
          const data = await convResponse.json();
          setConversations(data.conversations);
        }

        // Refresh messages if a user is selected
        if (selectedUser) {
          const msgResponse = await fetch(`/api/admin/chat/messages?userId=${selectedUser.id}`);
          if (msgResponse.ok) {
            const data = await msgResponse.json();
            setMessages(data.messages);
          }
        }
      } catch (error) {
        console.error('Error refreshing data:', error);
      }
    };

    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, [selectedUser]);

  const loadMessages = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/chat/messages?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);

        // Mark messages as read
        await fetch('/api/admin/chat/mark-read', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
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
    if (!selectedUser) return;

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

      const response = await fetch('/api/admin/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          message: newMessage || '(Image attachment)',
          attachment: attachmentBase64,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to send message' }));
        throw new Error(errorData.error || `Failed to send message (${response.status})`);
      }

      const data = await response.json();
      setMessages([...messages, data.message]);
      setNewMessage('');
      handleRemoveFile();
      setTimeout(scrollToBottom, 100);
    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMsg = error.message || 'Failed to send message. Please try again.';
      alert(errorMsg);
      // If error is related to file size, suggest user to use smaller file
      if (errorMsg.toLowerCase().includes('payload') || errorMsg.toLowerCase().includes('size') || errorMsg.toLowerCase().includes('413')) {
        alert('The file might be too large. Please try a smaller image (under 4MB recommended).');
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to unsend this message?')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/chat/delete-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId }),
      });

      if (response.ok) {
        setMessages(messages.filter(msg => msg.id !== messageId));
      } else {
        alert('Failed to unsend message');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to unsend message');
    }
  };

  const handleDeleteConversation = async () => {
    if (!selectedUser) return;

    if (!confirm(`Are you sure you want to delete the entire conversation with ${selectedUser.fullName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/chat/delete-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id }),
      });

      if (response.ok) {
        setMessages([]);
        setConversations(conversations.filter(conv => conv.user.id !== selectedUser.id));
        setSelectedUser(null);
      } else {
        alert('Failed to delete conversation');
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Failed to delete conversation');
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
      {/* Left Sidebar - Conversations List */}
      <div className="w-full md:w-96 border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-900 to-blue-800">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center">
            <MessageSquare className="w-6 h-6 mr-2" />
            Conversations
            {totalUnread > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {totalUnread}
              </span>
            )}
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.user.id}
                onClick={() => setSelectedUser(conv.user)}
                className={`p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
                  selectedUser?.id === conv.user.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {conv.user.profilePhoto ? (
                      <img
                        src={conv.user.profilePhoto}
                        alt={conv.user.fullName}
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg border-2 border-gray-200">
                        {conv.user.fullName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {conv.user.fullName}
                      </p>
                      <span className="text-xs text-gray-500">
                        {format(new Date(conv.lastMessage.createdAt), 'MMM dd')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-600 truncate flex items-center">
                        {conv.lastMessage.senderType === 'admin' && (
                          <span className="mr-1 text-green-600">You: </span>
                        )}
                        {conv.lastMessage.attachment && <ImageIcon className="w-3 h-3 mr-1" />}
                        {conv.lastMessage.message.substring(0, 30)}
                        {conv.lastMessage.message.length > 30 && '...'}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-2">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Panel - Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-900 to-blue-800 flex items-center">
              {selectedUser.profilePhoto ? (
                <img
                  src={selectedUser.profilePhoto}
                  alt={selectedUser.fullName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-white"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-blue-900 font-bold border-2 border-white">
                  {selectedUser.fullName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="ml-3 flex-1">
                <h3 className="font-semibold text-white">{selectedUser.fullName}</h3>
                <p className="text-xs text-blue-100">@{selectedUser.username} • {selectedUser.email}</p>
              </div>
              <button
                onClick={handleDeleteConversation}
                className="p-2 rounded-lg transition-colors hover:bg-blue-700 text-red-200 hover:text-red-100"
                title="Delete conversation"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              <div className="space-y-4 max-w-4xl mx-auto">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderType === 'admin' ? 'justify-end' : 'justify-start'} group`}
                    >
                      <div className={`max-w-[70%] ${msg.senderType === 'admin' ? 'order-2' : 'order-1'}`}>
                        {msg.senderType === 'user' && (
                          <div className="flex items-center space-x-2 mb-1">
                            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {selectedUser.fullName.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs text-gray-600 font-medium">{selectedUser.fullName}</span>
                          </div>
                        )}
                        <div className="relative">
                          <div
                            className={`rounded-2xl p-4 shadow-sm ${
                              msg.senderType === 'admin'
                                ? 'bg-green-600 text-white rounded-tr-sm'
                                : 'bg-white border border-gray-200 text-gray-900 rounded-tl-sm'
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                            {msg.attachment && (
                              <div className="mt-3 rounded-lg overflow-hidden">
                                <img
                                  src={msg.attachment}
                                  alt="Attachment"
                                  className="w-full h-auto max-w-xs cursor-pointer hover:opacity-90 transition rounded-lg"
                                  onClick={() => setLightboxImage(msg.attachment!)}
                                />
                              </div>
                            )}
                          </div>
                          {msg.senderType === 'admin' && (
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="absolute -left-8 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-200 text-red-600"
                              title="Unsend message"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className={`flex items-center space-x-2 mt-1 ${msg.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-xs text-gray-500">
                            {format(new Date(msg.createdAt), 'HH:mm')}
                          </span>
                          {msg.senderType === 'admin' && (
                            msg.isRead ? (
                              <CheckCheck className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Check className="w-4 h-4 text-gray-400" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <form onSubmit={handleSendMessage}>
                {previewUrl && (
                  <div className="mb-3 p-2 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-green-500 flex-shrink-0">
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700 mb-1">Image ready to send:</p>
                        <p className="text-xs text-gray-500 truncate">{selectedFile?.name}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {selectedFile && `${(selectedFile.size / 1024).toFixed(1)} KB`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="flex-shrink-0 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition"
                        title="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
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
                    className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    title="Attach image"
                  >
                    <Paperclip className="w-5 h-5 text-gray-600" />
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                  />
                  <button
                    type="submit"
                    disabled={isSending || (!newMessage.trim() && !selectedFile)}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-semibold"
                  >
                    <Send className="w-5 h-5" />
                    <span>{isSending ? 'Sending...' : 'Send'}</span>
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageSquare className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a conversation</h3>
              <p className="text-gray-600">Choose a user from the list to start chatting</p>
            </div>
          </div>
        )}
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
            <X className="w-8 h-8" />
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
            Click outside or press ESC to close
          </div>
        </div>
      )}
    </div>
  );
}
