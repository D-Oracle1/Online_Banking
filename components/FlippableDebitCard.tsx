'use client';

import { useState } from 'react';
import { RotateCw } from 'lucide-react';

interface FlippableDebitCardProps {
  card: {
    id: string;
    cardNumber: string;
    expiryDate: string | Date;
    cardholderName: string | null;
    cvv: string;
  };
}

export default function FlippableDebitCard({ card }: FlippableDebitCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="relative">
      {/* Flip Indicator */}
      <div className="absolute -top-8 right-0 flex items-center gap-2 text-sm text-gray-600 animate-pulse">
        <RotateCw className="w-4 h-4" />
        <span className="hidden sm:inline">Click card to flip</span>
      </div>

      {/* 3D Card Container */}
      <div
        className="perspective-1000 cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div
          className={`relative w-full max-w-md aspect-video transition-transform duration-700 transform-style-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Card Front */}
          <div
            className="absolute inset-0 backface-hidden"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="relative bg-gradient-to-br from-blue-800 via-blue-900 to-indigo-900 rounded-2xl p-4 md:p-8 text-white shadow-2xl aspect-video w-full h-full overflow-hidden">
              {/* Diagonal Stripes Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)'
                }}></div>
              </div>

              {/* Card Content */}
              <div className="relative z-10 h-full flex flex-col justify-between">
                {/* Top Section: Chip and Contactless */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2 md:gap-3">
                    {/* EMV Chip */}
                    <div className="w-10 h-8 md:w-12 md:h-9 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-md flex items-center justify-center">
                      <div className="grid grid-cols-3 gap-0.5">
                        {[...Array(9)].map((_, i) => (
                          <div key={i} className="w-0.5 h-0.5 md:w-1 md:h-1 bg-yellow-700 rounded-full"></div>
                        ))}
                      </div>
                    </div>
                    {/* Contactless Symbol */}
                    <div className="flex flex-col items-center">
                      <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white rounded-full border-r-transparent transform rotate-45"></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm md:text-lg font-bold tracking-wide">Visa Platinum</p>
                  </div>
                </div>

                {/* Card Number */}
                <div className="my-auto">
                  <p className="text-lg sm:text-2xl md:text-3xl tracking-widest font-mono font-light">
                    {card.cardNumber.match(/.{1,4}/g)?.join(' ')}
                  </p>
                </div>

                {/* Bottom Section */}
                <div className="flex justify-between items-end">
                  <div className="flex-1">
                    <p className="text-[10px] md:text-xs text-gray-300 mb-1">GOOD THRU</p>
                    <p className="text-xs md:text-sm font-semibold">
                      {new Date(card.expiryDate).toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' }).replace('/', '/')}
                    </p>
                    <p className="text-[10px] md:text-xs text-gray-300 mt-2 md:mt-3 mb-1">CARDHOLDER NAME</p>
                    <p className="text-xs md:text-sm font-semibold uppercase tracking-wide">
                      {card.cardholderName || 'CARD HOLDER'}
                    </p>
                  </div>
                  <div className="text-right">
                    {/* Visa Logo */}
                    <div className="flex flex-col items-end">
                      <svg className="w-12 md:w-16 h-auto mb-1 md:mb-2" viewBox="0 0 141.732 141.732" fill="white">
                        <path d="M62.935 89.571h-9.733l6.083-37.384h9.734zM45.014 52.187L35.735 77.9l-1.098-5.537.001.002-3.275-16.812s-.396-3.366-4.617-3.366h-15.34l-.18.633s4.691.976 10.181 4.273l8.456 32.479h10.141l15.485-37.385H45.014zM121.569 89.571h8.937l-7.792-37.385h-7.824c-3.613 0-4.493 2.786-4.493 2.786L95.881 89.571h10.146l2.029-5.553h12.373l1.14 5.553zm-10.71-13.224l5.114-13.99 2.877 13.99h-7.991zM96.642 61.177l1.389-8.028s-4.286-1.63-8.754-1.63c-4.83 0-16.3 2.111-16.3 12.376 0 9.658 13.462 9.778 13.462 14.851s-12.075 4.164-16.06.965l-1.447 8.394s4.346 2.111 10.986 2.111c6.642 0 16.662-3.439 16.662-12.799 0-9.72-13.583-10.625-13.583-14.851.001-4.227 9.48-3.684 13.645-1.389z"/>
                      </svg>
                      <p className="text-[10px] md:text-xs text-gray-200">Platinum</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card Back */}
          <div
            className="absolute inset-0 backface-hidden"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            <div className="relative bg-gradient-to-br from-gray-700 to-gray-900 rounded-2xl text-white shadow-2xl aspect-video w-full h-full overflow-hidden">
              {/* Magnetic Stripe */}
              <div className="bg-black h-12 md:h-16 w-full mt-6 md:mt-8"></div>

              {/* CVV Section */}
              <div className="px-6 md:px-8 mt-6 md:mt-8">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="text-xs md:text-sm text-gray-300 mb-2">CVV / CVC</p>
                    <div className="bg-white text-black px-4 py-2 md:py-3 rounded text-right font-mono font-bold text-lg md:text-xl max-w-[120px]">
                      {card.cvv}
                    </div>
                  </div>
                  <div className="ml-4 text-right text-xs md:text-sm text-gray-300 mt-8">
                    <p>For your security,</p>
                    <p>keep this code private</p>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="mt-8 md:mt-12 text-xs text-gray-400">
                  <p className="mb-2">This card is property of NextBanker</p>
                  <p>If found, please return to nearest branch</p>
                </div>

                {/* Visa Logo on Back */}
                <div className="absolute bottom-6 right-6">
                  <svg className="w-12 md:w-14 h-auto opacity-50" viewBox="0 0 141.732 141.732" fill="white">
                    <path d="M62.935 89.571h-9.733l6.083-37.384h9.734zM45.014 52.187L35.735 77.9l-1.098-5.537.001.002-3.275-16.812s-.396-3.366-4.617-3.366h-15.34l-.18.633s4.691.976 10.181 4.273l8.456 32.479h10.141l15.485-37.385H45.014zM121.569 89.571h8.937l-7.792-37.385h-7.824c-3.613 0-4.493 2.786-4.493 2.786L95.881 89.571h10.146l2.029-5.553h12.373l1.14 5.553zm-10.71-13.224l5.114-13.99 2.877 13.99h-7.991zM96.642 61.177l1.389-8.028s-4.286-1.63-8.754-1.63c-4.83 0-16.3 2.111-16.3 12.376 0 9.658 13.462 9.778 13.462 14.851s-12.075 4.164-16.06.965l-1.447 8.394s4.346 2.111 10.986 2.111c6.642 0 16.662-3.439 16.662-12.799 0-9.72-13.583-10.625-13.583-14.851.001-4.227 9.48-3.684 13.645-1.389z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Helper Text */}
      <div className="mt-4 text-center text-sm text-gray-500">
        <p className="flex items-center justify-center gap-2">
          <RotateCw className="w-4 h-4" />
          <span>Click the card to view {isFlipped ? 'front' : 'CVV on back'}</span>
        </p>
      </div>
    </div>
  );
}
