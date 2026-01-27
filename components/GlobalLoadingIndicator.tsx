'use client';

import { useLoading } from '@/contexts/LoadingContext';
import { Loader2 } from 'lucide-react';

export default function GlobalLoadingIndicator() {
  const { isLoading, loadingMessage } = useLoading();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-2xl p-6 flex flex-col items-center gap-4 min-w-[250px]">
        <Loader2 className="w-12 h-12 animate-spin" style={{ color: 'var(--color-primary, #1e3a8a)' }} />
        <p className="text-gray-700 font-medium text-center">{loadingMessage}</p>
      </div>
    </div>
  );
}
