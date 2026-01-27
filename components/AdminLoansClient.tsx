'use client';

import { useState } from 'react';
import { Check, X, Eye, Clock, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

interface Loan {
  id: string;
  userId: string;
  amount: string;
  purpose: string;
  term: number;
  status: string;
  createdAt: Date;
  user: {
    id: string;
    fullName: string;
    email: string;
    username: string;
  } | null;
  account: {
    id: string;
    accountNumber: string;
    balance: string;
  } | null;
}

interface AdminLoansClientProps {
  loans: Loan[];
}

export default function AdminLoansClient({ loans: initialLoans }: AdminLoansClientProps) {
  const [loans, setLoans] = useState(initialLoans);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [isProcessing, setIsProcessing] = useState(false);
  const [interestRate, setInterestRate] = useState('5.0');

  const filteredLoans = loans.filter((loan) => filter === 'ALL' || loan.status === filter);

  const handleApproveLoan = async (loanId: string) => {
    const rate = prompt('Enter interest rate (%):', interestRate);
    if (!rate) return;

    const parsedRate = parseFloat(rate);
    if (isNaN(parsedRate) || parsedRate < 0 || parsedRate > 100) {
      alert('Invalid interest rate');
      return;
    }

    if (!confirm('Are you sure you want to approve this loan?')) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/loans/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loanId, interestRate: parsedRate }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      // Update local state
      setLoans(loans.map((loan) => (loan.id === loanId ? { ...loan, status: 'APPROVED' } : loan)));

      alert('Loan approved successfully!');
      setSelectedLoan(null);
      window.location.reload();
    } catch (error: any) {
      alert(error.message || 'Failed to approve loan');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectLoan = async (loanId: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/loans/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loanId, reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      // Update local state
      setLoans(loans.map((loan) => (loan.id === loanId ? { ...loan, status: 'REJECTED' } : loan)));

      alert('Loan rejected successfully!');
      setSelectedLoan(null);
    } catch (error: any) {
      alert(error.message || 'Failed to reject loan');
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate statistics
  const totalPending = loans.filter((l) => l.status === 'PENDING').length;
  const totalApproved = loans.filter((l) => l.status === 'APPROVED').length;
  const totalRejected = loans.filter((l) => l.status === 'REJECTED').length;
  const totalLoanAmount = loans
    .filter((l) => l.status === 'APPROVED')
    .reduce((sum, l) => sum + parseFloat(l.amount), 0);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Applications</p>
              <p className="text-3xl font-bold text-gray-900">{loans.length}</p>
            </div>
            <DollarSign className="w-12 h-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-yellow-600">{totalPending}</p>
            </div>
            <Clock className="w-12 h-12 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-3xl font-bold text-green-600">{totalApproved}</p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Disbursed</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalLoanAmount)}</p>
            </div>
            <DollarSign className="w-12 h-12 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
        <div className="flex space-x-2">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === status
                  ? 'bg-blue-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status} ({loans.filter((l) => status === 'ALL' || l.status === status).length})
            </button>
          ))}
        </div>
      </div>

      {/* Loans Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applicant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purpose
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Term
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No loan applications found
                  </td>
                </tr>
              ) : (
                filteredLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {loan.user?.fullName || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">{loan.user?.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                        {formatCurrency(loan.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">{loan.purpose}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {loan.term} months
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded ${
                          loan.status === 'APPROVED'
                            ? 'bg-green-100 text-green-800'
                            : loan.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {loan.status === 'APPROVED' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {loan.status === 'REJECTED' && <XCircle className="w-3 h-3 mr-1" />}
                        {loan.status === 'PENDING' && <Clock className="w-3 h-3 mr-1" />}
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(loan.createdAt), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedLoan(loan)}
                          className="text-blue-600 hover:text-blue-800"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        {loan.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApproveLoan(loan.id)}
                              disabled={isProcessing}
                              className="text-green-600 hover:text-green-800 disabled:opacity-50"
                              title="Approve"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleRejectLoan(loan.id)}
                              disabled={isProcessing}
                              className="text-red-600 hover:text-red-800 disabled:opacity-50"
                              title="Reject"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Loan Details Modal */}
      {selectedLoan && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-blue-900 text-white p-6 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-2xl font-bold">Loan Application Details</h2>
              <button
                onClick={() => setSelectedLoan(null)}
                className="hover:bg-white/10 rounded-full p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Applicant Info */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Applicant Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <p className="text-gray-900 font-semibold">{selectedLoan.user?.fullName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900">{selectedLoan.user?.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Account Number
                    </label>
                    <p className="text-gray-900 font-mono">
                      {selectedLoan.account?.accountNumber}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Current Balance
                    </label>
                    <p className="text-gray-900 font-semibold">
                      {formatCurrency(selectedLoan.account?.balance || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Loan Details */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">Loan Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Loan Amount</label>
                    <p className="text-3xl font-bold text-gray-900">
                      {formatCurrency(selectedLoan.amount)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Loan Term</label>
                    <p className="text-2xl font-semibold text-gray-900">
                      {selectedLoan.term} months
                    </p>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Purpose</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded">{selectedLoan.purpose}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span
                      className={`inline-block px-3 py-1 text-sm font-semibold rounded ${
                        selectedLoan.status === 'APPROVED'
                          ? 'bg-green-100 text-green-800'
                          : selectedLoan.status === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {selectedLoan.status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Application Date
                    </label>
                    <p className="text-gray-900">
                      {format(new Date(selectedLoan.createdAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {selectedLoan.status === 'PENDING' && (
                <div className="flex space-x-4 border-t pt-4">
                  <button
                    onClick={() => handleApproveLoan(selectedLoan.id)}
                    disabled={isProcessing}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Approve Loan
                  </button>
                  <button
                    onClick={() => handleRejectLoan(selectedLoan.id)}
                    disabled={isProcessing}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Reject Loan
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
