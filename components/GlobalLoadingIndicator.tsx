'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useLoading } from '@/contexts/LoadingContext';
import LoadingLogo, { preloadLoadingLogo } from '@/components/LoadingLogo';

// Don't flash the overlay for navigations that finish almost instantly
const SHOW_DELAY_MS = 150;
// Never leave the overlay stuck if a navigation is cancelled or fails
const MAX_VISIBLE_MS = 15000;

export default function GlobalLoadingIndicator() {
  const { isLoading, loadingMessage, startLoading, stopLoading } = useLoading();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  // Warm up the logo so the first loader shows it straight away
  useEffect(() => {
    preloadLoadingLogo();
  }, []);

  // Navigation finished
  useEffect(() => {
    stopLoading();
  }, [pathname, stopLoading]);

  // Start the loader for any internal link click, not just NavigationLink
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const anchor = (e.target as Element | null)?.closest?.('a');
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname) return;

      startLoading();
    };

    const handlePopState = () => startLoading();

    document.addEventListener('click', handleClick);
    window.addEventListener('popstate', handlePopState);
    return () => {
      document.removeEventListener('click', handleClick);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [startLoading]);

  useEffect(() => {
    if (!isLoading) {
      setVisible(false);
      return;
    }
    const showTimer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    const failSafe = setTimeout(stopLoading, MAX_VISIBLE_MS);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(failSafe);
    };
  }, [isLoading, stopLoading]);

  if (!isLoading) return null;

  return (
    <>
      {/* Thin progress bar shows immediately */}
      <div className="fixed top-0 left-0 right-0 h-1 z-[10000] overflow-hidden bg-blue-100/60">
        <div
          className="h-full w-1/3 rounded-full"
          style={{
            backgroundColor: 'var(--color-primary, #1e3a8a)',
            animation: 'global-loading-bar 1.1s ease-in-out infinite',
          }}
        />
      </div>

      {visible && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[9999] flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl px-10 py-8 min-w-[220px]">
            <LoadingLogo message={loadingMessage || 'Loading...'} />
          </div>
        </div>
      )}

      <style>{`
        @keyframes global-loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </>
  );
}
