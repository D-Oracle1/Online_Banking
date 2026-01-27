'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface FixedSavingsFormProps {
  onSuccess?: () => void;
}

export default function FixedSavingsForm({ onSuccess }: FixedSavingsFormProps = {}) {
  const [amount, setAmount] = useState('');
  const [term, setTerm] = useState('12');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const interestRates: { [key: string]: number } = {
    '6': 3.5,
    '12': 4.5,
    '24': 5.5,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/fixed-savings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          amount: parseFloat(amount),
          term: parseInt(term)
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Fixed savings account created successfully!');
        setAmount('');
        setTerm('12');
        if (onSuccess) {
          setTimeout(() => onSuccess(), 1500);
        } else {
          setTimeout(() => router.push('/dashboard'), 2000);
        }
      } else {
        setMessage(data.error || 'Failed to create fixed savings');
      }
    } catch (error) {
      setMessage('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
          Amount (USD)
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
          placeholder="Minimum $1,000"
        />
      </div>

      <div>
        <label htmlFor="term" className="block text-sm font-medium text-gray-700 mb-2">
          Term
        </label>
        <select
          id="term"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="6">6 months (3.5% interest)</option>
          <option value="12">12 months (4.5% interest)</option>
          <option value="24">24 months (5.5% interest)</option>
        </select>
      </div>

      {amount && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm font-medium text-green-900">Estimated Returns</p>
          <p className="text-2xl font-bold text-green-700">
            ${(parseFloat(amount) * (interestRates[term] / 100)).toFixed(2)}
          </p>
          <p className="text-xs text-green-600 mt-1">Interest earned at maturity</p>
        </div>
      )}

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
        {loading ? 'Creating...' : 'Create Fixed Savings'}
      </button>
    </form>
  );
}
