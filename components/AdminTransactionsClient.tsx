'use client';

import { useState } from 'react';
import {
  Search,
  ArrowDownCircle,
  ArrowUpCircle,
  DollarSign,
  Download,
  Filter,
  Calendar,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  accountId: string;
  type: string;
  amount: string;
  recipientAccount: string | null;
  description: string | null;
  status: string;
  createdAt: Date;
  account: {
    id: string;
    accountNumber: string;
    userId: string;
  } | null;
  user: {
    id: string;
    fullName: string;
    email: string;
    username: string;
  } | null;
}

interface AdminTransactionsClientProps {
  transactions: Transaction[];
}

export default function AdminTransactionsClient({
  transactions: initialTransactions,
}: AdminTransactionsClientProps) {
  const [transactions] = useState(initialTransactions);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER'>(
    'ALL'
  );
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'PENDING' | 'FAILED'>(
    'ALL'
  );

  const filteredTransactions = transactions.filter((txn) => {
    // Type filter
    const typeMatch = typeFilter === 'ALL' || txn.type === typeFilter;

    // Status filter
    const statusMatch = statusFilter === 'ALL' || txn.status === statusFilter;

    // Search filter
    const searchMatch =
      !searchTerm ||
      txn.user?.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.user?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.account?.accountNumber.includes(searchTerm) ||
      txn.recipientAccount?.includes(searchTerm) ||
      txn.description?.toLowerCase().includes(searchTerm.toLowerCase());

    return typeMatch && statusMatch && searchMatch;
  });

  // Calculate statistics
  const totalDeposits = transactions
    .filter((t) => t.type === 'DEPOSIT' && t.status === 'SUCCESS')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const totalWithdrawals = transactions
    .filter((t) => t.type === 'WITHDRAWAL' && t.status === 'SUCCESS')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const totalTransfers = transactions
    .filter((t) => t.type === 'TRANSFER' && t.status === 'SUCCESS')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const handleExport = () => {
    // Create CSV data
    const headers = [
      'Transaction ID',
      'Date',
      'User',
      'Account',
      'Type',
      'Amount',
      'Recipient',
      'Description',
      'Status',
    ];

    const csvData = filteredTransactions.map((txn) => [
      txn.id,
      format(new Date(txn.createdAt), 'yyyy-MM-dd HH:mm:ss'),
      txn.user?.fullName || 'N/A',
      txn.account?.accountNumber || 'N/A',
      txn.type,
      txn.amount,
      txn.recipientAccount || 'N/A',
      txn.description || 'N/A',
      txn.status,
    ]);

    const csv = [headers, ...csvData].map((row) => row.join(',')).join('\n');

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Transactions</p>
              <p className="text-3xl font-bold text-gray-900">{transactions.length}</p>
            </div>
            <DollarSign className="w-12 h-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Deposits</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalDeposits)}</p>
            </div>
            <ArrowDownCircle className="w-12 h-12 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Withdrawals</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalWithdrawals)}</p>
            </div>
            <ArrowUpCircle className="w-12 h-12 text-red-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Transfers</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalTransfers)}</p>
            </div>
            <ArrowUpCircle className="w-12 h-12 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900"
            >
              <option value="ALL">All Types</option>
              <option value="DEPOSIT">Deposits</option>
              <option value="WITHDRAWAL">Withdrawals</option>
              <option value="TRANSFER">Transfers</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900"
            >
              <option value="ALL">All Status</option>
              <option value="SUCCESS">Success</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>

            <button
              onClick={handleExport}
              className="flex items-center space-x-2 bg-blue-900 hover:bg-blue-800 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Download className="w-5 h-5" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No transactions found
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(txn.createdAt), 'MMM dd, yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {txn.user?.fullName || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          {txn.account?.accountNumber}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded ${
                          txn.type === 'DEPOSIT'
                            ? 'bg-green-100 text-green-800'
                            : txn.type === 'WITHDRAWAL'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {txn.type === 'DEPOSIT' && <ArrowDownCircle className="w-3 h-3 mr-1" />}
                        {txn.type === 'WITHDRAWAL' && <ArrowUpCircle className="w-3 h-3 mr-1" />}
                        {txn.type === 'TRANSFER' && <ArrowUpCircle className="w-3 h-3 mr-1" />}
                        {txn.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                        {formatCurrency(txn.amount)}
                      </div>
                      {txn.recipientAccount && (
                        <div className="text-xs text-gray-500">→ {txn.recipientAccount}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {txn.description || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                          txn.status === 'SUCCESS'
                            ? 'bg-green-100 text-green-800'
                            : txn.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {txn.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Info */}
      {filteredTransactions.length > 0 && (
        <div className="text-sm text-gray-600 text-center">
          Showing {filteredTransactions.length} of {transactions.length} transactions
        </div>
      )}
    </div>
  );
}
