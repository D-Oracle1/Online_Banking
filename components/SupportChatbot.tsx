'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Paperclip, XCircle } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  attachment?: string | null; // Base64 encoded image
}

export default function SupportChatbot() {
  const { settings } = useSiteSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSendingToSupport, setIsSendingToSupport] = useState(false);
  const [sentMessageIds, setSentMessageIds] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAuthPage, setIsAuthPage] = useState(false);

  // Anonymous chat states
  const [guestName, setGuestName] = useState<string>('');
  const [guestId, setGuestId] = useState<string>('');
  const [showNameForm, setShowNameForm] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [sessionId, setSessionId] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const activityIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detect if on auth page (login/signup)
  useEffect(() => {
    const path = window.location.pathname;
    setIsAuthPage(path === '/login' || path === '/signup');
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Generate guest ID
  const generateGuestId = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 11);
    return `guest-${timestamp}-${random}`;
  };

  // Load guest info and messages from localStorage on mount (runs once)
  useEffect(() => {
    const savedGuestName = localStorage.getItem('chatbot_guest_name');
    const savedGuestId = localStorage.getItem('chatbot_guest_id');
    const savedMessages = localStorage.getItem('chatbot_messages');
    const savedSentIds = localStorage.getItem('chatbot_sent_ids');
    const savedSessionId = localStorage.getItem('chatbot_session_id');

    // Load guest info
    if (savedGuestName && savedGuestId) {
      setGuestName(savedGuestName);
      setGuestId(savedGuestId);
      setShowNameForm(false);
      if (savedSessionId) {
        setSessionId(savedSessionId);
      }
    } else {
      // No saved data, create new session
      const newSessionId = `session-${Date.now()}`;
      localStorage.setItem('chatbot_session_id', newSessionId);
      setSessionId(newSessionId);
      setShowNameForm(true);
    }

    // Load messages
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        // Convert timestamp strings back to Date objects
        const messagesWithDates = parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(messagesWithDates);
      } catch (error) {
        console.error('Error loading messages:', error);
        setMessages([]);
      }
    }

    // Load sent message IDs
    if (savedSentIds) {
      try {
        const parsed = JSON.parse(savedSentIds);
        setSentMessageIds(new Set(parsed));
      } catch (error) {
        console.error('Error loading sent IDs:', error);
      }
    }

    setIsLoaded(true);
  }, []); // Empty dependency array - runs only on mount

  // Handle localStorage clear detection and storage events
  useEffect(() => {
    // Ref to track current values without causing re-renders
    let currentGuestNameRef = guestName;
    let currentSessionIdRef = sessionId;

    // Update refs when state changes
    currentGuestNameRef = guestName;
    currentSessionIdRef = sessionId;

    // Periodic check for localStorage changes (every 2 seconds)
    // This catches same-tab changes that storage events miss
    const intervalId = setInterval(() => {
      const storedGuestName = localStorage.getItem('chatbot_guest_name');

      // If localStorage was cleared but we have state, reset
      if (!storedGuestName && currentGuestNameRef) {
        setMessages([]);
        setGuestName('');
        setGuestId('');
        setSentMessageIds(new Set());
        setShowNameForm(true);
        // Create new session
        const newSessionId = `session-${Date.now()}`;
        localStorage.setItem('chatbot_session_id', newSessionId);
        setSessionId(newSessionId);
      }
    }, 2000);

    // Listen for storage events (when localStorage is cleared or changed in other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      // If chatbot data was removed, reset the component
      if (
        e.key === 'chatbot_messages' ||
        e.key === 'chatbot_guest_name' ||
        e.key === 'chatbot_guest_id' ||
        e.key === 'chatbot_session_id' ||
        e.key === null // null means localStorage.clear() was called
      ) {
        if (!localStorage.getItem('chatbot_guest_name')) {
          // Reset all state when chat data is cleared
          setMessages([]);
          setGuestName('');
          setGuestId('');
          setSentMessageIds(new Set());
          setShowNameForm(true);
          // Create new session
          const newSessionId = `session-${Date.now()}`;
          localStorage.setItem('chatbot_session_id', newSessionId);
          setSessionId(newSessionId);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(intervalId);
    };
  }, [guestName, sessionId]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (isLoaded && messages.length > 0) {
      localStorage.setItem('chatbot_messages', JSON.stringify(messages));
    }
  }, [messages, isLoaded]);

  // Save sent message IDs to localStorage
  useEffect(() => {
    if (isLoaded && sentMessageIds.size > 0) {
      localStorage.setItem('chatbot_sent_ids', JSON.stringify(Array.from(sentMessageIds)));
    }
  }, [sentMessageIds, isLoaded]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  // Poll for admin responses
  useEffect(() => {
    const checkForResponses = async () => {
      if (!guestId) return;

      try {
        const response = await fetch(`/api/messages/check-anonymous?guestId=${encodeURIComponent(guestId)}`);
        if (!response.ok) return;

        const data = await response.json();
        const newMessages: Message[] = [];
        let hasNewAdminMessages = false;

        // Process all messages from the API
        data.messages.forEach((msg: any) => {
          // Pattern 1: New-style admin messages (senderType='admin')
          if (msg.senderType === 'admin') {
            // Check if we already have this admin message in our local state
            const existingMessage = messages.find(m => m.id === msg.id);

            if (!existingMessage) {
              // Create message text with attachment if present
              let messageText = msg.message || '(No text)';

              const adminMessage: Message = {
                id: msg.id,
                text: messageText,
                sender: 'bot',
                timestamp: new Date(msg.createdAt),
                attachment: msg.attachment || null,
              };
              newMessages.push(adminMessage);
              hasNewAdminMessages = true;
            }
          }

          // Pattern 2: Old-style response field (backward compatibility)
          else if (msg.response && sentMessageIds.has(msg.id)) {
            // Add admin response to chat if we haven't seen it yet
            const existingBotMessage = messages.find(
              m => m.id === `admin-response-${msg.id}` && m.sender === 'bot'
            );

            if (!existingBotMessage) {
              const adminResponseMessage: Message = {
                id: `admin-response-${msg.id}`,
                text: `Support Team Response:\n\n${msg.response}`,
                sender: 'bot',
                timestamp: new Date(),
              };
              newMessages.push(adminResponseMessage);
              hasNewAdminMessages = true;
            }
          }
        });

        // Add any new messages found
        if (newMessages.length > 0) {
          setMessages((prev) => {
            // Merge and deduplicate by ID
            const combined = [...prev, ...newMessages];
            const uniqueMessages = Array.from(
              new Map(combined.map(m => [m.id, m])).values()
            );
            // Sort by timestamp
            return uniqueMessages.sort((a, b) =>
              a.timestamp.getTime() - b.timestamp.getTime()
            );
          });

          // Mark messages as read after displaying them
          if (hasNewAdminMessages) {
            try {
              await fetch('/api/messages/mark-read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ guestId }),
              });
            } catch (error) {
              console.error('Error marking messages as read:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error checking for responses:', error);
      }
    };

    // Start polling when chat is open and user has provided name
    if (isOpen && guestId && !showNameForm) {
      checkForResponses(); // Check immediately
      pollingIntervalRef.current = setInterval(checkForResponses, 5000); // Check every 5 seconds
    }

    // Cleanup
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [isOpen, guestId, showNameForm, sentMessageIds, messages]);

  // Track user activity - for authenticated users only
  useEffect(() => {
    const updateActivity = async (isTyping = false) => {
      try {
        await fetch('/api/user/update-activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isTyping }),
        });
      } catch (error) {
        // Silently fail - this is for activity tracking only
        console.debug('Activity update failed (might be guest user):', error);
      }
    };

    // Only track activity for authenticated users (not guests)
    if (isOpen && !showNameForm && !guestId.startsWith('guest-')) {
      updateActivity(); // Update immediately
      activityIntervalRef.current = setInterval(() => updateActivity(), 30000); // Update every 30 seconds
    }

    // Cleanup
    return () => {
      if (activityIntervalRef.current) {
        clearInterval(activityIntervalRef.current);
      }
    };
  }, [isOpen, guestId, showNameForm]);

  // Handle name submission
  const handleNameSubmit = () => {
    const name = nameInput.trim();
    if (!name) {
      nameInputRef.current?.focus();
      return;
    }

    const newGuestId = generateGuestId();
    const newSessionId = `session-${Date.now()}`;

    setGuestName(name);
    setGuestId(newGuestId);
    setSessionId(newSessionId);

    // Save to localStorage
    localStorage.setItem('chatbot_guest_name', name);
    localStorage.setItem('chatbot_guest_id', newGuestId);
    localStorage.setItem('chatbot_session_id', newSessionId);

    setShowNameForm(false);

    // Add welcome message
    const welcomeMessage: Message = {
      id: '1',
      text: `Hello ${name}! Welcome to ${settings.bankName} Support. Our team is ready to assist you. How can we help you today?`,
      sender: 'bot',
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  };

  const handleSendMessage = async () => {
    // Redirect to handleSendToSupport - no AI, direct messaging only
    await handleSendToSupport();
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

  const handleSendToSupport = async () => {
    if (!inputMessage.trim() && !selectedFile) return;
    if (!guestName || !guestId) return;

    const messageText = inputMessage || '(Image attachment)';

    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsSendingToSupport(true);

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

      const response = await fetch('/api/messages/send-anonymous', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          attachment: attachmentBase64,
          guestName,
          guestId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Track the message ID so we can detect admin responses
        if (data.messageId) {
          setSentMessageIds(prev => new Set(prev).add(data.messageId));
        }

        const confirmationMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: `Message sent to our support team! We'll respond as soon as possible.`,
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, confirmationMessage]);
        handleRemoveFile();
      } else {
        throw new Error(data.error || `Failed to send message (${response.status})`);
      }
    } catch (error: any) {
      console.error('Error sending message to support:', error);
      let errorText = error.message || 'Failed to send message to support. Please try again.';

      // Check if error is related to file size
      if (errorText.toLowerCase().includes('payload') || errorText.toLowerCase().includes('size') || errorText.toLowerCase().includes('413')) {
        errorText = 'The file is too large. Please try a smaller image (under 4MB recommended).';
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: errorText,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSendingToSupport(false);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);

    // Only send typing indicator for authenticated users
    if (!guestId.startsWith('guest-')) {
      // Send typing indicator
      try {
        await fetch('/api/user/update-activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isTyping: true }),
        });
      } catch (error) {
        console.debug('Typing indicator failed:', error);
      }

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to stop typing indicator after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(async () => {
        try {
          await fetch('/api/user/update-activity', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isTyping: false }),
          });
        } catch (error) {
          console.debug('Stop typing indicator failed:', error);
        }
      }, 3000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();

      // Stop typing indicator when message is sent
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (!guestId.startsWith('guest-')) {
        fetch('/api/user/update-activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isTyping: false }),
        }).catch(console.debug);
      }
    }
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleNameSubmit();
    }
  };

  return (
    <>
      {/* Chat Button - smaller and better positioned on auth pages */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed bg-blue-900 hover:bg-blue-800 text-white rounded-full shadow-2xl transition-all hover:scale-110 z-50 ${
            isAuthPage
              ? 'bottom-4 right-4 p-3'
              : 'bottom-6 right-6 p-4'
          }`}
          aria-label="Open chat support"
          title="Need help? Chat with us"
        >
          <div className="relative">
            <MessageCircle className={isAuthPage ? 'w-5 h-5' : 'w-7 h-7'} />
            {/* Green online status dot */}
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-white shadow-lg"></span>
            </span>
          </div>
        </button>
      )}

      {/* Chat Window - adjusted for auth pages */}
      {isOpen && (
        <div className={`fixed bg-white shadow-2xl flex flex-col z-50 border border-gray-200 ${
          isAuthPage
            ? 'bottom-0 right-0 sm:bottom-4 sm:right-4 w-full sm:w-80 h-full sm:h-[500px] sm:rounded-xl'
            : 'bottom-0 right-0 sm:bottom-6 sm:right-6 w-full sm:w-96 h-full sm:h-[600px] sm:rounded-2xl'
        }`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">Support Assistant</h3>
                <p className="text-xs text-blue-100">Online 24/7</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/10 rounded-full p-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Name Form (shown when user hasn't provided name) */}
          {showNameForm ? (
            <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-gray-50 to-blue-50">
              <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-xl border border-gray-100">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-900 to-blue-800 rounded-full flex items-center justify-center mx-auto mb-6">
                  <User className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">
                  Welcome to {settings.bankName} Support
                </h3>
                <p className="text-sm text-gray-600 mb-6 text-center leading-relaxed">
                  Please tell us your name to continue chatting with our support team.
                </p>
                <input
                  ref={nameInputRef}
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={handleNameKeyDown}
                  placeholder="Enter your name..."
                  maxLength={50}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent text-sm mb-4 transition-all"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleNameSubmit}
                  disabled={!nameInput.trim()}
                  className="w-full px-6 py-3 bg-gradient-to-r from-blue-900 to-blue-800 text-white rounded-lg font-semibold hover:from-blue-800 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-900 disabled:hover:to-blue-800 shadow-md hover:shadow-lg"
                >
                  Start Chat
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`flex items-start space-x-2 max-w-[80%] ${
                        message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                      }`}
                    >
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          message.sender === 'user' ? 'bg-blue-900' : 'bg-gray-300'
                        }`}
                      >
                        {message.sender === 'user' ? (
                          <User className="w-4 h-4 text-white" />
                        ) : (
                          <Bot className="w-4 h-4 text-gray-700" />
                        )}
                      </div>
                      <div>
                        <div
                          className={`rounded-2xl px-4 py-2 ${
                            message.sender === 'user'
                              ? 'bg-blue-900 text-white'
                              : 'bg-white text-gray-800 border border-gray-200'
                          }`}
                        >
                          {/* Display attachment if present */}
                          {message.attachment && (
                            <div className="mb-2">
                              <img
                                src={message.attachment}
                                alt="Attachment"
                                className="rounded-lg max-w-full h-auto max-h-64 object-contain cursor-pointer hover:opacity-90 transition"
                                onClick={() => setLightboxImage(message.attachment!)}
                              />
                            </div>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 px-2">
                          {message.timestamp.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
                {/* File Preview - Enhanced visibility */}
                {previewUrl && (
                  <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-3">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-blue-500 flex-shrink-0">
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
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

                <div className="flex items-center gap-2">
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
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message to support..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-900 text-sm"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={(!inputMessage.trim() && !selectedFile) || isSendingToSupport}
                    className="bg-blue-900 hover:bg-blue-800 text-white rounded-full p-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Send message to support team"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                {selectedFile && (
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    Image attached: {selectedFile.name}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Image Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-[60] bg-black bg-opacity-90 flex items-center justify-center p-4"
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
    </>
  );
}
