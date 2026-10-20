'use client';

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

interface LoadingContextType {
  isLoading: boolean;
  loadingMessage: string;
  startLoading: (message?: string) => void;
  stopLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Stable references: consumers use these in effect dependencies, and a new
  // function on every render made the loader stop as soon as it started
  // Without a message, keep any more specific one already set for this navigation
  const startLoading = useCallback((message?: string) => {
    setLoadingMessage(prev => message || prev || 'Loading...');
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    setLoadingMessage('');
  }, []);

  const value = useMemo(
    () => ({ isLoading, loadingMessage, startLoading, stopLoading }),
    [isLoading, loadingMessage, startLoading, stopLoading]
  );

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}
