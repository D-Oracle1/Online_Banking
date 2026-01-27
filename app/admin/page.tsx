import { requireAdmin } from '@/lib/admin';
import { db } from '@/server/db';
import { users, accounts, deposits, transactions } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { Users, DollarSign, ArrowLeftRight, Clock } from 'lucide-react';
import Link from 'next/link';

export default async function AdminOverviewPage() {
  await requireAdmin();

  // Get statistics
  const [allUsers, allAccounts, pendingDeposits, recentTransactions] = await Promise.all([
    db.select().from(users),
    db.select().from(accounts),
    db.select().from(deposits).where(eq(deposits.status, 'PENDING')),
    db.select().from(transactions).limit(10),
  ]);

  const totalBalance = allAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
  const activeAccounts = allAccounts.filter(acc => acc.isActivated).length;

  const stats = [
    {
      label: 'Total Users',
      value: allUsers.length,
      icon: Users,
      color: 'blue',
      href: '/admin/users',
    },
    {
      label: 'Active Accounts',
      value: activeAccounts,
      icon: DollarSign,
      color: 'green',
      href: '/admin/users',
    },
    {
      label: 'Pending Deposits',
      value: pendingDeposits.length,
      icon: Clock,
      color: 'yellow',
      href: '/admin/deposits',
    },
    {
      label: 'Total Balance',
      value: `$${totalBalance.toLocaleString()}`,
      icon: ArrowLeftRight,
      color: 'purple',
      href: '/admin/transactions',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600 mt-2">Monitor and manage your banking platform</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/admin/deposits"
          className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow"
        >
          <h3 className="font-semibold text-gray-900 mb-2">Approve Deposits</h3>
          <p className="text-sm text-gray-600">
            {pendingDeposits.length} deposit{pendingDeposits.length !== 1 ? 's' : ''} waiting for approval
          </p>
        </Link>

        <Link
          href="/admin/users"
          className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow"
        >
          <h3 className="font-semibold text-gray-900 mb-2">Manage Users</h3>
          <p className="text-sm text-gray-600">
            View and manage all user accounts
          </p>
        </Link>

        <Link
          href="/admin/messages"
          className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow"
        >
          <h3 className="font-semibold text-gray-900 mb-2">User Messages</h3>
          <p className="text-sm text-gray-600">
            Respond to customer support requests
          </p>
        </Link>
      </div>
    </div>
  );
}
