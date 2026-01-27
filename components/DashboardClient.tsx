'use client';

import { useState, useEffect } from 'react';
import WelcomeModal from './WelcomeModal';

interface DashboardClientProps {
  userName: string;
  isAccountActivated: boolean;
}

export default function DashboardClient({ userName, isAccountActivated }: DashboardClientProps) {
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Show welcome modal until account is activated (has made first deposit)
    if (!isAccountActivated) {
      setShowWelcome(true);
    }
  }, [isAccountActivated]);

  const handleCloseWelcome = () => {
    setShowWelcome(false);
    // Don't permanently dismiss - will show again on next login until activated
  };

  return (
    <>
      {showWelcome && (
        <WelcomeModal userName={userName} onClose={handleCloseWelcome} />
      )}
    </>
  );
}
