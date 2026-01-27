'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, AlertCircle, Shield, MessageCircle } from 'lucide-react';
import Image from 'next/image';

interface WelcomeModalProps {
  userName: string;
  onClose: () => void;
}

export default function WelcomeModal({ userName, onClose }: WelcomeModalProps) {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);

  const handleContinue = () => {
    onClose();
    // Navigate to deposit page
    router.push('/dashboard/deposit');
  };

  const handleContactSupport = () => {
    onClose();
    router.push('/dashboard/messages');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 p-6 rounded-t-2xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="flex items-center justify-center mb-4">
            <Image
              src="/logo_1760007385.png"
              alt="Sterling Capital Bank"
              width={150}
              height={60}
              className="object-contain brightness-0 invert"
            />
          </div>
          <h2 className="text-2xl font-bold text-white text-center">
            Welcome to Sterling Capital Bank!
          </h2>
          <p className="text-blue-100 text-center mt-2">
            Hello {userName}, we're excited to have you on board.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Account Activation */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900 mb-2">
                  Account Activation Required
                </h3>
                <p className="text-yellow-800 text-sm">
                  To activate your account and access all banking services, you need to make a
                  minimum deposit of <span className="font-bold">$3,000.00</span>. This is a
                  one-time requirement to verify your account and comply with banking regulations.
                </p>
              </div>
            </div>
          </div>

          {/* Anti-Money Laundering Policy */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">
                  Anti-Money Laundering (AML) Policy
                </h3>
                <div className="text-blue-800 text-sm space-y-2">
                  <p>
                    Sterling Capital Bank is committed to preventing money laundering and terrorist
                    financing. As part of our compliance program:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>All deposits and transactions are monitored for suspicious activity</li>
                    <li>We may request additional documentation to verify the source of funds</li>
                    <li>Large transactions may require enhanced due diligence</li>
                    <li>We comply with all Know Your Customer (KYC) regulations</li>
                    <li>Suspicious activities will be reported to relevant authorities</li>
                  </ul>
                  <p className="mt-3">
                    By continuing, you acknowledge that you have read and agree to comply with our
                    AML policies and understand that providing false information may result in
                    account suspension and legal action.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Support Information */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <MessageCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900 mb-2">
                  Need Help? Contact Our Support Team
                </h3>
                <p className="text-green-800 text-sm mb-3">
                  Our 24/7 support team is here to assist you with account activation, deposits,
                  or any questions you may have about our services.
                </p>
                <button
                  onClick={handleContactSupport}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat with Support</span>
                </button>
              </div>
            </div>
          </div>

          {/* Agreement Checkbox */}
          <div className="border-t border-gray-200 pt-4">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-900 border-gray-300 rounded focus:ring-blue-900"
              />
              <span className="text-sm text-gray-700">
                I acknowledge that I have read and understood the account activation requirements
                and Anti-Money Laundering policy. I agree to make the minimum deposit of $3,000 to
                activate my account and comply with all banking regulations.
              </span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleContinue}
              disabled={!agreed}
              className="flex-1 bg-blue-900 hover:bg-blue-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Deposit
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg transition-colors"
            >
              I'll Do This Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
