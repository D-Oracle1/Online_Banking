'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TransactionPinForm() {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (pin.length !== 4) {
      setMessage('PIN must be 4 digits');
      setLoading(false);
      return;
    }

    if (pin !== confirmPin) {
      setMessage('PINs do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/transaction-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Transaction PIN set successfully!');
        setTimeout(() => router.push('/dashboard'), 1500);
      } else {
        setMessage(data.error || 'Failed to set PIN');
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
        <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-2">
          Enter 4-Digit PIN
        </label>
        <input
          type="password"
          id="pin"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          maxLength={4}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-2xl tracking-widest text-center"
          placeholder="••••"
        />
      </div>

      <div>
        <label htmlFor="confirmPin" className="block text-sm font-medium text-gray-700 mb-2">
          Confirm PIN
        </label>
        <input
          type="password"
          id="confirmPin"
          value={confirmPin}
          onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          maxLength={4}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-2xl tracking-widest text-center"
          placeholder="••••"
        />
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
        {loading ? 'Setting PIN...' : 'Set PIN'}
      </button>
    </form>
  );
}
