'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ChangeDebitCardPinFormProps {
  cardId: string;
}

export default function ChangeDebitCardPinForm({ cardId }: ChangeDebitCardPinFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    currentPin: '',
    newPin: '',
    confirmPin: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validate PIN format
    if (!/^\d{4}$/.test(formData.currentPin)) {
      setError('Current PIN must be exactly 4 digits');
      setLoading(false);
      return;
    }

    if (!/^\d{4}$/.test(formData.newPin)) {
      setError('New PIN must be exactly 4 digits');
      setLoading(false);
      return;
    }

    if (formData.newPin !== formData.confirmPin) {
      setError('New PIN and confirmation do not match');
      setLoading(false);
      return;
    }

    if (formData.currentPin === formData.newPin) {
      setError('New PIN must be different from current PIN');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/debit-card/change-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardId,
          currentPin: formData.currentPin,
          newPin: formData.newPin,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change PIN');
      }

      setSuccess('Card PIN changed successfully!');
      setFormData({
        currentPin: '',
        newPin: '',
        confirmPin: '',
      });

      setTimeout(() => {
        router.refresh();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'An error occurred while changing PIN');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Only allow digits and limit to 4 characters
    if (value === '' || (/^\d+$/.test(value) && value.length <= 4)) {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="currentPin" className="block text-sm font-medium text-gray-700 mb-1">
          Current PIN
        </label>
        <input
          type="password"
          id="currentPin"
          name="currentPin"
          value={formData.currentPin}
          onChange={handleChange}
          required
          maxLength={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
          placeholder="Enter current 4-digit PIN"
        />
      </div>

      <div>
        <label htmlFor="newPin" className="block text-sm font-medium text-gray-700 mb-1">
          New PIN
        </label>
        <input
          type="password"
          id="newPin"
          name="newPin"
          value={formData.newPin}
          onChange={handleChange}
          required
          maxLength={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
          placeholder="Enter new 4-digit PIN"
        />
      </div>

      <div>
        <label htmlFor="confirmPin" className="block text-sm font-medium text-gray-700 mb-1">
          Confirm New PIN
        </label>
        <input
          type="password"
          id="confirmPin"
          name="confirmPin"
          value={formData.confirmPin}
          onChange={handleChange}
          required
          maxLength={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:border-transparent"
          placeholder="Confirm new 4-digit PIN"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Changing PIN...' : 'Change Card PIN'}
      </button>
    </form>
  );
}
