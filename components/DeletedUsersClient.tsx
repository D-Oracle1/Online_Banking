'use client';

import { useState, useEffect } from 'react';
import { Search, RotateCcw, Trash2, UserX } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

interface DeletedUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  deletedAt: string;
  deletedByName: string | null;
  accounts: Array<{
    id: string;
    accountNumber: string;
    balance: string;
  }>;
}

interface DeletedUsersClientProps {
  users: DeletedUser[];
}

export default function DeletedUsersClient({ users: initialUsers }: DeletedUsersClientProps) {
  const [users, setUsers] = useState(initialUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  // Dates are formatted only after mount to avoid server/client timezone hydration mismatches
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const filteredUsers = users.filter(user => {
    const term = searchTerm.toLowerCase();
    return (
      user.fullName.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term) ||
      user.username.toLowerCase().includes(term) ||
      user.accounts.some(a => a.accountNumber.includes(term))
    );
  });

  const handleRestore = async (user: DeletedUser) => {
    if (!confirm(`Restore ${user.fullName}? Their account, transactions, cards and loans will be restored.`)) return;

    setProcessingId(user.id);
    try {
      const response = await fetch('/api/admin/restore/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      setUsers(prev => prev.filter(u => u.id !== user.id));
      alert(`${user.fullName} has been restored.`);
    } catch (error: any) {
      alert(error.message || 'Failed to restore user');
    } finally {
      setProcessingId(null);
    }
  };

  const handlePermanentDelete = async (user: DeletedUser) => {
    const confirmation = prompt(
      `PERMANENTLY delete ${user.fullName} (${user.email})?\n\n` +
      'This removes the user and ALL their data (accounts, transactions, cards, loans, messages). ' +
      'It cannot be undone.\n\nType "DELETE" to confirm:'
    );
    if (confirmation === null) return;
    if (confirmation !== 'DELETE') {
      alert('Deletion cancelled. You must type "DELETE" exactly to confirm.');
      return;
    }

    setProcessingId(user.id);
    try {
      const response = await fetch('/api/admin/users/permanent-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      setUsers(prev => prev.filter(u => u.id !== user.id));
      alert(`${user.fullName} has been permanently deleted. Their email and username can now be reused.`);
    } catch (error: any) {
      alert(error.message || 'Failed to permanently delete user');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDeletedAt = (iso: string) => (mounted ? format(new Date(iso), 'MMM d, yyyy h:mm a') : '');

  const ActionButtons = ({ user }: { user: DeletedUser }) => (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleRestore(user)}
        disabled={processingId === user.id}
        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        <RotateCcw className="w-4 h-4" />
        Restore
      </button>
      <button
        onClick={() => handlePermanentDelete(user)}
        disabled={processingId === user.id}
        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        Delete Forever
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, email, username or account number..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {filteredUsers.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-sm p-12 text-center">
          <UserX className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {users.length === 0 ? 'No deleted users.' : 'No deleted users match your search.'}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filteredUsers.map(user => (
              <div key={user.id} className="bg-white rounded-3xl shadow-sm p-4 space-y-3">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{user.fullName}</p>
                  <p className="text-sm text-gray-500 truncate">{user.email}</p>
                  <p className="text-xs text-gray-400 truncate">@{user.username}</p>
                </div>
                {user.accounts.map(a => (
                  <p key={a.id} className="text-sm text-gray-600">
                    {a.accountNumber} · {formatCurrency(parseFloat(a.balance))}
                  </p>
                ))}
                <p className="text-xs text-gray-500">
                  Deleted {formatDeletedAt(user.deletedAt)}
                  {user.deletedByName && ` by ${user.deletedByName}`}
                </p>
                <ActionButtons user={user} />
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-3xl shadow-sm overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deleted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{user.fullName}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <p className="text-xs text-gray-400">@{user.username}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.accounts.length === 0 ? '—' : user.accounts.map(a => (
                        <div key={a.id}>
                          {a.accountNumber}
                          <span className="text-gray-400"> · {formatCurrency(parseFloat(a.balance))}</span>
                        </div>
                      ))}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div>{formatDeletedAt(user.deletedAt)}</div>
                      {user.deletedByName && <div className="text-xs text-gray-400">by {user.deletedByName}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <ActionButtons user={user} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
