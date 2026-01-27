'use client';

import { useState } from 'react';
import { Check, X, Eye, Clock, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

interface LoanRepayment {
  id: string;
  loanId: string;
  amount: string;
  paymentMethod: string;
  paymentProof: string | null;
  status: string;
  createdAt: Date;
  loan: {
    id: string;
    userId: string;
    amount: string;
    purpose: string;
    totalRepayment: string | null;
    amountPaid: string;
  } | null;
  user: {
    id: string;
    fullName: string;
    email: string;
    username: string;
  } | null;
}

interface AdminLoanRepaymentsClientProps {
  repayments: LoanRepayment[];
}

export default function AdminLoanRepaymentsClient({ repayments: initialRepayments }: AdminLoanRepaymentsClientProps) {
  const [repayments, setRepayments] = useState(initialRepayments);
  const [selectedRepayment, setSelectedRepayment] = useState<LoanRepayment | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredRepayments = repayments.filter((r) => filter === 'ALL' || r.status === filter);

  const handleApprove = async (repaymentId: string) => {
    if (!confirm('Are you sure you want to approve this repayment?')) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/loan-repayments/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repaymentId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      // Update local state
      setRepayments(repayments.map(r =>
        r.id === repaymentId ? { ...r, status: 'APPROVED' } : r
      ));

      alert('Repayment approved successfully!');
      setSelectedRepayment(null);
      window.location.reload();
    } catch (error: any) {
      alert(error.message || 'Failed to approve repayment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (repaymentId: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/loan-repayments/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repaymentId, reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      // Update local state
      setRepayments(repayments.map(r =>
        r.id === repaymentId ? { ...r, status: 'REJECTED' } : r
      ));

      alert('Repayment rejected successfully!');
      setSelectedRepayment(null);
    } catch (error: any) {
      alert(error.message || 'Failed to reject repayment');
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculate statistics
  const totalPending = repayments.filter((r) => r.status === 'PENDING').length;
  const totalApproved = repayments.filter((r) => r.status === 'APPROVED').length;
  const totalRejected = repayments.filter((r) => r.status === 'REJECTED').length;
  const totalAmount = repayments
    .filter((r) => r.status === 'APPROVED')
    .reduce((sum, r) => sum + parseFloat(r.amount), 0);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Repayments</p>
              <p className="text-3xl font-bold text-gray-900">{repayments.length}</p>
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
              <p className="text-sm text-gray-600">Total Approved</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalAmount)}</p>
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
              {status} ({repayments.filter((r) => status === 'ALL' || r.status === status).length})
            </button>
          ))}
        </div>
      </div>

      {/* Repayments Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loan Purpose
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
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
              {filteredRepayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No loan repayments found
                  </td>
                </tr>
              ) : (
                filteredRepayments.map((repayment) => (
                  <tr key={repayment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {repayment.user?.fullName || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">{repayment.user?.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {repayment.loan?.purpose || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                        {formatCurrency(repayment.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                        {repayment.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded ${
                          repayment.status === 'APPROVED'
                            ? 'bg-green-100 text-green-800'
                            : repayment.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {repayment.status === 'APPROVED' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {repayment.status === 'REJECTED' && <XCircle className="w-3 h-3 mr-1" />}
                        {repayment.status === 'PENDING' && <Clock className="w-3 h-3 mr-1" />}
                        {repayment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(repayment.createdAt), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedRepayment(repayment)}
                          className="text-blue-600 hover:text-blue-800"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        {repayment.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApprove(repayment.id)}
                              disabled={isProcessing}
                              className="text-green-600 hover:text-green-800 disabled:opacity-50"
                              title="Approve"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleReject(repayment.id)}
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

      {/* Repayment Details Modal */}
      {selectedRepayment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-blue-900 text-white p-6 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-2xl font-bold">Loan Repayment Details</h2>
              <button
                onClick={() => setSelectedRepayment(null)}
                className="hover:bg-white/10 rounded-full p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* User Info */}
              <div>
                <h3 className="text-lg font-semibold mb-3">User Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">User Name</label>
                    <p className="text-gray-900 font-semibold">{selectedRepayment.user?.fullName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-900">{selectedRepayment.user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Loan Info */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">Loan Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Purpose</label>
                    <p className="text-gray-900">{selectedRepayment.loan?.purpose}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Loan Amount</label>
                    <p className="text-gray-900 font-semibold">
                      {formatCurrency(selectedRepayment.loan?.amount || 0)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Repayment</label>
                    <p className="text-gray-900 font-semibold">
                      {formatCurrency(selectedRepayment.loan?.totalRepayment || selectedRepayment.loan?.amount || 0)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount Paid</label>
                    <p className="text-gray-900 font-semibold">
                      {formatCurrency(selectedRepayment.loan?.amountPaid || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Repayment Info */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">Repayment Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Repayment Amount</label>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(selectedRepayment.amount)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                    <p className="text-gray-900">{selectedRepayment.paymentMethod}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span
                      className={`inline-block px-3 py-1 text-sm font-semibold rounded ${
                        selectedRepayment.status === 'APPROVED'
                          ? 'bg-green-100 text-green-800'
                          : selectedRepayment.status === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {selectedRepayment.status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <p className="text-gray-900">
                      {format(new Date(selectedRepayment.createdAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Proof */}
              {selectedRepayment.paymentProof && (
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Proof
                  </label>
                  <div className="border rounded-lg overflow-hidden">
                    <img
                      src={selectedRepayment.paymentProof}
                      alt="Payment Proof"
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              {selectedRepayment.status === 'PENDING' && (
                <div className="flex space-x-4 border-t pt-4">
                  <button
                    onClick={() => handleApprove(selectedRepayment.id)}
                    disabled={isProcessing}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Approve Repayment
                  </button>
                  <button
                    onClick={() => handleReject(selectedRepayment.id)}
                    disabled={isProcessing}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Reject Repayment
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
