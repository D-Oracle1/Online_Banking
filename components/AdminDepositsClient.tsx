'use client';

import { useState } from 'react';
import { Check, X, Eye, Clock, CheckCircle, XCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import ImageModal from './ImageModal';

interface Deposit {
  id: string;
  userId: string;
  accountId: string;
  amount: string;
  paymentMethod: string;
  paymentProof: string | null;
  status: string;
  notes: string | null;
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

interface AdminDepositsClientProps {
  deposits: Deposit[];
}

export default function AdminDepositsClient({ deposits: initialDeposits }: AdminDepositsClientProps) {
  const [deposits, setDeposits] = useState(initialDeposits);
  const [selectedDeposit, setSelectedDeposit] = useState<Deposit | null>(null);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const filteredDeposits = deposits.filter((d) => filter === 'ALL' || d.status === filter);

  const handleApprove = async (depositId: string) => {
    if (!confirm('Are you sure you want to approve this deposit?')) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/deposits/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ depositId }),
      });

      if (!response.ok) throw new Error('Failed to approve deposit');

      const data = await response.json();

      // Update local state
      setDeposits(deposits.map(d =>
        d.id === depositId ? { ...d, status: 'APPROVED' } : d
      ));

      alert('Deposit approved successfully!');
      setSelectedDeposit(null);
      window.location.reload();
    } catch (error: any) {
      alert(error.message || 'Failed to approve deposit');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (depositId: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/deposits/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ depositId, reason }),
      });

      if (!response.ok) throw new Error('Failed to reject deposit');

      // Update local state
      setDeposits(deposits.map(d =>
        d.id === depositId ? { ...d, status: 'REJECTED' } : d
      ));

      alert('Deposit rejected successfully!');
      setSelectedDeposit(null);
    } catch (error: any) {
      alert(error.message || 'Failed to reject deposit');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
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
              {status} ({deposits.filter((d) => status === 'ALL' || d.status === status).length})
            </button>
          ))}
        </div>
      </div>

      {/* Deposits Table */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
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
              {filteredDeposits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No deposits found
                  </td>
                </tr>
              ) : (
                filteredDeposits.map((deposit) => (
                  <tr key={deposit.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {deposit.user?.fullName || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">{deposit.user?.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                        {formatCurrency(deposit.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800">
                        {deposit.paymentMethod}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded ${
                          deposit.status === 'APPROVED'
                            ? 'bg-green-100 text-green-800'
                            : deposit.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {deposit.status === 'APPROVED' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {deposit.status === 'REJECTED' && <XCircle className="w-3 h-3 mr-1" />}
                        {deposit.status === 'PENDING' && <Clock className="w-3 h-3 mr-1" />}
                        {deposit.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(deposit.createdAt), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedDeposit(deposit)}
                          className="text-blue-600 hover:text-blue-800"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        {deposit.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApprove(deposit.id)}
                              disabled={isProcessing}
                              className="text-green-600 hover:text-green-800 disabled:opacity-50"
                              title="Approve"
                            >
                              <Check className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleReject(deposit.id)}
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

      {/* Deposit Details Modal */}
      {selectedDeposit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto">
            <div className="bg-blue-900 text-white p-6 rounded-t-2xl flex items-center justify-between">
              <h2 className="text-2xl font-bold">Deposit Details</h2>
              <button
                onClick={() => setSelectedDeposit(null)}
                className="hover:bg-white/10 rounded-full p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">User Name</label>
                  <p className="text-gray-900 font-semibold">{selectedDeposit.user?.fullName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="text-gray-900">{selectedDeposit.user?.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Account Number</label>
                  <p className="text-gray-900 font-mono">{selectedDeposit.account?.accountNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Balance</label>
                  <p className="text-gray-900 font-semibold">
                    {formatCurrency(selectedDeposit.account?.balance || 0)}
                  </p>
                </div>
              </div>

              {/* Deposit Info */}
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount</label>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(selectedDeposit.amount)}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                    <p className="text-gray-900">{selectedDeposit.paymentMethod}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span
                      className={`inline-block px-3 py-1 text-sm font-semibold rounded ${
                        selectedDeposit.status === 'APPROVED'
                          ? 'bg-green-100 text-green-800'
                          : selectedDeposit.status === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {selectedDeposit.status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date</label>
                    <p className="text-gray-900">
                      {format(new Date(selectedDeposit.createdAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>

                {selectedDeposit.notes && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded">{selectedDeposit.notes}</p>
                  </div>
                )}
              </div>

              {/* Payment Proof */}
              {selectedDeposit.paymentProof && (
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Proof
                  </label>
                  <div className="border rounded-lg overflow-hidden max-w-md mx-auto">
                    <img
                      src={selectedDeposit.paymentProof}
                      alt="Payment Proof"
                      className="w-full h-auto max-h-64 object-contain cursor-pointer hover:opacity-90 transition"
                      onClick={() => setViewingImage(selectedDeposit.paymentProof)}
                    />
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-2">Click image to view full size</p>
                </div>
              )}

              {/* Actions */}
              {selectedDeposit.status === 'PENDING' && (
                <div className="flex space-x-4 border-t pt-4">
                  <button
                    onClick={() => handleApprove(selectedDeposit.id)}
                    disabled={isProcessing}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Approve Deposit
                  </button>
                  <button
                    onClick={() => handleReject(selectedDeposit.id)}
                    disabled={isProcessing}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Reject Deposit
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {viewingImage && (
        <ImageModal
          imageUrl={viewingImage}
          alt="Payment Proof"
          onClose={() => setViewingImage(null)}
        />
      )}
    </div>
  );
}
