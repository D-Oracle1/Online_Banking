'use client';

import { useRef } from 'react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import { FileDown, Printer, X, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface Transaction {
  id: string;
  accountId: string;
  type: string;
  amount: string;
  status: string;
  description: string | null;
  recipientAccountNumber: string | null;
  recipientName?: string | null;
  createdAt: Date;
}

interface TransactionReceiptModalProps {
  transaction: Transaction;
  accountNumber: string;
  userName: string;
  onClose: () => void;
}

export default function TransactionReceiptModal({
  transaction,
  accountNumber,
  userName,
  onClose,
}: TransactionReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleSaveAsJPG = async () => {
    if (!receiptRef.current) return;

    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
      });

      const link = document.createElement('a');
      link.download = `receipt-${transaction.id}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      link.click();
    } catch (error) {
      console.error('Error saving as JPG:', error);
      alert('Failed to save receipt as JPG');
    }
  };

  const handleSaveAsPDF = async () => {
    if (!receiptRef.current) return;

    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`receipt-${transaction.id}.pdf`);
    } catch (error) {
      console.error('Error saving as PDF:', error);
      alert('Failed to save receipt as PDF');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 print-hide">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto my-auto">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-3 md:p-4 border-b border-gray-200 sticky top-0 bg-white z-10 print-hide">
          <h2 className="text-lg md:text-xl font-bold text-gray-900">Transaction Receipt</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveAsJPG}
              className="p-2 hover:bg-gray-100 rounded-full transition"
              title="Download as JPG"
            >
              <FileDown className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={handleSaveAsPDF}
              className="p-2 hover:bg-gray-100 rounded-full transition"
              title="Download as PDF"
            >
              <Download className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Receipt Content */}
        <div ref={receiptRef} className="p-4 md:p-5 bg-white print-receipt">
          {/* Bank Header */}
          <div className="text-center mb-4 pb-3 border-b-2 border-gray-200">
            <h3 className="text-xl md:text-2xl font-bold text-blue-900 mb-1">Sterling Capital Bank</h3>
            <p className="text-xs text-gray-600">Transaction Receipt</p>
            <p className="text-xs text-gray-500 mt-0.5">
              ID: {transaction.id.slice(0, 8).toUpperCase()}...{transaction.id.slice(-4).toLowerCase()}
            </p>
          </div>

          {/* Success Badge */}
          <div className="flex justify-center mb-4">
            <div
              className={`inline-flex items-center px-3 md:px-4 py-1.5 md:py-2 rounded-full ${
                transaction.status === 'SUCCESS'
                  ? 'bg-green-100 text-green-800'
                  : transaction.status === 'PENDING'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              <span className="text-lg md:text-xl mr-1.5">
                {transaction.status === 'SUCCESS' ? '✓' : transaction.status === 'PENDING' ? '⌛' : '✗'}
              </span>
              <span className="font-bold text-sm md:text-base">{transaction.status}</span>
            </div>
          </div>

          {/* Transaction Amount */}
          <div className="text-center mb-4">
            <p className="text-xs md:text-sm text-gray-600 mb-1">Amount</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-900">{formatCurrency(transaction.amount)}</p>
          </div>

          {/* Transaction Details */}
          <div className="space-y-1 mb-3">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-xs md:text-sm text-gray-600">Date & Time</span>
              <span className="text-xs md:text-sm font-semibold text-gray-900 text-right">
                {format(new Date(transaction.createdAt), 'dd MMM yyyy, hh:mm a')}
              </span>
            </div>

            <div className="py-2 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <span className="text-xs md:text-sm text-gray-600">From Account</span>
                <div className="text-right">
                  <p className="text-xs md:text-sm font-bold text-gray-900">{userName}</p>
                  <p className="text-xs text-gray-600">{accountNumber}</p>
                </div>
              </div>
            </div>

            {transaction.recipientAccountNumber && (
              <div className="py-2 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <span className="text-xs md:text-sm text-gray-600">To Account</span>
                  <div className="text-right">
                    {transaction.recipientName && (
                      <p className="text-xs md:text-sm font-bold text-gray-900">{transaction.recipientName}</p>
                    )}
                    <p className={`text-xs ${transaction.recipientName ? 'text-gray-600' : 'md:text-sm font-semibold text-gray-900'}`}>
                      {transaction.recipientAccountNumber}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-xs md:text-sm text-gray-600">Description</span>
              <span className="text-xs md:text-sm font-semibold text-gray-900 text-right">{transaction.description || 'No description'}</span>
            </div>

            <div className="flex justify-between py-2 border-b border-gray-200">
              <span className="text-xs md:text-sm text-gray-600">Transaction Type</span>
              <span className="text-xs md:text-sm font-semibold text-gray-900">{transaction.type}</span>
            </div>
          </div>

          {/* Footer Note */}
          <div className="bg-gray-50 p-2 rounded text-center">
            <p className="text-xs text-gray-600">
              Computer-generated receipt. © {new Date().getFullYear()} Sterling Capital Bank.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 p-4 bg-white print-hide">
          <button
            onClick={handlePrint}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition"
          >
            <Printer className="w-5 h-5 text-blue-600" />
            Print Receipt
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
