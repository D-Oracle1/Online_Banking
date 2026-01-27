'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TransactionPINModal from './TransactionPINModal';

export default function LoanForm() {
  const [amount, setAmount] = useState('');
  const [purpose, setPurpose] = useState('');
  const [term, setTerm] = useState('12');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPINModal, setShowPINModal] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    // Validate form before showing PIN modal
    if (!amount || parseFloat(amount) < 1000) {
      setMessage('Minimum loan amount is $1,000');
      return;
    }

    if (!purpose || !term) {
      setMessage('Please fill in all required fields');
      return;
    }

    // Show PIN modal for verification
    setShowPINModal(true);
  };

  const handlePINVerify = async (pin: string) => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/loan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          purpose,
          term: parseInt(term),
          pin,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Loan application submitted successfully!');
        setAmount('');
        setPurpose('');
        setTerm('12');
        setShowPINModal(false);
        setTimeout(() => router.push('/dashboard'), 2000);
      } else {
        throw new Error(data.error || 'Loan application failed');
      }
    } catch (error: any) {
      throw new Error(error.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
            Loan Amount (USD)
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1000"
            step="100"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter loan amount"
          />
        </div>

        <div>
          <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-2">
            Loan Purpose
          </label>
          <select
            id="purpose"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select purpose</option>
            <option value="Personal">Personal</option>
            <option value="Business">Business</option>
            <option value="Education">Education</option>
            <option value="Home Improvement">Home Improvement</option>
            <option value="Medical">Medical</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="term" className="block text-sm font-medium text-gray-700 mb-2">
            Loan Term (Months)
          </label>
          <select
            id="term"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="6">6 months</option>
            <option value="12">12 months</option>
            <option value="24">24 months</option>
            <option value="36">36 months</option>
            <option value="60">60 months</option>
          </select>
        </div>

        {message && (
          <div className={`p-4 rounded-lg ${message.includes('successfully') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-900 hover:bg-blue-800 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
        >
          {loading ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>

      <TransactionPINModal
        isOpen={showPINModal}
        onClose={() => setShowPINModal(false)}
        onVerify={handlePINVerify}
        title="Verify Transaction"
        description="Enter your 4-digit PIN to submit the loan application"
      />
    </>
  );
}
