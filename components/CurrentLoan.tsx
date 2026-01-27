'use client';

import { useState } from 'react';
import { DollarSign, Calendar, Percent, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import LoanRepaymentMethods from './LoanRepaymentMethods';

interface Loan {
  id: string;
  amount: string;
  purpose: string;
  term: number;
  interestRate: string | null;
  totalRepayment: string | null;
  amountPaid: string;
  status: string;
  approvedAt: Date | null;
  createdAt: Date;
}

interface CurrentLoanProps {
  loan: Loan | null;
  accountBalance: string;
}

export default function CurrentLoan({ loan, accountBalance }: CurrentLoanProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');

  if (!loan) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 border border-gray-200 text-center">
        <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Loan</h3>
        <p className="text-gray-600">
          You don't have any active loans at the moment.
          <br />
          Contact support to apply for a loan.
        </p>
      </div>
    );
  }

  const loanAmount = parseFloat(loan.amount);
  const amountPaid = parseFloat(loan.amountPaid);
  const totalRepayment = loan.totalRepayment ? parseFloat(loan.totalRepayment) : loanAmount;
  const remainingBalance = totalRepayment - amountPaid;
  const progressPercentage = (amountPaid / totalRepayment) * 100;

  const StatusBadge = () => {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending Approval' },
      APPROVED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
      PAID: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Paid Off' },
    };

    const config = statusConfig[loan.status] || statusConfig.PENDING;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const isPaidOff = remainingBalance <= 0;
  const isApproved = loan.status === 'APPROVED';

  return (
    <div className="space-y-6">
      {/* Loan Overview */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Your Loan</h2>
          <StatusBadge />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Loan Amount */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              <DollarSign className="w-5 h-5 text-blue-900" />
              <span className="text-sm font-medium text-gray-700">Loan Amount</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">${loanAmount.toLocaleString()}</p>
          </div>

          {/* Total Repayment */}
          {loan.totalRepayment && (
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <CreditCard className="w-5 h-5 text-purple-900" />
                <span className="text-sm font-medium text-gray-700">Total Repayment</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">${totalRepayment.toLocaleString()}</p>
            </div>
          )}

          {/* Interest Rate */}
          {loan.interestRate && (
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <Percent className="w-5 h-5 text-green-900" />
                <span className="text-sm font-medium text-gray-700">Interest Rate</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{loan.interestRate}% APR</p>
            </div>
          )}

          {/* Loan Term */}
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-2">
              <Calendar className="w-5 h-5 text-orange-900" />
              <span className="text-sm font-medium text-gray-700">Loan Term</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{loan.term} months</p>
          </div>
        </div>

        {/* Loan Details */}
        <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-700">Purpose:</span>
            <span className="font-semibold text-gray-900">{loan.purpose}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Applied On:</span>
            <span className="font-semibold text-gray-900">
              {format(new Date(loan.createdAt), 'MMM dd, yyyy')}
            </span>
          </div>
          {loan.approvedAt && (
            <div className="flex justify-between">
              <span className="text-gray-700">Approved On:</span>
              <span className="font-semibold text-gray-900">
                {format(new Date(loan.approvedAt), 'MMM dd, yyyy')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Repayment Section - Only show if approved */}
      {isApproved && loan.totalRepayment && (
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Repayment Status</h3>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-700 mb-2">
              <span>Amount Paid: ${amountPaid.toLocaleString()}</span>
              <span>Remaining: ${remainingBalance.toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all ${
                  isPaidOff ? 'bg-green-600' : 'bg-blue-900'
                }`}
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              ></div>
            </div>
            <p className="text-center text-sm text-gray-600 mt-1">
              {progressPercentage.toFixed(1)}% paid
            </p>
          </div>

          {!isPaidOff ? (
            <LoanRepaymentMethods
              loanId={loan.id}
              remainingBalance={remainingBalance}
              accountBalance={accountBalance}
            />
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h4 className="text-lg font-semibold text-green-900 mb-2">Loan Paid Off!</h4>
              <p className="text-green-700">
                Congratulations! You have successfully paid off your loan.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
