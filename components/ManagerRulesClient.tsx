'use client';

import { useState } from 'react';
import { UserCog, UserPlus, X, Users, Eye } from 'lucide-react';
// Type-only import: the module itself is server code
import type { ManagerPermissionKey, ManagerPermissions } from '@/lib/manager-permissions';

interface Manager {
  id: string;
  fullName: string;
  email: string;
  permissions: ManagerPermissions;
}

interface Client {
  id: string;
  fullName: string;
  email: string;
  assignedManagerId: string | null;
}

interface ManagerRulesClientProps {
  managers: Manager[];
  clients: Client[];
}

const PERMISSION_OPTIONS: { key: ManagerPermissionKey; label: string; description: string; requires?: ManagerPermissionKey }[] = [
  { key: 'viewContactInfo', label: 'Contact details', description: 'Phone, address, date of birth, occupation and employer' },
  { key: 'viewAccounts', label: 'Accounts & balances', description: 'Account numbers, balances and activation status' },
  { key: 'viewTransactions', label: 'Transactions', description: 'The client’s recent transaction history' },
  { key: 'viewMessages', label: 'Read messages', description: 'Open the chat with the client and see the conversation' },
  { key: 'sendMessages', label: 'Send messages', description: 'Reply to the client in the chat', requires: 'viewMessages' },
  { key: 'deleteMessages', label: 'Delete messages', description: 'Unsend messages or delete the conversation (admins can restore)', requires: 'viewMessages' },
];

export default function ManagerRulesClient({ managers: initialManagers, clients: initialClients }: ManagerRulesClientProps) {
  const [managers, setManagers] = useState(initialManagers);
  const [clients, setClients] = useState(initialClients);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [assignTarget, setAssignTarget] = useState<Record<string, string>>({});

  const updatePermission = async (manager: Manager, key: ManagerPermissionKey, value: boolean) => {
    const next: ManagerPermissions = { ...manager.permissions, [key]: value };
    // Mirror the server rule: sending/deleting needs reading
    if (key === 'viewMessages' && !value) {
      next.sendMessages = false;
      next.deleteMessages = false;
    }

    const previous = manager.permissions;
    setManagers(prev => prev.map(m => (m.id === manager.id ? { ...m, permissions: next } : m)));
    setSavingKey(`${manager.id}-${key}`);

    try {
      const response = await fetch('/api/admin/managers/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ managerId: manager.id, permissions: next }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Failed to save');
      setManagers(prev => prev.map(m => (m.id === manager.id ? { ...m, permissions: data.permissions } : m)));
    } catch (error: any) {
      setManagers(prev => prev.map(m => (m.id === manager.id ? { ...m, permissions: previous } : m)));
      alert(error.message || 'Failed to save rule');
    } finally {
      setSavingKey(null);
    }
  };

  const assignClient = async (clientId: string, managerId: string | null) => {
    setSavingKey(`assign-${clientId}`);
    try {
      const response = await fetch('/api/admin/users/assign-manager', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: clientId, managerId }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Failed to update assignment');
      setClients(prev => prev.map(c => (c.id === clientId ? { ...c, assignedManagerId: managerId } : c)));
    } catch (error: any) {
      alert(error.message || 'Failed to update assignment');
    } finally {
      setSavingKey(null);
    }
  };

  if (managers.length === 0) {
    return (
      <div className="bg-white rounded-3xl shadow-sm p-12 text-center">
        <UserCog className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="font-semibold text-gray-700">No managers yet</p>
        <p className="text-sm text-gray-500 mt-1">
          Make a user a manager from <strong>Users Management</strong>, then set their rules here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {managers.map(manager => {
        const assigned = clients.filter(c => c.assignedManagerId === manager.id);
        const available = clients.filter(c => c.assignedManagerId !== manager.id);
        const selectedClient = assignTarget[manager.id] || '';

        return (
          <div key={manager.id} className="bg-white rounded-3xl shadow-sm overflow-hidden">
            <div className="px-4 md:px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-900 font-bold flex items-center justify-center flex-shrink-0">
                {manager.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">{manager.fullName}</p>
                <p className="text-sm text-gray-500 truncate">{manager.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
              {/* Rules */}
              <div className="p-4 md:p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">What this manager can see and do</h3>
                <p className="text-xs text-gray-500 mb-4 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> Always allowed: name, email, username and join date
                </p>
                <div className="space-y-3">
                  {PERMISSION_OPTIONS.map(option => {
                    const checked = manager.permissions[option.key];
                    const blocked = !!option.requires && !manager.permissions[option.requires];
                    const saving = savingKey === `${manager.id}-${option.key}`;

                    return (
                      <label
                        key={option.key}
                        className={`flex items-start justify-between gap-4 ${blocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-gray-900">{option.label}</span>
                          <span className="block text-xs text-gray-500">
                            {option.description}
                            {blocked && ' — turn on Read messages first'}
                          </span>
                        </span>
                        <span className="relative inline-flex flex-shrink-0 mt-0.5">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={checked}
                            disabled={blocked || saving}
                            onChange={e => updatePermission(manager, option.key, e.target.checked)}
                          />
                          <span className="w-11 h-6 rounded-full bg-gray-300 peer-checked:bg-green-600 peer-focus-visible:ring-2 peer-focus-visible:ring-gray-900 transition-colors" />
                          <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5" />
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Assigned clients */}
              <div className="p-4 md:p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Assigned clients ({assigned.length})
                </h3>

                {assigned.length === 0 ? (
                  <p className="text-sm text-gray-500 mb-4">No clients assigned yet.</p>
                ) : (
                  <ul className="space-y-2 mb-4">
                    {assigned.map(client => (
                      <li key={client.id} className="flex items-center justify-between gap-2 bg-gray-50 rounded-lg px-3 py-2">
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-gray-900 truncate">{client.fullName}</span>
                          <span className="block text-xs text-gray-500 truncate">{client.email}</span>
                        </span>
                        <button
                          onClick={() => assignClient(client.id, null)}
                          disabled={savingKey === `assign-${client.id}`}
                          className="text-gray-400 hover:text-red-600 p-1 disabled:opacity-50"
                          title="Unassign"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex gap-2">
                  <select
                    value={selectedClient}
                    onChange={e => setAssignTarget(prev => ({ ...prev, [manager.id]: e.target.value }))}
                    className="flex-1 min-w-0 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="">Assign a client…</option>
                    {available.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.fullName} ({client.email}){client.assignedManagerId ? ' — reassign' : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={async () => {
                      await assignClient(selectedClient, manager.id);
                      setAssignTarget(prev => ({ ...prev, [manager.id]: '' }));
                    }}
                    disabled={!selectedClient || savingKey === `assign-${selectedClient}`}
                    className="flex items-center gap-1 px-3 py-2 text-sm bg-gray-900 text-white rounded-full hover:bg-gray-700 disabled:opacity-50 flex-shrink-0"
                  >
                    <UserPlus className="w-4 h-4" />
                    Assign
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">Each client can have one manager; assigning moves them from any other manager.</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
