import { requireAuth } from '@/lib/session';
import { db } from '@/server/db';
import { accounts } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import DepositPageClient from '@/components/DepositPageClient';

export default async function DepositPage() {
  const session = await requireAuth();

  const userAccount = await db.query.accounts.findFirst({
    where: eq(accounts.userId, session.id),
  });

  if (!userAccount) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <p className="text-red-800">No account found. Please contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Deposit Funds</h1>
      <p className="text-gray-600 mb-6">Choose your preferred payment method and add funds to your account</p>

      <DepositPageClient
        accountNumber={userAccount.accountNumber}
        accountId={userAccount.id}
        userId={session.id}
      />
    </div>
  );
}
