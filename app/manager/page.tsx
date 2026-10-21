import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Users, MessageSquare, UserCheck, Lock } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { getStaffContext } from '@/lib/manager-permissions';
import { getVisibleClients } from '@/server/manager-clients';

export const dynamic = 'force-dynamic';

export default async function ManagerDashboard() {
  const staff = await getStaffContext();
  if (!staff) redirect('/dashboard');

  const { permissions, isFullAdmin } = staff;

  // Admins see all users; managers see assigned users, trimmed to what their rules allow
  const clients = await getVisibleClients(staff);

  const totalBalance = clients.reduce(
    (sum, c) => sum + (c.accounts ?? []).reduce((s, a) => s + parseFloat(a.balance || '0'), 0),
    0
  );
  const activeAccounts = clients.filter(c => c.accounts?.some(a => a.isActivated)).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 break-words">Welcome, {staff.fullName}</h1>
        <p className="text-gray-600 mt-1 text-sm md:text-base">
          {isFullAdmin ? 'Viewing all users' : 'Viewing your assigned users'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Assigned Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{clients.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {permissions.viewAccounts ? (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Accounts</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{activeAccounts}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Balance (Managed)</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(totalBalance.toFixed(2))}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <span className="text-purple-600 font-bold text-lg">$</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-dashed border-gray-300 p-6 flex items-center gap-3 text-gray-500">
            <Lock className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">Account balances aren&apos;t enabled for you. Ask an admin if you need access.</p>
          </div>
        )}
      </div>

      {permissions.viewMessages && (
        <Link
          href="/manager/messages"
          className="flex items-center gap-3 bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:border-blue-300 transition-colors"
        >
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium text-gray-900">
            Open messages with your clients{!permissions.sendMessages && ' (read only)'}
          </span>
        </Link>
      )}

      {/* Recent users list */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Your Users</h2>
          <Link
            href="/manager/users"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View all
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {clients.slice(0, 5).map((u) => {
            const account = u.accounts?.[0];
            return (
              <div key={u.id} className="px-4 md:px-6 py-4 flex items-center justify-between gap-3">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-600 font-semibold text-sm">{u.fullName[0]}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{u.fullName}</p>
                    <p className="text-xs text-gray-500 truncate">{u.email}</p>
                  </div>
                </div>
                {permissions.viewAccounts && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {account ? formatCurrency(account.balance) : '—'}
                    </p>
                    {account && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${account.isActivated ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {account.isActivated ? 'Active' : 'Pending'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {clients.length === 0 && (
            <div className="px-6 py-12 text-center text-gray-400">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No users assigned to you yet.</p>
              <p className="text-xs mt-1">Contact an admin to get users assigned.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
