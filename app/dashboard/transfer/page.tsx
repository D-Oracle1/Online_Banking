import { requireAuth } from '@/lib/session';
import { db } from '@/server/db';
import { accounts } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import TransferPageClient from '@/components/TransferPageClient';

export default async function TransferPage() {
  const session = await requireAuth();

  const userAccount = await db.query.accounts.findFirst({
    where: eq(accounts.userId, session.id),
  });

  return (
    <TransferPageClient
      availableBalance={userAccount?.balance || '0.00'}
      accountNumber={userAccount?.accountNumber || ''}
    />
  );
}
