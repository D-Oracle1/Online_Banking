import { requireAuth, getSession } from '@/lib/session';
import TransactionPinForm from '@/components/TransactionPinForm';
import ChangePinForm from '@/components/ChangePinForm';
import { db } from '@/server/db';
import { transactionPins } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

export default async function TransactionPinPage() {
  await requireAuth();
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  // Check if user already has a PIN
  const existingPin = await db
    .select()
    .from(transactionPins)
    .where(eq(transactionPins.userId, session.id))
    .limit(1);

  const hasPinSet = existingPin.length > 0;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-md p-8 border border-gray-200">
        {hasPinSet ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Transaction PIN</h1>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-blue-900 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Transaction PIN is Set</h3>
                  <p className="text-blue-800 text-sm">
                    Your transaction PIN is active. You can change it below by providing your current PIN.
                  </p>
                </div>
              </div>
            </div>

            <ChangePinForm />

            <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Security Information</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Your PIN is required for all financial transactions</li>
                <li>• Never share your PIN with anyone</li>
                <li>• You must provide your current PIN to change it</li>
                <li>• Contact support if you suspect unauthorized access</li>
              </ul>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Set Transaction PIN</h1>
            <p className="text-gray-600 mb-2">Create a 4-digit PIN to secure your transactions</p>
            <p className="text-sm text-blue-600 mb-6">
              ℹ️ Note: You can change your PIN later by providing your current PIN.
            </p>

            <TransactionPinForm />
          </>
        )}
      </div>
    </div>
  );
}
