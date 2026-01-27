'use client';

import { useState, useEffect } from 'react';
import { Upload, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import TransactionPINModal from './TransactionPINModal';

interface DepositMethodsProps {
  accountNumber: string;
  onSubmitDeposit: (data: DepositData) => Promise<void>;
}

export interface DepositData {
  amount: string;
  paymentMethod: string;
  paymentProof: string;
  notes: string;
  pin?: string;
}

interface PaymentMethod {
  enabled: boolean;
  name?: string;
  icon?: string;
  address?: string;
  network?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  routingNumber?: string;
  swiftCode?: string;
  handle?: string;
  email?: string;
}

export default function DepositMethods({ onSubmitDeposit }: DepositMethodsProps) {
  const [paymentMethods, setPaymentMethods] = useState<Record<string, PaymentMethod>>({});
  const [isLoadingMethods, setIsLoadingMethods] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<string>('btc');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentProof, setPaymentProof] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPINModal, setShowPINModal] = useState(false);
  const [minDepositAmount, setMinDepositAmount] = useState<number>(3000);

  // Load payment methods and platform settings from API
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load payment methods
        const methodsResponse = await fetch('/api/settings/payment-methods');
        if (methodsResponse.ok) {
          const methodsData = await methodsResponse.json();
          setPaymentMethods(methodsData.paymentMethods);

          // Set first enabled method as default
          const firstEnabled = Object.keys(methodsData.paymentMethods).find(
            key => methodsData.paymentMethods[key].enabled
          );
          if (firstEnabled) {
            setSelectedMethod(firstEnabled);
          }
        }

        // Load platform settings
        const settingsResponse = await fetch('/api/settings');
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          if (settingsData.platformSettings?.minDepositAmount) {
            setMinDepositAmount(parseFloat(settingsData.platformSettings.minDepositAmount));
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoadingMethods(false);
      }
    };
    loadData();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProof(reader.result as string);
        setIsUploading(false);
      };
      reader.onerror = () => {
        setError('Failed to read file');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to upload file');
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validate
    if (!amount || parseFloat(amount) < minDepositAmount) {
      setError(`Minimum deposit amount is $${minDepositAmount.toLocaleString()}`);
      return;
    }

    if (!paymentProof) {
      setError('Please upload payment proof');
      return;
    }

    // Show PIN modal
    setShowPINModal(true);
  };

  const handlePINVerify = async (pin: string) => {
    setIsSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      await onSubmitDeposit({
        amount,
        paymentMethod: selectedMethod,
        paymentProof,
        notes,
        pin,
      });

      setSuccess(true);
      setAmount('');
      setNotes('');
      setPaymentProof('');
      setShowPINModal(false);
    } catch (err: any) {
      throw new Error(err.message || 'Failed to submit deposit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const method = paymentMethods[selectedMethod];
  const enabledMethods = Object.entries(paymentMethods).filter(([_, value]) => value.enabled);

  if (isLoadingMethods) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-900 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading payment methods...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Payment Method Selection */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Select Payment Method</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {enabledMethods.map(([key, value]) => (
            <button
              key={key}
              onClick={() => setSelectedMethod(key)}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedMethod === key
                  ? 'border-blue-900 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="text-3xl mb-2">{value.icon}</div>
              <div className="text-sm font-semibold text-gray-900">{value.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Payment Details */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Details</h2>

        <div className="space-y-4">
          {/* Crypto Addresses */}
          {method && (selectedMethod === 'btc' || selectedMethod === 'eth' || selectedMethod === 'usdt') && method.address && (
            <>
              <div className="bg-gray-50 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {method.name} Address
                  {method.network && (
                    <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      {method.network}
                    </span>
                  )}
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={method.address}
                    readOnly
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(method.address || '')}
                    className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg transition-colors"
                  >
                    {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
                <p className="text-yellow-800">
                  <strong>Important:</strong> Send only {method.name} to this address.
                  {selectedMethod === 'usdt' && method.network && ` Use ${method.network} network only.`} Sending other cryptocurrencies may result in permanent loss.
                </p>
              </div>
            </>
          )}

          {/* Bank Transfer */}
          {method && selectedMethod === 'bank' && (
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                {method.bankName && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                    <p className="text-gray-900 font-semibold">{method.bankName}</p>
                  </div>
                )}
                {method.accountName && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Account Name</label>
                    <p className="text-gray-900 font-semibold">{method.accountName}</p>
                  </div>
                )}
                {method.accountNumber && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Account Number</label>
                    <div className="flex items-center space-x-2">
                      <p className="text-gray-900 font-mono">{method.accountNumber}</p>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(method.accountNumber || '')}
                        className="text-blue-900 hover:text-blue-700"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
                {method.routingNumber && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Routing Number</label>
                    <div className="flex items-center space-x-2">
                      <p className="text-gray-900 font-mono">{method.routingNumber}</p>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(method.routingNumber || '')}
                        className="text-blue-900 hover:text-blue-700"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
                {method.swiftCode && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">SWIFT Code</label>
                    <div className="flex items-center space-x-2">
                      <p className="text-gray-900 font-mono">{method.swiftCode}</p>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(method.swiftCode || '')}
                        className="text-blue-900 hover:text-blue-700"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cash App */}
          {method && selectedMethod === 'cashapp' && method.handle && (
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Cash App Tag</label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={method.handle}
                  readOnly
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white font-mono text-lg"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(method.handle || '')}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg transition-colors"
                >
                  {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}

          {/* PayPal */}
          {method && selectedMethod === 'paypal' && method.email && (
            <div className="bg-gray-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">PayPal Email</label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={method.email}
                  readOnly
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(method.email || '')}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg transition-colors"
                >
                  {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Deposit Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 border border-gray-200 space-y-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Submit Deposit</h2>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Deposit Amount (USD) *
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min={minDepositAmount}
            step="0.01"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
            placeholder={`Minimum $${minDepositAmount.toLocaleString()}`}
          />
          <p className="text-xs text-gray-500 mt-1">Minimum deposit: ${minDepositAmount.toLocaleString()}</p>
        </div>

        {/* Payment Proof Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Proof (Screenshot/Receipt) *
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            {!paymentProof ? (
              <>
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <label className="cursor-pointer">
                  <span className="text-blue-900 hover:text-blue-800 font-medium">
                    Click to upload
                  </span>
                  <span className="text-gray-500"> or drag and drop</span>
                  <input
                    type="file"
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2">PNG, JPG, JPEG up to 5MB</p>
              </>
            ) : (
              <div className="space-y-4">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
                <p className="text-green-700 font-medium">Payment proof uploaded successfully</p>
                <button
                  type="button"
                  onClick={() => setPaymentProof('')}
                  className="text-sm text-blue-900 hover:text-blue-700"
                >
                  Change file
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
            placeholder="Transaction ID, reference number, or any additional information..."
          />
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start space-x-2">
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span className="text-sm">
              Deposit request submitted successfully! Our team will verify your payment and credit your account within 24 hours.
            </span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !amount || !paymentProof}
          className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Deposit Request'}
        </button>

        <p className="text-xs text-gray-500 text-center">
          Your deposit will be reviewed and processed within 24 hours. You'll receive a notification once approved.
        </p>
      </form>

      <TransactionPINModal
        isOpen={showPINModal}
        onClose={() => setShowPINModal(false)}
        onVerify={handlePINVerify}
        title="Verify Deposit"
        description="Enter your 4-digit PIN to submit the deposit request"
      />
    </div>
  );
}
