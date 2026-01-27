'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface SplashScreenClientProps {
  splashLogoUrl?: string | null;
  logoUrl?: string | null;
  bankName?: string;
  primaryColor?: string;
}

export default function SplashScreenClient({
  splashLogoUrl,
  logoUrl,
  bankName = 'Sterling Capital Bank',
  primaryColor = '#1e3a8a'
}: SplashScreenClientProps) {
  const router = useRouter();

  useEffect(() => {
    // Show splash screen for 2 seconds then redirect to home
    // The home page will handle further redirects based on session
    const timer = setTimeout(() => {
      router.push('/home');
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  // Use splash logo if available, otherwise fall back to main logo, then default
  const logoSrc = splashLogoUrl || logoUrl;

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      {/* Centered content with fade-in animation */}
      <div className="flex flex-col items-center animate-fade-in">
        {/* Logo - simple and centered */}
        <div className="mb-12">
          {logoSrc ? (
            <img
              src={logoSrc}
              alt={bankName}
              className="h-28 object-contain"
            />
          ) : (
            <Image
              src="/logo_1760007385.png"
              alt={bankName}
              width={280}
              height={112}
              priority
              className="object-contain"
            />
          )}
        </div>

        {/* Minimal loading indicator - just a simple spinner */}
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-gray-200"></div>
          <div
            className="absolute inset-0 rounded-full border-2 border-r-transparent border-b-transparent border-l-transparent animate-spin"
            style={{ borderTopColor: primaryColor }}
          ></div>
        </div>
      </div>
    </div>
  );
}
