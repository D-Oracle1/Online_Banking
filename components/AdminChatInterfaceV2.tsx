'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Send, MessageSquare, User as UserIcon, Paperclip, X, Image as ImageIcon, Moon, Sun, Trash2, Check, CheckCheck } from 'lucide-react';
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

export default function AdminChatInterfaceV2({ conversations: initialConversations, adminId }: AdminChatInterfaceProps) {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<{isOnline: boolean; isTyping: boolean}>({isOnline: false, isTyping: false});
  const [darkMode, setDarkMode] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedUserIdRef = useRef<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (selectedUser) {
      scrollToBottom();
    }
  }, [messages, selectedUser]);

  // Update ref whenever selectedUser changes
  useEffect(() => {
    selectedUserIdRef.current = selectedUser?.id || null;
  }, [selectedUser]);

  // Load messages when user is selected
  useEffect(() => {
    if (!selectedUser) {
      setMessages([]);
      setIsLoadingMessages(false);
      return;
    }

    // Clear messages immediately to prevent showing old messages
    setMessages([]);

    const controller = new AbortController();
    loadMessages(selectedUser.id, controller.signal);

    return () => {
      controller.abort();
    };
  }, [selectedUser]);

  // Auto-refresh
  useEffect(() => {
    const controller = new AbortController();

    const refreshData = async () => {
      try {
        // Store current user ID at start of request
        const currentUserId = selectedUserIdRef.current;

        const convResponse = await fetch('/api/admin/chat/conversations', {
          signal: controller.signal
        });
        if (convResponse.ok) {
          const data = await convResponse.json();
          setConversations(data.conversations);
        }

        if (currentUserId) {
          const [msgResponse, statusResponse] = await Promise.all([
            fetch(`/api/admin/chat/messages?userId=${currentUserId}`, {
              signal: controller.signal
            }),
            fetch(`/api/admin/chat/user-status?userId=${currentUserId}`, {
              signal: controller.signal
            })
          ]);

          // Only update if user hasn't changed
          if (selectedUserIdRef.current === currentUserId) {
            if (msgResponse.ok) {
              const data = await msgResponse.json();
              setMessages(data.messages);
            }

            if (statusResponse.ok) {
              const status = await statusResponse.json();
              setUserStatus(status);
            }
          }
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Error refreshing data:', error);
        }
      }
    };

    const interval = setInterval(refreshData, 3000);
    return () => {
      clearInterval(interval);
      controller.abort();
    };
  }, [selectedUser]);

  const loadMessages = async (userId: string, signal?: AbortSignal) => {
    setIsLoadingMessages(true);
    try {
      const response = await fetch(`/api/admin/chat/messages?userId=${userId}`, {
        signal
      });

      if (response.ok) {
        const data = await response.json();

        // Only update if this is still the selected user
        if (selectedUserIdRef.current === userId) {
          setMessages(data.messages);
          setIsLoadingMessages(false);

          // Mark as read (don't pass signal as this should complete)
          await fetch('/api/admin/chat/mark-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
          }).catch(err => {
            console.error('Error marking messages as read:', err);
          });
        }
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error loading messages:', error);
        setIsLoadingMessages(false);
      }
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
          message: newMessage || '',
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
    <div className={`flex h-[calc(100vh-8rem)] min-h-[600px] rounded-lg shadow-lg border ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
      {/* Left Sidebar - Conversations List */}
      <div className={`w-full md:w-80 border-r flex flex-col ${darkMode ? 'border-gray-700' : 'border-gray-200'} ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
        {/* Header - Fixed */}
        <div className={`p-3 border-b flex-shrink-0 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gradient-to-r from-blue-900 to-blue-800 border-gray-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <h2 className={`text-lg font-bold flex items-center ${darkMode ? 'text-white' : 'text-white'}`}>
              <MessageSquare className="w-5 h-5 mr-2" />
              Chats
              {totalUnread > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {totalUnread}
                </span>
              )}
            </h2>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-blue-800 hover:bg-blue-700'}`}
            >
              {darkMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-white" />}
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-8 pr-3 py-1.5 rounded-lg border text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'}`}
            />
          </div>
        </div>

        {/* Conversations List - Scrollable */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {filteredConversations.length === 0 ? (
            <div className={`p-6 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No conversations</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div
                key={conv.user.id}
                onClick={() => setSelectedUser(conv.user)}
                className={`p-2.5 border-b cursor-pointer transition-colors ${
                  selectedUser?.id === conv.user.id
                    ? darkMode ? 'bg-gray-800 border-l-4 border-l-blue-500' : 'bg-blue-50 border-l-4 border-l-blue-600'
                    : darkMode ? 'border-gray-800 hover:bg-gray-800' : 'border-gray-100 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start space-x-2">
                  <div className="flex-shrink-0 relative">
                    {conv.user.profilePhoto ? (
                      <img
                        src={conv.user.profilePhoto}
                        alt={conv.user.fullName}
                        className="w-10 h-10 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLightboxImage(conv.user.profilePhoto);
                        }}
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${darkMode ? 'bg-blue-600' : 'bg-gradient-to-br from-blue-500 to-blue-600'}`}>
                        {conv.user.fullName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className={`text-sm font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {conv.user.fullName}
                      </p>
                      <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        {format(new Date(conv.lastMessage.createdAt), 'HH:mm')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className={`text-xs truncate flex items-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {conv.lastMessage.senderType === 'admin' && (
                          <span className="text-green-500 mr-1">You: </span>
                        )}
                        {conv.lastMessage.attachment && <ImageIcon className="w-3 h-3 mr-1" />}
                        {conv.lastMessage.message.substring(0, 25)}
                        {conv.lastMessage.message.length > 25 && '...'}
                      </p>
                      {conv.unreadCount > 0 && (
                        <span className="bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full ml-2">
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
      <div className={`flex-1 flex flex-col ${selectedUser ? 'flex' : 'hidden md:flex'}`}>
        {selectedUser ? (
          <>
            {/* Chat Header - Fixed */}
            <div className={`p-2.5 border-b flex items-center flex-shrink-0 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gradient-to-r from-blue-900 to-blue-800 border-gray-200'}`}>
              {/* Back Button - Mobile Only */}
              <button
                onClick={() => setSelectedUser(null)}
                className={`md:hidden mr-2 p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-blue-700'}`}
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {selectedUser.profilePhoto ? (
                <img
                  src={selectedUser.profilePhoto}
                  alt={selectedUser.fullName}
                  className="w-8 h-8 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setLightboxImage(selectedUser.profilePhoto)}
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-blue-900 font-bold text-sm">
                  {selectedUser.fullName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="ml-2 flex-1">
                <h3 className={`font-semibold text-sm ${darkMode ? 'text-white' : 'text-white'}`}>{selectedUser.fullName}</h3>
                <div className="flex items-center space-x-2">
                  {userStatus.isOnline ? (
                    <>
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <p className={`text-xs ${darkMode ? 'text-green-400' : 'text-green-100'}`}>
                        {userStatus.isTyping ? 'Typing...' : 'Online'}
                      </p>
                    </>
                  ) : (
                    <>
                      <span className={`w-2 h-2 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-gray-400'}`}></span>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-blue-100'}`}>Offline</p>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={handleDeleteConversation}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-red-400 hover:text-red-300' : 'hover:bg-blue-700 text-red-200 hover:text-red-100'}`}
                title="Delete conversation"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area - Scrollable */}
            <div className={`flex-1 overflow-y-auto overflow-x-hidden p-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
              <div className="space-y-3 max-w-5xl mx-auto">
                {isLoadingMessages ? (
                  <div className={`text-center py-8 ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
                    <p className="text-sm">Loading messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className={`text-center py-8 ${darkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderType === 'admin' ? 'justify-end' : 'justify-start'} group`}
                    >
                      <div className={`max-w-[85%] md:max-w-[70%] lg:max-w-[60%] ${msg.senderType === 'admin' ? 'order-2' : 'order-1'}`}>
                        {msg.senderType === 'user' && (
                          <div className="flex items-center space-x-1.5 mb-1">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ${darkMode ? 'bg-blue-600' : 'bg-blue-600'}`}>
                              {selectedUser.fullName.charAt(0).toUpperCase()}
                            </div>
                            <span className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{selectedUser.fullName}</span>
                          </div>
                        )}
                        <div className="relative">
                          <div
                            className={`rounded-2xl p-3 shadow-sm text-sm md:text-base ${
                              msg.senderType === 'admin'
                                ? darkMode ? 'bg-green-700 text-white rounded-tr-sm' : 'bg-green-600 text-white rounded-tr-sm'
                                : darkMode ? 'bg-gray-800 border border-gray-700 text-gray-200 rounded-tl-sm' : 'bg-white border border-gray-200 text-gray-900 rounded-tl-sm'
                            }`}
                          >
                            {msg.message && <p className="whitespace-pre-wrap break-words">{msg.message}</p>}
                            {msg.attachment && (
                              <div className={msg.message ? "mt-2" : ""}>
                                <div className="rounded-lg overflow-hidden">
                                  <img
                                    src={msg.attachment}
                                    alt="Attachment"
                                    className="w-full h-auto max-w-[200px] max-h-[200px] object-cover cursor-pointer hover:opacity-90 transition rounded-lg"
                                    onClick={() => setLightboxImage(msg.attachment!)}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                          {msg.senderType === 'admin' && (
                            <button
                              onClick={() => handleDeleteMessage(msg.id)}
                              className={`absolute -left-8 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded ${darkMode ? 'hover:bg-gray-700 text-red-400' : 'hover:bg-gray-200 text-red-600'}`}
                              title="Unsend message"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className={`flex items-center space-x-1.5 mt-0.5 ${msg.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}>
                          <span className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            {format(new Date(msg.createdAt), 'HH:mm')}
                          </span>
                          {msg.senderType === 'admin' && (
                            msg.isRead ? (
                              <CheckCheck className={`w-3.5 h-3.5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                            ) : (
                              <Check className={`w-3.5 h-3.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
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

            {/* Message Input - Fixed at bottom */}
            <div className={`p-3 border-t flex-shrink-0 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <form onSubmit={handleSendMessage}>
                {previewUrl && (
                  <div className={`mb-3 p-2 rounded-lg border ${darkMode ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'}`}>
                    <div className="flex items-center gap-3">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-green-500 flex-shrink-0">
                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Image ready to send:</p>
                        <p className={`text-xs truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{selectedFile?.name}</p>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
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
                    className={`p-2.5 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                    title="Attach image"
                  >
                    <Paperclip className={`w-4 h-4 md:w-5 md:h-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className={`flex-1 px-4 py-2.5 border rounded-lg text-sm md:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900'}`}
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
                    className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-semibold text-sm md:text-base"
                  >
                    <Send className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="hidden sm:inline">{isSending ? 'Sending...' : 'Send'}</span>
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          <div className={`flex-1 flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="text-center">
              <MessageSquare className={`w-16 h-16 mx-auto mb-3 ${darkMode ? 'text-gray-700' : 'text-gray-300'}`} />
              <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Select a conversation</h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Choose a user from the list to start chatting</p>
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
