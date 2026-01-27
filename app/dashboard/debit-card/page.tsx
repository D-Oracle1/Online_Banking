import { requireAuth } from '@/lib/session';
import { db } from '@/server/db';
import { debitCards, debitCardPins } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import DebitCardPinForm from '@/components/DebitCardPinForm';
import ChangeDebitCardPinForm from '@/components/ChangeDebitCardPinForm';
import FlippableDebitCard from '@/components/FlippableDebitCard';

export default async function DebitCardPage() {
  const session = await requireAuth();

  const card = await db.query.debitCards.findFirst({
    where: eq(debitCards.userId, session.id),
  });

  // Check if card has a PIN set
  let hasPinSet = false;
  if (card) {
    const existingPin = await db
      .select()
      .from(debitCardPins)
      .where(eq(debitCardPins.cardId, card.id))
      .limit(1);
    hasPinSet = existingPin.length > 0;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-0">
      <div className="bg-white rounded-xl shadow-md p-4 md:p-8 border border-gray-200">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Your Debit Card</h1>
        
        {card ? (
          <div className="space-y-4 md:space-y-6">
            <FlippableDebitCard card={card} />

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Security Notice:</strong> Keep your card details secure. Never share your CVV or PIN with anyone.
              </p>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Card PIN Management</h2>
              {hasPinSet ? (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-800">
                      Your card PIN is set. You can change it below by providing your current PIN.
                    </p>
                  </div>
                  <ChangeDebitCardPinForm cardId={card.id} />
                </>
              ) : (
                <>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-orange-800">
                      <strong>Important:</strong> Set a 4-digit PIN to use your debit card for transactions.
                    </p>
                  </div>
                  <DebitCardPinForm cardId={card.id} />
                </>
              )}
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No debit card found</p>
        )}
      </div>
    </div>
  );
}
