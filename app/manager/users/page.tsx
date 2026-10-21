'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Eye, Users, MessageSquare, Lock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import LoadingLogo from '@/components/LoadingLogo';
import type { ManagerPermissions } from '@/lib/manager-permissions';

interface ManagedUser {
  id: string;
  fullName: string;
  email: string;
  username: string;
  profilePhoto: string | null;
  createdAt: string;
  // Only present when the manager's rules allow it
  contact?: {
    phoneNumber: string | null;
    dateOfBirth: string | null;
    gender: string | null;
    nationality: string | null;
    address: string | null;
    occupation: string | null;
    employer: string | null;
  };
  accounts?: Array<{
    id: string;
    accountNumber: string;
    accountType: string;
    balance: string;
    isActivated: boolean;
  }>;
}

interface Transaction {
  id: string;
  type: string;
  amount: string;
  status: string;
  description: string | null;
  createdAt: string;
}

const NO_PERMISSIONS: ManagerPermissions = {
  viewContactInfo: false,
  viewAccounts: false,
  viewTransactions: false,
  viewMessages: false,
  sendMessages: false,
  deleteMessages: false,
};

function DetailRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-100 gap-3 last:border-b-0">
      <span className="text-gray-500 flex-shrink-0">{label}</span>
      <span className={`font-semibold text-right break-words min-w-0 ${mono ? 'font-mono' : ''}`}>{value || '—'}</span>
    </div>
  );
}

export default function ManagerUsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [permissions, setPermissions] = useState<ManagerPermissions>(NO_PERMISSIONS);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [transactions, setTransactions] = useState<Transaction[] | null>(null);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/manager/users')
      .then((r) => r.json())
      .then((d) => {
        setUsers(d.users || []);
        setPermissions(d.permissions || NO_PERMISSIONS);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Load transactions when a client's details are opened (if allowed)
  useEffect(() => {
    setTransactions(null);
    setTransactionsError(null);
    if (!selectedUser || !permissions.viewTransactions) return;

    const controller = new AbortController();
    fetch(`/api/manager/users/${encodeURIComponent(selectedUser.id)}/transactions`, { signal: controller.signal })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Failed to load transactions');
        setTransactions(d.transactions);
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setTransactionsError(e.message);
      });
    return () => controller.abort();
  }, [selectedUser, permissions.viewTransactions]);

  const term = searchTerm.toLowerCase();
  const filtered = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.username.toLowerCase().includes(term)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingLogo message="Loading your users..." />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Users</h1>
        <p className="text-gray-600 mt-1 text-sm">{users.length} user{users.length !== 1 ? 's' : ''} assigned to you</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 text-sm"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Mobile card view */}
        <div className="md:hidden divide-y divide-gray-100">
          {filtered.map((user) => {
            const account = user.accounts?.[0];
            return (
              <div key={user.id} className="p-4 flex items-start justify-between gap-3">
                <div className="flex items-start space-x-3 min-w-0">
                  <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-700 font-semibold text-sm">{user.fullName[0]}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{user.fullName}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    <p className="text-xs text-gray-400">@{user.username}</p>
                    {account && (
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="text-sm font-bold text-gray-900">{formatCurrency(account.balance)}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${account.isActivated ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {account.isActivated ? 'Active' : 'Pending'}
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-1">Joined {format(new Date(user.createdAt), 'MMM dd, yyyy')}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(user)}
                  className="text-blue-600 hover:text-blue-800 flex-shrink-0 p-1"
                  title="View Details"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="p-12 text-center text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No users found</p>
            </div>
          )}
        </div>

        {/* Desktop table view */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                {permissions.viewContactInfo && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                )}
                {permissions.viewAccounts && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((user) => {
                const account = user.accounts?.[0];
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <p className="text-xs text-gray-400">@{user.username}</p>
                      </div>
                    </td>
                    {permissions.viewContactInfo && (
                      <td className="px-6 py-4 text-sm text-gray-700">{user.contact?.phoneNumber || '—'}</td>
                    )}
                    {permissions.viewAccounts && (
                      <>
                        <td className="px-6 py-4">
                          {account && <p className="text-sm font-mono text-gray-900">{account.accountNumber}</p>}
                        </td>
                        <td className="px-6 py-4">
                          {account && (
                            <p className="text-sm font-bold text-gray-900">{formatCurrency(account.balance)}</p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {account && (
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${account.isActivated ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                              {account.isActivated ? 'Active' : 'Pending'}
                            </span>
                          )}
                        </td>
                      </>
                    )}
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="text-blue-600 hover:text-blue-800"
                        title="View Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">No users found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User detail modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedUser(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">User Details</h2>
              <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            <div className="space-y-5 text-sm">
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Profile</h3>
                <DetailRow label="Full Name" value={selectedUser.fullName} />
                <DetailRow label="Email" value={<span className="break-all">{selectedUser.email}</span>} />
                <DetailRow label="Username" value={`@${selectedUser.username}`} />
                <DetailRow label="Joined" value={format(new Date(selectedUser.createdAt), 'MMM dd, yyyy')} />
              </section>

              {selectedUser.contact && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Contact details</h3>
                  <DetailRow label="Phone" value={selectedUser.contact.phoneNumber} />
                  <DetailRow label="Date of birth" value={selectedUser.contact.dateOfBirth} />
                  <DetailRow label="Gender" value={selectedUser.contact.gender} />
                  <DetailRow label="Nationality" value={selectedUser.contact.nationality} />
                  <DetailRow label="Address" value={selectedUser.contact.address} />
                  <DetailRow label="Occupation" value={selectedUser.contact.occupation} />
                  <DetailRow label="Employer" value={selectedUser.contact.employer} />
                </section>
              )}

              {selectedUser.accounts && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Accounts</h3>
                  {selectedUser.accounts.length === 0 && <p className="text-gray-500 py-2">No accounts.</p>}
                  {selectedUser.accounts.map((a) => (
                    <div key={a.id} className="py-2 border-b border-gray-100 last:border-b-0 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-mono font-semibold">{a.accountNumber}</p>
                        <p className="text-xs text-gray-500 capitalize">{a.accountType}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatCurrency(a.balance)}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${a.isActivated ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {a.isActivated ? 'Active' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  ))}
                </section>
              )}

              {permissions.viewTransactions && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Recent transactions</h3>
                  {transactionsError ? (
                    <p className="text-red-600 py-2">{transactionsError}</p>
                  ) : transactions === null ? (
                    <div className="flex items-center gap-2 py-3 text-gray-500">
                      <span className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                      Loading transactions…
                    </div>
                  ) : transactions.length === 0 ? (
                    <p className="text-gray-500 py-2">No transactions yet.</p>
                  ) : (
                    transactions.map((t) => (
                      <div key={t.id} className="py-2 border-b border-gray-100 last:border-b-0 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{t.description || t.type}</p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(t.createdAt), 'MMM dd, yyyy h:mm a')} · {t.status}
                          </p>
                        </div>
                        <p className="font-semibold text-gray-900 flex-shrink-0">{formatCurrency(t.amount)}</p>
                      </div>
                    ))
                  )}
                </section>
              )}

              {!permissions.viewContactInfo && !permissions.viewAccounts && !permissions.viewTransactions && (
                <p className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                  <Lock className="w-4 h-4 flex-shrink-0" />
                  You can only see this client&apos;s basic profile. An admin can give you more access.
                </p>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              {permissions.viewMessages && (
                <Link
                  href="/manager/messages"
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
                >
                  <MessageSquare className="w-4 h-4" />
                  Messages
                </Link>
              )}
              <button
                onClick={() => setSelectedUser(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
