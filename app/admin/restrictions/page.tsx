'use client';

import { useState } from 'react';
import { Search, ShieldAlert, Plus, Trash2, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface SearchResult {
  id: string;
  fullName: string;
  email: string;
  username: string;
}

interface Restriction {
  id: string;
  restrictionCode: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  clearedAt: string | null;
}

export default function AdminRestrictionsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<SearchResult | null>(null);
  const [restrictions, setRestrictions] = useState<Restriction[]>([]);
  const [loading, setLoading] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [adding, setAdding] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data.users || []);
    } finally {
      setLoading(false);
    }
  };

  const loadRestrictions = async (user: SearchResult) => {
    setSelectedUser(user);
    setSearchResults([]);
    setSearchQuery('');
    const res = await fetch(`/api/admin/users/restrictions?userId=${user.id}`);
    const data = await res.json();
    setRestrictions(data.restrictions || []);
  };

  const handleAddRestriction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newCode.trim() || !newDescription.trim()) return;
    setAdding(true);
    try {
      const res = await fetch('/api/admin/users/restrictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          restrictionCode: newCode.trim().toUpperCase(),
          description: newDescription.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Failed to add restriction');
        return;
      }
      setNewCode('');
      setNewDescription('');
      await loadRestrictions(selectedUser);
    } finally {
      setAdding(false);
    }
  };

  const handleClearRestriction = async (id: string) => {
    if (!confirm('Clear this restriction? The user will be able to transfer again.')) return;
    await fetch(`/api/admin/users/restrictions?id=${id}`, { method: 'DELETE' });
    if (selectedUser) await loadRestrictions(selectedUser);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Account Restrictions</h1>
        <p className="text-gray-600 mt-2">Create and manage AML restriction codes for users. Active restrictions are shown immediately after AML code verification.</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Find User</h2>
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by name, email, or username"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold px-6 py-3 rounded-lg flex items-center gap-2"
          >
            <Search className="w-5 h-5" />
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            {searchResults.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div>
                  <p className="font-semibold">{u.fullName}</p>
                  <p className="text-sm text-gray-500">{u.email}</p>
                </div>
                <button
                  onClick={() => loadRestrictions(u)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                >
                  Manage Restrictions
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Restriction management for selected user */}
      {selectedUser && (
        <>
          <div className="bg-white rounded-xl shadow-md border border-gray-200">
            <div className="bg-red-700 text-white p-5 rounded-t-xl flex items-center gap-3">
              <ShieldAlert className="w-6 h-6" />
              <div>
                <h2 className="text-lg font-bold">Restrictions for {selectedUser.fullName}</h2>
                <p className="text-red-200 text-sm">{selectedUser.email}</p>
              </div>
            </div>

            {/* Add new restriction */}
            <div className="p-6 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-red-600" />
                Add New Restriction
              </h3>
              <form onSubmit={handleAddRestriction} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Restriction Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                      placeholder="e.g. RC-7823 or TAX-HOLD"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono uppercase"
                    />
                    <p className="text-xs text-gray-500 mt-1">This code is shown to the user after AML verification</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description / Reason <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="e.g. Account under compliance review"
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">This message is displayed to the user</p>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={adding}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold px-6 py-2 rounded-lg flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {adding ? 'Adding...' : 'Add Restriction'}
                </button>
              </form>
            </div>

            {/* Restriction list */}
            <div className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Restriction History</h3>
              {restrictions.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <ShieldAlert className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No restrictions on this account</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {restrictions.map((r) => (
                    <div
                      key={r.id}
                      className={`border rounded-lg p-4 flex items-start justify-between ${r.isActive ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className={`text-sm font-mono font-bold px-2 py-0.5 rounded ${r.isActive ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-600'}`}>
                            {r.restrictionCode}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${r.isActive ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {r.isActive ? 'ACTIVE' : 'CLEARED'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{r.description}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Added {format(new Date(r.createdAt), 'MMM dd, yyyy HH:mm')}
                          {r.clearedAt && ` · Cleared ${format(new Date(r.clearedAt), 'MMM dd, yyyy HH:mm')}`}
                        </p>
                      </div>
                      {r.isActive && (
                        <button
                          onClick={() => handleClearRestriction(r.id)}
                          className="ml-4 text-green-600 hover:text-green-800 flex items-center gap-1 text-sm font-semibold"
                          title="Clear restriction"
                        >
                          <CheckCircle className="w-5 h-5" />
                          Clear
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
