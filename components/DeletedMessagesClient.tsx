'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, RotateCcw, Trash2, MessageSquareDashed, ChevronDown, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';

interface DeletedMessage {
  id: string;
  userId: string;
  userName: string;
  userEmail: string | null;
  isGuest: boolean;
  message: string;
  attachment: string | null;
  senderType: 'user' | 'admin';
  createdAt: string;
  deletedAt: string;
  deletedByName: string | null;
}

interface DeletedMessagesClientProps {
  messages: DeletedMessage[];
  limitReached: boolean;
}

interface ConversationGroup {
  key: string;
  /** Every sender ID in this chat (same person across guest sessions / account) */
  memberIds: string[];
  userName: string;
  userEmail: string | null;
  isGuest: boolean;
  lastDeletedAt: string;
  messages: DeletedMessage[];
}

export default function DeletedMessagesClient({ messages: initialMessages, limitReached }: DeletedMessagesClientProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [searchTerm, setSearchTerm] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [processingKey, setProcessingKey] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  // Dates are formatted only after mount to avoid server/client timezone hydration mismatches
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // One entry per person, matching the chat inbox: same name = same chat
  const groups = useMemo(() => {
    const byUser = new Map<string, ConversationGroup>();
    for (const msg of messages) {
      const name = msg.userName.trim().replace(/\s+/g, ' ').toLowerCase();
      const key = name && name !== 'guest user' ? `name:${name}` : `id:${msg.userId}`;
      let group = byUser.get(key);
      if (!group) {
        group = {
          key,
          memberIds: [],
          userName: msg.userName,
          userEmail: msg.userEmail,
          isGuest: msg.isGuest,
          lastDeletedAt: msg.deletedAt,
          messages: [],
        };
        byUser.set(key, group);
      }
      if (!group.memberIds.includes(msg.userId)) group.memberIds.push(msg.userId);
      // Prefer a registered account's details over a guest's
      if (group.isGuest && !msg.isGuest) {
        group.userName = msg.userName;
        group.userEmail = msg.userEmail;
        group.isGuest = false;
      }
      group.messages.push(msg);
    }
    // Messages oldest first within a conversation, like the chat itself
    for (const group of byUser.values()) {
      group.messages.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }
    return [...byUser.values()];
  }, [messages]);

  const filteredGroups = groups.filter(group => {
    const term = searchTerm.toLowerCase();
    if (!term) return true;
    return (
      group.userName.toLowerCase().includes(term) ||
      group.userEmail?.toLowerCase().includes(term) ||
      group.messages.some(m => m.message.toLowerCase().includes(term))
    );
  });

  const formatDate = (iso: string, pattern = 'MMM d, yyyy h:mm a') => (mounted ? format(new Date(iso), pattern) : '');

  const removeFromList = (ids: string[]) => {
    const idSet = new Set(ids);
    setMessages(prev => prev.filter(m => !idSet.has(m.id)));
  };

  const callApi = async (url: string, body: object) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Request failed');
    return data;
  };

  const handleRestore = async (ids: string[], key: string, userIds?: string[]) => {
    setProcessingKey(key);
    try {
      await callApi('/api/admin/restore/message', userIds ? { userIds } : { messageIds: ids });
      removeFromList(ids);
    } catch (error: any) {
      alert(error.message || 'Failed to restore');
    } finally {
      setProcessingKey(null);
    }
  };

  const handlePermanentDelete = async (ids: string[], key: string, label: string, userIds?: string[]) => {
    if (!confirm(`Permanently delete ${label}? This cannot be undone.`)) return;

    setProcessingKey(key);
    try {
      await callApi('/api/admin/messages/permanent-delete', userIds ? { userIds } : { messageIds: ids });
      removeFromList(ids);
    } catch (error: any) {
      alert(error.message || 'Failed to delete');
    } finally {
      setProcessingKey(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, email or message text..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
      </div>

      {limitReached && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
          Showing the {initialMessages.length} most recently deleted messages. Restore or delete some to see older ones.
        </p>
      )}

      {filteredGroups.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm p-12 text-center">
          <MessageSquareDashed className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {messages.length === 0 ? 'No deleted messages.' : 'No deleted messages match your search.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGroups.map(group => {
            const ids = group.messages.map(m => m.id);
            const isOpen = expanded === group.key;
            const groupKey = `group-${group.key}`;
            const count = group.messages.length;

            return (
              <div key={group.key} className="bg-white rounded-3xl shadow-sm overflow-hidden">
                <div className="p-4 flex flex-col md:flex-row md:items-center gap-3">
                  <button
                    onClick={() => setExpanded(isOpen ? null : group.key)}
                    className="flex-1 min-w-0 flex items-center gap-3 text-left"
                  >
                    <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-br from-gray-700 to-gray-700 flex items-center justify-center text-white font-bold">
                      {group.userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 truncate">
                        {group.userName}
                        {group.isGuest && <span className="ml-2 text-xs font-normal text-gray-400">Guest</span>}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {count} deleted message{count === 1 ? '' : 's'}
                        {mounted && ` · last deleted ${formatDate(group.lastDeletedAt)}`}
                      </p>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleRestore(ids, groupKey, group.memberIds)}
                      disabled={processingKey !== null}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      {processingKey === groupKey ? 'Working…' : count === 1 ? 'Restore' : 'Restore all'}
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(ids, groupKey, `${count} message${count === 1 ? '' : 's'} from ${group.userName}`, group.memberIds)}
                      disabled={processingKey !== null}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete forever
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
                    {group.messages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}>
                        <div className="max-w-[85%] md:max-w-[70%]">
                          <div
                            className={`rounded-2xl p-3 text-sm shadow-sm ${
                              msg.senderType === 'admin'
                                ? 'bg-green-600 text-white rounded-tr-sm'
                                : 'bg-white border border-gray-200 text-gray-900 rounded-tl-sm'
                            }`}
                          >
                            {msg.message && <p className="whitespace-pre-wrap break-words">{msg.message}</p>}
                            {msg.attachment && (
                              <button onClick={() => setLightboxImage(msg.attachment)} className={msg.message ? 'mt-2 block' : 'block'}>
                                <img
                                  src={msg.attachment}
                                  alt="Attachment"
                                  loading="lazy"
                                  className="max-w-[200px] max-h-[200px] object-cover rounded-lg"
                                />
                              </button>
                            )}
                            {!msg.message && !msg.attachment && (
                              <p className="italic opacity-70 flex items-center gap-1"><ImageIcon className="w-3 h-3" /> (empty)</p>
                            )}
                          </div>
                          <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-gray-500 ${msg.senderType === 'admin' ? 'justify-end' : ''}`}>
                            <span>{msg.senderType === 'admin' ? 'Support' : group.userName} · sent {formatDate(msg.createdAt, 'MMM d, h:mm a')}</span>
                            <span>
                              deleted {formatDate(msg.deletedAt, 'MMM d, h:mm a')}
                              {msg.deletedByName && ` by ${msg.deletedByName}`}
                            </span>
                            <button
                              onClick={() => handleRestore([msg.id], msg.id)}
                              disabled={processingKey !== null}
                              className="text-green-700 hover:underline font-medium disabled:opacity-50"
                            >
                              {processingKey === msg.id ? 'Restoring…' : 'Restore'}
                            </button>
                            <button
                              onClick={() => handlePermanentDelete([msg.id], msg.id, 'this message')}
                              disabled={processingKey !== null}
                              className="text-red-600 hover:underline font-medium disabled:opacity-50"
                            >
                              Delete forever
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <img
            src={lightboxImage}
            alt="Full size view"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
