'use client';

import { useRouter } from 'next/navigation';
import DepositMethods, { DepositData } from './DepositMethods';

interface DepositPageClientProps {
  accountNumber: string;
  accountId: string;
  userId: string;
}

export default function DepositPageClient({ accountNumber, accountId, userId }: DepositPageClientProps) {
  const router = useRouter();

  const handleSubmitDeposit = async (data: DepositData) => {
    const response = await fetch('/api/deposits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        accountId,
        userId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit deposit');
    }

    // Refresh the page to update account status
    setTimeout(() => {
      router.refresh();
    }, 2000);
  };

  return <DepositMethods accountNumber={accountNumber} onSubmitDeposit={handleSubmitDeposit} />;
}
