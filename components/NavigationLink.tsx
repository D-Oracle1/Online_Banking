'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLoading } from '@/contexts/LoadingContext';
import { ComponentProps, useEffect } from 'react';

interface NavigationLinkProps extends Omit<ComponentProps<typeof Link>, 'onClick'> {
  children: React.ReactNode;
  loadingMessage?: string;
  onClick?: () => void;
}

export default function NavigationLink({
  children,
  href,
  loadingMessage = 'Loading...',
  onClick,
  ...props
}: NavigationLinkProps) {
  const { startLoading, stopLoading } = useLoading();
  const pathname = usePathname();

  // Stop loading when pathname changes (navigation complete)
  useEffect(() => {
    stopLoading();
  }, [pathname, stopLoading]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Don't show loading if clicking current page
    const targetHref = typeof href === 'string' ? href : href.pathname || '';
    if (pathname !== targetHref) {
      startLoading(loadingMessage);
    }

    // Call custom onClick if provided
    if (onClick) {
      onClick();
    }
  };

  return (
    <Link href={href} onClick={handleClick} {...props}>
      {children}
    </Link>
  );
}
