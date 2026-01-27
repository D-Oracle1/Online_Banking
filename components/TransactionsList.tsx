'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Eye } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import TransactionReceiptModal from './TransactionReceiptModal';

interface Transaction {
  id: string;
  description: string | null;
  type: string;
  amount: string;
  status: string;
  recipientAccountNumber: string | null;
  recipientName?: string | null;
  createdAt: Date;
  accountId: string;
}

interface TransactionsListProps {
  transactions: Transaction[];
  accountNumber: string;
  userName: string;
}

export default function TransactionsList({ transactions, accountNumber, userName }: TransactionsListProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  const handleViewReceipt = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowReceiptModal(true);
  };

  const handleCloseReceipt = () => {
    setShowReceiptModal(false);
    setSelectedTransaction(null);
  };

  if (transactions.length === 0) {
    return <p className="text-gray-500 text-center py-6 md:py-8 text-sm md:text-base">No transactions yet</p>;
  }

  return (
    <>
      <div className="space-y-3">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="flex items-start sm:items-center justify-between p-3 md:p-4 bg-gray-50 rounded-lg gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 text-sm md:text-base truncate">{transaction.description || transaction.type}</p>
              <p className="text-xs md:text-sm text-gray-500 mt-1">
                {format(new Date(transaction.createdAt), 'dd MMM yyyy • hh:mm a')}
              </p>
            </div>
            <div className="text-right flex-shrink-0 flex items-center gap-2">
              <div>
                <p className="font-bold text-sm md:text-lg text-gray-900 whitespace-nowrap">{formatCurrency(transaction.amount)}</p>
                <span className={`inline-block px-2 py-1 text-xs font-semibold rounded mt-1 ${
                  transaction.status === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                  transaction.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {transaction.status}
                </span>
              </div>
              <button
                onClick={() => handleViewReceipt(transaction)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition ml-2"
                title="View Receipt"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Receipt Modal */}
      {showReceiptModal && selectedTransaction && (
        <TransactionReceiptModal
          transaction={selectedTransaction}
          accountNumber={accountNumber}
          userName={userName}
          onClose={handleCloseReceipt}
        />
      )}
    </>
  );
}
