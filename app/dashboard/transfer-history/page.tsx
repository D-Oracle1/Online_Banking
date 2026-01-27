import { requireAuth } from '@/lib/session';
import { db } from '@/server/db';
import { accounts, transactions, users } from '@/shared/schema';
import { eq, desc } from 'drizzle-orm';
import TransferHistoryClient from '@/components/TransferHistoryClient';

export default async function TransferHistoryPage() {
  const session = await requireAuth();

  const userAccount = await db.query.accounts.findFirst({
    where: eq(accounts.userId, session.id),
  });

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.id),
  });

  const transferHistory = await db.query.transactions.findMany({
    where: eq(transactions.accountId, userAccount?.id || ''),
    orderBy: [desc(transactions.createdAt)],
  });

  const transfers = transferHistory.filter(t => t.type === 'TRANSFER');

  // Fetch recipient names for all transfers
  const transfersWithRecipientNames = await Promise.all(
    transfers.map(async (transfer) => {
      if (!transfer.recipientAccountNumber) {
        return { ...transfer, recipientName: null };
      }

      // Find the recipient account
      const recipientAccount = await db.query.accounts.findFirst({
        where: eq(accounts.accountNumber, transfer.recipientAccountNumber),
      });

      if (!recipientAccount) {
        return { ...transfer, recipientName: null };
      }

      // Find the recipient user
      const recipientUser = await db.query.users.findFirst({
        where: eq(users.id, recipientAccount.userId),
      });

      return {
        ...transfer,
        recipientName: recipientUser?.fullName || null,
      };
    })
  );

  return (
    <TransferHistoryClient
      transfers={transfersWithRecipientNames}
      accountNumber={userAccount?.accountNumber || ''}
      userName={user?.fullName || ''}
    />
  );
}
