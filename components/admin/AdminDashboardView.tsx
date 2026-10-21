import Link from 'next/link';
import { format } from 'date-fns';
import {
  ArrowUpRight, Plus, Search, Users, UserCheck, Clock, FileText, Banknote, MoreHorizontal, Bell,
  ChevronRight, CheckSquare, Square, ArrowDownLeft, TrendingUp, ArrowDownToLine,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { AdminOverview } from '@/server/admin-overview';
import AdminNotificationBadge from '@/components/AdminNotificationBadge';
import WeeklyActivityChart from '@/components/admin/WeeklyActivityChart';

const card = 'bg-white rounded-3xl p-5 md:p-6 shadow-sm';
const darkCard = 'bg-[#1c1c1c] text-white rounded-3xl p-5 md:p-6 shadow-sm';

const TYPE_LABELS: Record<string, string> = {
  DEPOSIT: 'Deposit',
  CREDIT: 'Credit',
  TRANSFER: 'Transfer',
  WITHDRAWAL: 'Withdrawal',
  DEBIT: 'Debit',
  LOAN_REPAYMENT: 'Loan repayment',
};

/** Small progress ring, like the ones on the design's cards */
function Ring({ value, size = 28, stroke = 3, track = '#e4e4e7', color = '#111111', label }: {
  value: number; size?: number; stroke?: number; track?: string; color?: string; label?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, value));
  return (
    <span className="relative inline-flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={`${clamped * c} ${c}`} strokeLinecap="round"
        />
      </svg>
      {label && <span className="absolute text-[9px] font-semibold">{label}</span>}
    </span>
  );
}

