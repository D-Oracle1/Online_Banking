'use client';

import { useState, useEffect } from 'react';
import { Lock, X } from 'lucide-react';

interface TransactionPINModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (pin: string) => Promise<void>;
  title: string;
  description: string;
}

export default function TransactionPINModal({
  isOpen,
  onClose,
  onVerify,
  title,
  description,
}: TransactionPINModalProps) {
  const [pin, setPin] = useState(['', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setPin(['', '', '', '']);
      setError('');
    }
  }, [isOpen]);

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1);
    }

    if (!/^\d*$/.test(value)) {
      return;
    }

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      nextInput?.focus();
    }

    // Auto-submit when all 4 digits are entered
    if (newPin.every(digit => digit) && index === 3) {
      handleVerify(newPin.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      const prevInput = document.getElementById(`pin-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    const newPin = pastedData.split('');
    while (newPin.length < 4) newPin.push('');
    setPin(newPin);

    if (newPin.every(digit => digit)) {
      handleVerify(newPin.join(''));
    }
  };

  const handleVerify = async (pinValue?: string) => {
    const pinToVerify = pinValue || pin.join('');

    if (pinToVerify.length !== 4) {
      setError('Please enter all 4 digits');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      await onVerify(pinToVerify);
      onClose();
    } catch (error: any) {
      setError(error.message || 'Invalid PIN. Please try again.');
      setPin(['', '', '', '']);
      document.getElementById('pin-0')?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Icon */}
        <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-blue-900" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">{title}</h2>
        <p className="text-gray-600 text-center text-sm mb-6">{description}</p>

        {/* PIN Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
            Enter Your 4-Digit Transaction PIN
          </label>
          <div className="flex justify-center space-x-3 mb-4">
            {pin.map((digit, index) => (
              <input
                key={index}
                id={`pin-${index}`}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-14 h-16 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-900 focus:ring-2 focus:ring-blue-900 focus:outline-none"
              />
            ))}
          </div>

          {error && (
            <p className="text-red-600 text-sm text-center">{error}</p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => handleVerify()}
            disabled={isVerifying || pin.some(d => !d)}
            className="flex-1 bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifying ? 'Verifying...' : 'Verify PIN'}
          </button>
        </div>
      </div>
    </div>
  );
}
