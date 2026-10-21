'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Combine, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
// Type-only import: the module itself is server code
import type { MergePlan } from '@/server/chat-merge';

/**
 * Admin tool: find people whose messages are split across several sender IDs
 * and combine each person's messages under one ID. Shows a preview first.
 */
export default function MergeDuplicateChats({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState<MergePlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [merging, setMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ groupsMerged: number; messagesMoved: number } | null>(null);

  const openPreview = async () => {
    setOpen(true);
    setPlan(null);
    setDone(null);
    setError(null);
    setLoading(true);
    try {
      const response = await fetch('/api/admin/chat/merge-duplicates');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to find duplicate chats');
      setPlan(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const runMerge = async () => {
    setMerging(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/chat/merge-duplicates', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to merge chats');
      setDone(data);
      router.refresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setMerging(false);
    }
  };

  const totalMessages = plan?.groups.reduce((sum, g) => sum + g.messagesToMove, 0) ?? 0;

  return (
    <>
      {compact ? (
        // Icon button for the blue chat header
        <button
          onClick={openPreview}
          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          title="Merge duplicate chats"
          aria-label="Merge duplicate chats"
        >
          <Combine className="w-4 h-4 text-white" />
        </button>
      ) : (
        <button
          onClick={openPreview}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <Combine className="w-4 h-4" />
          Merge duplicate chats
        </button>
      )}

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => !merging && setOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Merge duplicate chats</h2>
              <button onClick={() => setOpen(false)} disabled={merging} className="text-gray-400 hover:text-gray-600 disabled:opacity-50">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 text-sm">
              {loading && (
                <div className="flex items-center gap-2 text-gray-500 py-6 justify-center">
                  <span className="w-5 h-5 rounded-full border-2 border-gray-900 border-t-transparent animate-spin" />
                  Looking for people with split chats…
                </div>
              )}

              {error && (
                <p className="text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
              )}

              {done && (
                <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-green-800">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p>
                    Merged {done.groupsMerged} {done.groupsMerged === 1 ? 'person' : 'people'}: {done.messagesMoved} message
                    {done.messagesMoved === 1 ? '' : 's'} combined. Each person now has a single chat in date order.
                  </p>
                </div>
              )}

              {plan && !done && (
                <>
                  {plan.groups.length === 0 ? (
                    <p className="text-gray-600 py-4 text-center">No split chats found — everyone already has a single chat.</p>
                  ) : (
                    <>
                      <p className="text-gray-700">
                        {plan.groups.length} {plan.groups.length === 1 ? 'person has' : 'people have'} messages split across
                        several chats. Merging moves {totalMessages} message{totalMessages === 1 ? '' : 's'} so each person has one
                        chat, sorted by date and time. Messages are not changed or deleted.
                      </p>
                      <ul className="space-y-2">
                        {plan.groups.map((group) => (
                          <li key={group.target.id} className="border border-gray-200 rounded-lg px-3 py-2">
                            <p className="font-semibold text-gray-900">{group.name}</p>
                            <p className="text-xs text-gray-500">
                              {group.sources.length + 1} chats → 1 · keeping{' '}
                              {group.target.isRegistered ? 'their registered account' : 'their most recent guest chat'}
                              {' '}· {group.messagesToMove} message{group.messagesToMove === 1 ? '' : 's'} to move
                              {' '}· last message {format(new Date(group.target.lastAt), 'MMM d, yyyy')}
                            </p>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  {plan.skipped.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-amber-800">
                      <p className="flex items-center gap-2 font-medium">
                        <AlertTriangle className="w-4 h-4" /> Not merged — more than one registered account with this name
                      </p>
                      <p className="text-xs mt-1">
                        {plan.skipped.map(s => s.name).join(', ')}. These are probably different people, so their chats are left as they are.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="px-6 py-4 border-t flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                disabled={merging}
                className="px-4 py-2 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50"
              >
                {done ? 'Close' : 'Cancel'}
              </button>
              {plan && !done && plan.groups.length > 0 && (
                <button
                  onClick={runMerge}
                  disabled={merging}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gray-900 text-white hover:bg-gray-700 rounded-full disabled:opacity-50"
                >
                  {merging && <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />}
                  {merging ? 'Merging…' : `Merge ${plan.groups.length} ${plan.groups.length === 1 ? 'person' : 'people'}`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
