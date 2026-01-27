'use client';

import { useState } from 'react';
import { Building2, CreditCard, Smartphone, Upload, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import TransactionPINModal from './TransactionPINModal';

interface LoanRepaymentMethodsProps {
  loanId: string;
  remainingBalance: number;
  accountBalance: string;
}

type PaymentMethod = 'BANK_TRANSFER' | 'CARD' | 'MOBILE_MONEY' | 'BALANCE';

export default function LoanRepaymentMethods({ loanId, remainingBalance, accountBalance }: LoanRepaymentMethodsProps) {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [amount, setAmount] = useState('');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPINModal, setShowPINModal] = useState(false);

  const paymentMethods = [
    {
      id: 'BALANCE' as PaymentMethod,
      name: 'Account Balance',
      icon: Smartphone,
      description: 'Pay from your account balance',
      requiresProof: false,
    },
    {
      id: 'BANK_TRANSFER' as PaymentMethod,
      name: 'Bank Transfer',
      icon: Building2,
      description: 'Transfer to our bank account',
      requiresProof: true,
    },
    {
      id: 'CARD' as PaymentMethod,
      name: 'Debit Card',
      icon: CreditCard,
      description: 'Pay with your card',
      requiresProof: true,
    },
    {
      id: 'MOBILE_MONEY' as PaymentMethod,
      name: 'Mobile Money',
      icon: Smartphone,
      description: 'Pay via mobile money',
      requiresProof: true,
    },
  ];

  const selectedPaymentMethod = paymentMethods.find(m => m.id === selectedMethod);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setPaymentProof(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setProofPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const repayAmount = parseFloat(amount);

    if (repayAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (repayAmount > remainingBalance) {
      setError('Amount exceeds remaining balance');
      return;
    }

    if (!selectedMethod) {
      setError('Please select a payment method');
      return;
    }

    // For account balance payment, check balance
    if (selectedMethod === 'BALANCE') {
      if (repayAmount > parseFloat(accountBalance)) {
        setError('Insufficient account balance');
        return;
      }
      // Show PIN modal for balance payment
      setShowPINModal(true);
      return;
    }

    // For other payment methods, require proof
    if (selectedPaymentMethod?.requiresProof && !paymentProof) {
      setError('Please upload payment proof');
      return;
    }

    await processRepayment();
  };

  const handlePINVerify = async (pin: string) => {
    setShowPINModal(false);
    await processRepayment(pin);
  };

  const processRepayment = async (pin?: string) => {
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('loanId', loanId);
      formData.append('amount', amount);
      formData.append('paymentMethod', selectedMethod!);

      if (pin) {
        formData.append('pin', pin);
      }

      if (paymentProof) {
        formData.append('paymentProof', paymentProof);
      }

      const response = await fetch('/api/loans/repay', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Repayment failed');
      }

      alert(selectedMethod === 'BALANCE'
        ? 'Repayment successful!'
        : 'Repayment request submitted! Awaiting admin approval.');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedMethod) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Payment Method</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paymentMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              className="flex items-start space-x-4 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-900 hover:bg-blue-50 transition-all"
            >
              <method.icon className="w-8 h-8 text-blue-900 flex-shrink-0 mt-1" />
              <div className="text-left">
                <h4 className="font-semibold text-gray-900">{method.name}</h4>
                <p className="text-sm text-gray-600">{method.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {selectedPaymentMethod?.name}
        </h3>
        <button
          onClick={() => {
            setSelectedMethod(null);
            setAmount('');
            setPaymentProof(null);
            setProofPreview(null);
            setError('');
          }}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Repayment Amount
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1"
            step="0.01"
            max={remainingBalance}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
            placeholder="Enter amount"
          />
          <p className="text-xs text-gray-500 mt-1">
            {selectedMethod === 'BALANCE'
              ? `Available balance: $${parseFloat(accountBalance).toLocaleString()}`
              : `Remaining: $${remainingBalance.toLocaleString()}`}
          </p>
        </div>

        {selectedPaymentMethod?.requiresProof && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Payment Proof
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-900 transition-colors">
              <div className="space-y-1 text-center">
                {proofPreview ? (
                  <div className="relative">
                    <img
                      src={proofPreview}
                      alt="Payment proof preview"
                      className="mx-auto h-48 w-auto rounded"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentProof(null);
                        setProofPreview(null);
                      }}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-blue-900 hover:text-blue-800">
                        <span>Upload a file</span>
                        <input
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          onChange={handleFileChange}
                          required={selectedPaymentMethod?.requiresProof}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : selectedMethod === 'BALANCE' ? 'Pay Now' : 'Submit Repayment'}
        </button>
      </form>

      <TransactionPINModal
        isOpen={showPINModal}
        onClose={() => setShowPINModal(false)}
        onVerify={handlePINVerify}
        title="Verify Loan Repayment"
        description="Enter your 4-digit PIN to process the loan repayment from your account balance"
      />
    </div>
  );
}