/** The admin overview dashboard, rendered from already-loaded data */
export default function AdminDashboardView({ admin, data }: { admin: { fullName: string }; data: AdminOverview }) {
  const firstName = admin.fullName.split(' ')[0] || admin.fullName;

  const activationRate = data.totalAccounts ? data.activeAccounts / data.totalAccounts : 0;
  const growth = data.newLastMonth
    ? Math.round(((data.newThisMonth - data.newLastMonth) / data.newLastMonth) * 100)
    : null;

  const todos = [
    {
      count: data.pendingDepositCount,
      todo: `Approve ${data.pendingDepositCount} deposit${data.pendingDepositCount === 1 ? '' : 's'}`,
      done: 'No deposits waiting',
      href: '/admin/deposits',
    },
    {
      count: data.pendingLoans,
      todo: `Review ${data.pendingLoans} loan application${data.pendingLoans === 1 ? '' : 's'}`,
      done: 'No loan applications waiting',
      href: '/admin/loans',
    },
    {
      count: data.unreadMessages,
      todo: `Reply to ${data.unreadMessages} unread message${data.unreadMessages === 1 ? '' : 's'}`,
      done: 'All messages read',
      href: '/admin/messages',
    },
    {
      count: data.usersToVerify,
      todo: `Verify ${data.usersToVerify} user${data.usersToVerify === 1 ? '' : 's'}`,
      done: 'No one waiting for verification',
      href: '/admin/user-verification',
    },
  ];
  const todosDone = todos.filter(t => t.count === 0).length;

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Greeting with page actions (not a fixed header) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Hi, {firstName}!</h1>
        <div className="flex items-center gap-2 md:gap-3">
          <Link
            href="/admin/users?create=1"
            className="flex items-center gap-2 h-11 px-5 rounded-full bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add user</span>
          </Link>
          <Link
            href="/admin/users"
            className="w-11 h-11 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-900 hover:bg-gray-50"
            title="Search users"
            aria-label="Search users"
          >
            <Search className="w-5 h-5" />
          </Link>
          <AdminNotificationBadge />
          <Link
            href="/admin/settings"
            className="w-11 h-11 rounded-full bg-gray-900 text-white flex items-center justify-center font-semibold"
            title={admin.fullName}
          >
            {firstName.charAt(0).toUpperCase()}
          </Link>
        </div>
      </div>

      {/* Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {/* Overall information */}
        <section className={`${darkCard} flex flex-col`}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Overall information</h2>
            <Link href="/admin/users" className="text-gray-400 hover:text-white" aria-label="Open Users Management">
              <ArrowUpRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="flex items-end gap-6 mt-5">
            <div className="flex items-end gap-2">
              <span className="text-4xl md:text-5xl font-semibold leading-none">{data.customers}</span>
              <span className="text-xs text-gray-400 leading-tight pb-1">customers<br />in total</span>
            </div>
            <div className="w-px h-10 bg-gray-700" />
            <div className="flex items-end gap-2">
              <span className="text-4xl md:text-5xl font-semibold leading-none">{data.pendingActivation}</span>
              <span className="text-xs text-gray-400 leading-tight pb-1">accounts<br />awaiting activation</span>
            </div>
          </div>

          <div className="mt-4">
            <div className="h-1.5 rounded-full bg-gray-700 overflow-hidden">
              <div className="h-full rounded-full bg-white" style={{ width: `${Math.round(activationRate * 100)}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {formatCurrency(data.totalBalance)} held across {data.totalAccounts} account{data.totalAccounts === 1 ? '' : 's'}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5 mt-auto pt-5">
            {[
              { value: data.activeAccounts, label: 'Active accounts', icon: UserCheck, href: '/admin/users', tone: 'bg-zinc-400 text-gray-900' },
              { value: data.pendingDepositCount, label: 'Pending deposits', icon: Clock, href: '/admin/deposits', tone: 'bg-white text-gray-900' },
              { value: data.pendingLoans, label: 'Pending loans', icon: FileText, href: '/admin/loans', tone: 'bg-white text-gray-900' },
            ].map(tile => (
              <Link key={tile.label} href={tile.href} className={`${tile.tone} rounded-2xl p-3 text-center hover:opacity-90 transition-opacity`}>
                <span className="mx-auto w-7 h-7 rounded-full border border-gray-900/20 flex items-center justify-center">
                  <tile.icon className="w-3.5 h-3.5" />
                </span>
                <p className="text-2xl font-semibold mt-1.5">{tile.value}</p>
                <p className="text-[11px] leading-tight text-gray-700">{tile.label}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Weekly activity */}
        <section className={`${card} flex flex-col`}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Weekly activity</h2>
            <Link href="/admin/transactions" className="text-gray-400 hover:text-gray-900" aria-label="Open Transactions">
              <ArrowUpRight className="w-5 h-5" />
            </Link>
          </div>
          <div className="flex-1">
            <WeeklyActivityChart week={data.week} />
          </div>
        </section>

        {/* This month */}
        <section className={`${card} flex flex-col md:col-span-2 xl:col-span-1`}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">This month</h2>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {growth === null ? (
              <><span className="font-semibold text-gray-900">{data.newThisMonth}</span> new customer{data.newThisMonth === 1 ? '' : 's'} this month</>
            ) : (
              <>
                <span className="font-semibold text-gray-900">{growth >= 0 ? '+' : ''}{growth}%</span> new customers compared to last month
              </>
            )}
          </p>

          <div className="flex items-center justify-between gap-4 my-5 flex-1">
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-gray-900" />Active accounts</li>
              <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-zinc-300" />Awaiting activation</li>
              <li className="flex items-center gap-2"><span className="w-2 h-2 rounded-full border border-gray-400" />{data.newThisMonth} joined this month</li>
            </ul>
            <div className="relative">
              <Ring value={activationRate} size={112} stroke={10} />
              <span className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-semibold text-gray-900">{Math.round(activationRate * 100)}%</span>
                <span className="text-[10px] text-gray-500">activated</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/users"
              className="w-11 h-11 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-gray-700"
              aria-label="Open Users Management"
            >
              <Users className="w-4 h-4" />
            </Link>
            <Link
              href="/admin/transactions"
              className="flex-1 flex items-center justify-center gap-2 h-11 rounded-full border border-gray-900 text-sm font-medium text-gray-900 hover:bg-gray-50"
            >
              View transactions
              <ArrowDownToLine className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* To-do */}
        <section className={card}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Today&apos;s to-do</h2>
            <Ring value={todosDone / todos.length} label={`${todosDone}/${todos.length}`} size={30} />
          </div>
          <ul className="space-y-3">
            {todos.map(t => (
              <li key={t.href}>
                <Link href={t.href} className="flex items-center gap-3 text-sm group">
                  {t.count === 0 ? (
                    <CheckSquare className="w-5 h-5 text-gray-900 flex-shrink-0" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-300 flex-shrink-0" />
                  )}
                  <span className={t.count === 0 ? 'text-gray-400 line-through' : 'text-gray-900 font-medium group-hover:underline'}>
                    {t.count === 0 ? t.done : t.todo}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Deposits awaiting review */}
        <section className="xl:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Deposits awaiting review ({data.pendingDepositCount})</h2>
            <Link href="/admin/deposits" className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {data.latestPendingDeposits.map((deposit, index) => (
              <Link
                key={deposit.id}
                href="/admin/deposits"
                className="relative bg-white rounded-3xl p-5 shadow-sm flex flex-col min-h-[170px] hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <Banknote className="w-6 h-6 text-gray-900" />
                  <MoreHorizontal className="w-5 h-5 text-gray-400" />
                </div>
                <p className="mt-4 font-semibold text-gray-900 leading-snug">
                  {deposit.userName || 'Unknown customer'} deposited {formatCurrency(deposit.amount)}
                </p>
                <p className="text-xs text-gray-500 mt-1 capitalize">via {deposit.paymentMethod.replace(/_/g, ' ').toLowerCase()}</p>
                <p className="text-xs text-gray-400 mt-auto pt-3">{format(new Date(deposit.createdAt), 'dd.MM.yyyy')}</p>
                {index === 0 ? (
                  <span className="absolute bottom-0 right-0 w-12 h-12 bg-gray-900 text-white rounded-tl-2xl flex items-center justify-center">
                    <Bell className="w-4 h-4" />
                  </span>
                ) : (
                  <Bell className="absolute bottom-5 right-5 w-4 h-4 text-gray-900" />
                )}
              </Link>
            ))}

            <Link
              href="/admin/deposits"
              className={`rounded-3xl border-2 border-dashed border-gray-400 flex items-center justify-center gap-2 min-h-[170px] text-sm font-medium text-gray-700 hover:bg-white/50 transition-colors ${
                data.latestPendingDeposits.length === 0 ? 'sm:col-span-3' : data.latestPendingDeposits.length === 1 ? 'sm:col-span-2' : ''
              }`}
            >
              {data.pendingDepositCount === 0 ? (
                'All deposits reviewed'
              ) : (
                <>
                  <ChevronRight className="w-4 h-4" />
                  Review {data.pendingDepositCount > 2 ? `all ${data.pendingDepositCount}` : 'deposits'}
                </>
              )}
            </Link>
          </div>
        </section>
      </div>

      {/* Recent transactions */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Recent transactions</h2>
          <Link href="/admin/transactions" className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900">
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        {data.recentTransactions.length === 0 ? (
          <div className={`${card} text-center text-sm text-gray-500`}>No transactions yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.recentTransactions.map(t => {
              const incoming = t.type === 'DEPOSIT' || t.type === 'CREDIT';
              return (
                <Link key={t.id} href="/admin/transactions" className={`${darkCard} hover:bg-black transition-colors`}>
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-semibold leading-snug line-clamp-1">{t.description || TYPE_LABELS[t.type] || t.type}</p>
                    <span className="w-8 h-8 rounded-full border border-gray-600 flex items-center justify-center flex-shrink-0">
                      {incoming ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </span>
                  </div>
                  <p className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${t.status === 'SUCCESS' ? 'bg-white' : 'bg-gray-500'}`} />
                    {t.status === 'SUCCESS' ? 'Completed' : t.status.charAt(0) + t.status.slice(1).toLowerCase()}
                  </p>
                  <p className="text-2xl font-semibold mt-4">{formatCurrency(t.amount)}</p>
                  <p className="text-xs text-gray-400 mt-1 truncate">
                    {TYPE_LABELS[t.type] || t.type} · {t.userName || 'Unknown customer'} · {format(new Date(t.createdAt), 'dd.MM.yyyy')}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
