'use client';

import { useState, useEffect } from 'react';
import { Search, Eye, Users } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

interface ManagedUser {
  id: string;
  fullName: string;
  email: string;
  username: string;
  role: string;
  createdAt: string;
  accounts: Array<{
    id: string;
    accountNumber: string;
    balance: string;
    isActivated: boolean;
  }>;
}

export default function ManagerUsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);

  useEffect(() => {
    fetch('/api/manager/users')
      .then((r) => r.json())
      .then((d) => {
        setUsers(d.users || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Users</h1>
        <p className="text-gray-600 mt-1">{users.length} user{users.length !== 1 ? 's' : ''} assigned to you</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Account</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((user) => {
                const account = user.accounts[0];
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        <p className="text-xs text-gray-400">@{user.username}</p>
                      </div>
                    </td>
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
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">User Details</h2>
              <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Full Name</span><span className="font-semibold">{selectedUser.fullName}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Email</span><span className="font-semibold">{selectedUser.email}</span></div>
              <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Username</span><span className="font-semibold">@{selectedUser.username}</span></div>
              {selectedUser.accounts[0] && (
                <>
                  <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Account No.</span><span className="font-mono font-semibold">{selectedUser.accounts[0].accountNumber}</span></div>
                  <div className="flex justify-between py-2 border-b"><span className="text-gray-500">Balance</span><span className="font-bold text-gray-900">{formatCurrency(selectedUser.accounts[0].balance)}</span></div>
                  <div className="flex justify-between py-2"><span className="text-gray-500">Status</span><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${selectedUser.accounts[0].isActivated ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{selectedUser.accounts[0].isActivated ? 'Active' : 'Pending'}</span></div>
                </>
              )}
            </div>
            <button
              onClick={() => setSelectedUser(null)}
              className="w-full mt-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
