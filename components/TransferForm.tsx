'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, MapPin, User, Hash, DollarSign, CheckCircle2, Printer, X } from 'lucide-react';

interface TransferData {
  bankName: string;
  bankAddress: string;
  receiverName: string;
  accountNumber: string;
  routingNumber: string;
  amount: string;
  senderAccount: string;
}

interface PendingTransferData {
  transactionId: string;
  recipientAccountNumber: string;
  amount: string;
  senderAccountId: string;
  recipientAccountId: string | null;
}

export default function TransferForm({ availableBalance, accountNumber }: { availableBalance: string; accountNumber: string }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [transferData, setTransferData] = useState<TransferData>({
    bankName: '',
    bankAddress: '',
    receiverName: '',
    accountNumber: '',
    routingNumber: '',
    amount: '',
    senderAccount: accountNumber,
  });
  const [showIMFModal, setShowIMFModal] = useState(false);
  const [imfCode, setImfCode] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [transactionRef, setTransactionRef] = useState('');
  const [transactionPin, setTransactionPin] = useState('');
  const [pendingTransfer, setPendingTransfer] = useState<PendingTransferData | null>(null);
  const router = useRouter();

  const handleInputChange = (field: keyof TransferData, value: string) => {
    setTransferData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitDetails = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2); // Move to summary step
  };

  const handleTransfer = async () => {
    if (!transactionPin || transactionPin.length !== 4) {
      alert('Please enter your 4-digit transaction PIN');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientAccountNumber: transferData.accountNumber,
          amount: parseFloat(transferData.amount),
          pin: transactionPin,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Transfer failed');
      }

      // Store pending transfer data
      setPendingTransfer({
        transactionId: data.transactionId,
        recipientAccountNumber: data.recipientAccountNumber,
        amount: data.amount,
        senderAccountId: data.senderAccountId,
        recipientAccountId: data.recipientAccountId,
      });

      // Set transaction reference for display
      setTransactionRef(data.transactionId);

      // Show AML Protection modal WITHOUT debiting account yet
      setShowIMFModal(true);
      setLoading(false);
    } catch (error: any) {
      alert(error.message || 'Transfer failed');
      setLoading(false);
    }
  };

  const handleIMFSubmit = async () => {
    if (!imfCode) {
      alert('Please enter AML Protection Code');
      return;
    }

    // Check if code is correct (only accessible to admin: 004211)
    if (imfCode !== '004211') {
      alert('Invalid AML Protection Code. Please contact support to obtain the code.');
      return;
    }

    if (!pendingTransfer) {
      alert('Transfer data not found. Please try again.');
      return;
    }

    setLoading(true);

    try {
      // Complete the transfer - NOW debit the account
      const completeResponse = await fetch('/api/transfer/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pendingTransfer),
      });

      if (!completeResponse.ok) {
        const errorData = await completeResponse.json();
        throw new Error(errorData.error || 'Failed to complete transfer');
      }

      // Code is correct and transfer completed, show success modal
      setShowIMFModal(false);
      setShowSuccessModal(true);

      // Send transaction alert emails after success modal is shown
      try {
        await fetch('/api/transfer/send-alert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transactionId: transactionRef,
            recipientAccountNumber: transferData.accountNumber,
            amount: transferData.amount,
          }),
        });
      } catch (error) {
        console.error('Failed to send alert emails:', error);
        // Don't show error to user as transaction is already complete
      }
    } catch (error: any) {
      alert(error.message || 'Failed to complete transfer');
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    router.push('/dashboard/transfer-history');
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  // Step 1: Transfer Form
  if (step === 1) {
    return (
      <div className="max-w-5xl mx-auto px-3 md:px-4">
        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 px-4 py-4 md:px-8 md:py-6">
            <h2 className="text-xl md:text-3xl font-bold text-white flex items-center gap-2 md:gap-3">
              <Building2 className="w-6 h-6 md:w-8 md:h-8" />
              Bank Transfer
            </h2>
            <p className="text-blue-100 text-xs md:text-sm mt-1 md:mt-2">Send money securely to any bank account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmitDetails} className="p-4 md:p-8">
            {/* Info Banner */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 md:p-4 mb-6 md:mb-8 rounded-r-lg">
              <p className="text-blue-900 font-medium flex items-center gap-2 text-sm md:text-base">
                <span className="text-lg md:text-xl">ℹ️</span>
                Please ensure all fields are filled correctly before proceeding
              </p>
            </div>

            {/* Recipient Information */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-gray-200">
                Recipient Information
              </h3>

              <div className="space-y-5">
                {/* Receiver's Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    Recipient Name
                  </label>
                  <input
                    type="text"
                    value={transferData.receiverName}
                    onChange={(e) => handleInputChange('receiverName', e.target.value)}
                    required
                    className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Enter recipient's full name"
                  />
                </div>

                {/* Bank Information Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={transferData.bankName}
                      onChange={(e) => handleInputChange('bankName', e.target.value)}
                      required
                      className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Enter bank name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      Bank Address
                    </label>
                    <input
                      type="text"
                      value={transferData.bankAddress}
                      onChange={(e) => handleInputChange('bankAddress', e.target.value)}
                      required
                      className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      placeholder="Enter bank address"
                    />
                  </div>
                </div>

                {/* Account Details Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Hash className="w-4 h-4 text-blue-600" />
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={transferData.accountNumber}
                      onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                      required
                      className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                      placeholder="Enter account number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Hash className="w-4 h-4 text-blue-600" />
                      Swift/ABA Routing Number
                    </label>
                    <input
                      type="text"
                      value={transferData.routingNumber}
                      onChange={(e) => handleInputChange('routingNumber', e.target.value)}
                      required
                      className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-mono"
                      placeholder="Enter routing number"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Transfer Details */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-gray-200">
                Transfer Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Amount */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    Transfer Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg font-semibold">$</span>
                    <input
                      type="number"
                      value={transferData.amount}
                      onChange={(e) => handleInputChange('amount', e.target.value)}
                      min="0.01"
                      step="0.01"
                      required
                      className="w-full pl-8 pr-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-lg font-semibold"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Sender's Account */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Hash className="w-4 h-4 text-blue-600" />
                    From Account
                  </label>
                  <select
                    value={transferData.senderAccount}
                    onChange={(e) => handleInputChange('senderAccount', e.target.value)}
                    className="w-full px-4 py-3.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white font-mono"
                    required
                  >
                    <option value={accountNumber}>{accountNumber}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Balance Display */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 p-4 md:p-6 rounded-xl mb-6 md:mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-green-800 font-medium mb-1">Available Balance</p>
                  <p className="text-xl md:text-3xl font-bold text-green-600">
                    ${parseFloat(availableBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="w-12 h-12 md:w-16 md:h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 md:py-4 px-8 md:px-12 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 text-sm md:text-base"
              >
                Continue to Review
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Step 2: Transaction Summary (or Success Modal if complete)
  if (step === 2 && !showSuccessModal) {
    return (
      <div className="max-w-4xl mx-auto px-3 md:px-0">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-4 py-3 md:px-6 md:py-4">
            <h2 className="text-lg md:text-2xl font-bold text-white">INITIATE BANK TRANSFER</h2>
            <p className="text-blue-100 text-xs md:text-sm mt-1">Dashboard / Bank Transfer</p>
          </div>

          <div className="p-4 md:p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Transaction Summary</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Building2 className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Bank Name</p>
                    <p className="font-semibold text-gray-900">{transferData.bankName}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Hash className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Account Number</p>
                    <p className="font-semibold text-gray-900">{transferData.accountNumber}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Hash className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Swift Code</p>
                    <p className="font-semibold text-gray-900">{transferData.routingNumber}</p>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <MapPin className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Bank Address</p>
                    <p className="font-semibold text-gray-900">{transferData.bankAddress}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <User className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Account Name</p>
                    <p className="font-semibold text-gray-900">{transferData.receiverName}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <DollarSign className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Amount</p>
                    <p className="font-semibold text-gray-900 text-xl">${parseFloat(transferData.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Password Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-900 font-medium">Enter your password and proceed to transfer.</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter 4-Digit Transaction PIN
              </label>
              <input
                type="password"
                value={transactionPin}
                onChange={(e) => setTransactionPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
                maxLength={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Enter the 4-digit PIN you set up for transactions</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:space-x-4 sm:gap-0">
              <button
                onClick={() => setStep(1)}
                className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition text-sm md:text-base"
              >
                Back
              </button>
              <button
                onClick={handleTransfer}
                disabled={loading}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg transition duration-200 text-sm md:text-base"
              >
                {loading ? 'Processing...' : 'Transfer'}
              </button>
            </div>
          </div>
        </div>

        {/* IMF Modal */}
        {showIMFModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
              <button
                onClick={() => setShowIMFModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Anti Money Laundering Protection</h3>
                <p className="text-sm text-gray-600 mt-2">
                  For your security, this transfer requires verification with an Anti Money Laundering Protection Code.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Don't have the code?</strong> Contact our support team to obtain your AML Protection Code.
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Anti Money Laundering Protection Code
                </label>
                <input
                  type="text"
                  value={imfCode}
                  onChange={(e) => setImfCode(e.target.value)}
                  placeholder="Enter 6-digit AML Code (e.g., 004211)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono tracking-widest"
                  maxLength={6}
                />
              </div>

              <button
                onClick={handleIMFSubmit}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition duration-200 flex items-center justify-center space-x-2 mb-3"
              >
                <span>NEXT</span>
                <span>⊙</span>
              </button>

              <button
                onClick={() => router.push('/dashboard/messages')}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 rounded-lg transition duration-200"
              >
                Contact Support
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Success Modal
  return (
    <>
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8">
            <div className="text-center">
              {/* Success Icon */}
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">Transfer Successful!</h2>
              <p className="text-3xl font-bold text-blue-600 mb-8">
                Amount: ${parseFloat(transferData.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>

              {/* Transaction Details */}
              <div className="text-left space-y-3 mb-8">
                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium text-gray-600">Beneficiary:</span>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{transferData.receiverName}</p>
                    <p className="text-sm text-gray-500">(Account No: {transferData.accountNumber})</p>
                  </div>
                </div>

                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium text-gray-600">Sender:</span>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{accountNumber}</p>
                    <p className="text-sm text-gray-500">(Account No: {transferData.senderAccount})</p>
                  </div>
                </div>

                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium text-gray-600">Paid On:</span>
                  <span className="font-semibold text-gray-900">{new Date().toLocaleString()}</span>
                </div>

                <div className="flex justify-between py-2 border-b">
                  <span className="font-medium text-gray-600">Reference:</span>
                  <span className="font-semibold text-gray-900">{transactionRef}</span>
                </div>

                <div className="flex justify-between py-2">
                  <span className="font-medium text-gray-600">Payment Type:</span>
                  <span className="font-semibold text-gray-900">Outward Transfer</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handlePrintReceipt}
                  className="w-full border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold py-3 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
                >
                  <Printer className="w-5 h-5" />
                  <span>Print Receipt</span>
                </button>

                <button
                  onClick={handleDone}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition duration-200"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
