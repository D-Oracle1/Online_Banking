'use client';

import TransferForm from './TransferForm';

interface TransferPageClientProps {
  availableBalance: string;
  accountNumber: string;
}

export default function TransferPageClient({
  availableBalance,
  accountNumber
}: TransferPageClientProps) {
  return <TransferForm availableBalance={availableBalance} accountNumber={accountNumber} />;
}
