import { NextRequest, NextResponse } from 'next/server';
import { getBankName } from '@/lib/site-settings';

// Banking knowledge base for the chatbot - using placeholder for bank name
function getBankingKnowledge(bankName: string) {
  return {
  deposit: {
    keywords: ['deposit', 'top up', 'add money', 'fund', 'transfer money in'],
    response: `To make a deposit to your ${bankName} account:

1. Navigate to the "Deposit (Top Up)" section from your dashboard
2. Enter the amount you wish to deposit (minimum $3,000 for account activation)
3. Follow the payment instructions provided
4. Your account will be credited instantly upon successful payment

For new accounts, please note that a minimum deposit of $3,000 is required to activate your account and access all banking services.`
  },

  aml: {
    keywords: ['aml', 'anti money laundering', 'money laundering', 'compliance', 'regulations', 'kyc'],
    response: `${bankName}'s Anti-Money Laundering (AML) Policy:

• All transactions are monitored for suspicious activity
• We may request documentation to verify the source of funds
• Large transactions require enhanced due diligence
• We comply with all Know Your Customer (KYC) regulations
• Suspicious activities are reported to relevant authorities
• Providing false information may result in account suspension

Our AML policies protect you and ensure the integrity of the financial system.`
  },

  activation: {
    keywords: ['activate', 'activation', 'activate account', 'new account', 'account setup'],
    response: `To activate your ${bankName} account:

1. Make a minimum deposit of $3,000 to your account
2. Ensure your KYC documents are complete and verified
3. Review and accept our Anti-Money Laundering policies
4. Set up your transaction PIN for secure transactions

Once these steps are completed, your account will be fully activated and you'll have access to:
• Fund transfers
• Loan applications
• Fixed savings accounts
• Debit card services
• And more!`
  },

  minimum: {
    keywords: ['minimum', 'minimum deposit', 'how much', 'required amount', 'initial deposit'],
    response: `The minimum deposit requirement for ${bankName} is $3,000.00.

This one-time deposit is required to:
• Activate your account
• Verify your identity and comply with banking regulations
• Access all banking services and features

After activation, there is no minimum balance requirement for your account.`
  },

  transfer: {
    keywords: ['transfer', 'send money', 'wire', 'payment', 'pay'],
    response: `To transfer money from your account:

1. Go to "Bank Transfer" in the Fund Transfer section
2. Enter the recipient's account number
3. Specify the transfer amount
4. Enter your transaction PIN for security
5. Confirm the transfer details

Transfers are processed instantly within ${bankName}. External transfers may take 1-3 business days.`
  },

  loan: {
    keywords: ['loan', 'borrow', 'credit', 'lending'],
    response: `${bankName} offers personal and business loans:

• Competitive interest rates
• Flexible repayment terms
• Quick approval process

To apply:
1. Navigate to "Loan Application" from your dashboard
2. Fill out the loan application form
3. Specify the loan amount and purpose
4. Submit for review

Our team will review your application within 24-48 hours and contact you with a decision.`
  },

  card: {
    keywords: ['card', 'debit card', 'atm', 'atm card'],
    response: `Your ${bankName} debit card provides:

• Worldwide acceptance
• 24/7 ATM access
• Secure chip technology
• Online shopping protection

To view your card details, visit the "Debit Card" section in your dashboard. Keep your card information secure and never share your CVV or PIN with anyone.`
  },

  pin: {
    keywords: ['pin', 'transaction pin', 'security pin', 'password', 'security code'],
    response: `Your transaction PIN is essential for secure banking:

To set up or change your PIN:
1. Go to "Set Transaction PIN" in your dashboard
2. Enter your desired 4-digit PIN
3. Confirm your PIN
4. Save changes

Keep your PIN confidential and never share it with anyone, including bank staff. If you suspect your PIN has been compromised, change it immediately.`
  },

  support: {
    keywords: ['help', 'support', 'contact', 'assistance', 'customer service'],
    response: `${bankName} provides 24/7 customer support:

• Live Chat: Available right here through this chat
• Email: support@sterlingcapitalbank.com
• Phone: +1-800-STERLING (Available 24/7)
• Message Center: Send us a message through the "Message Support" section

Our support team is dedicated to helping you with any questions or concerns.`
  },

  balance: {
    keywords: ['balance', 'account balance', 'how much', 'funds', 'available'],
    response: `To check your account balance:

• View it on your dashboard (displayed prominently on the main page)
• Go to "Account Details" for detailed information
• Check "Account Summary" for a comprehensive overview

Your balance is updated in real-time with every transaction.`
  },

  savings: {
    keywords: ['savings', 'fixed savings', 'interest', 'save money'],
    response: `${bankName} offers Fixed Savings accounts with competitive interest rates:

• Lock in higher interest rates for fixed terms
• Terms ranging from 3 months to 5 years
• Guaranteed returns
• Early withdrawal options (with penalties)

Visit the "Fixed Savings" section to open a fixed savings account and start earning more on your deposits!`
  }
  };
}

function findBestMatch(userMessage: string, bankName: string): string {
  const lowercaseMessage = userMessage.toLowerCase();
  const bankingKnowledge = getBankingKnowledge(bankName);

  // Check each knowledge category
  for (const [key, data] of Object.entries(bankingKnowledge)) {
    for (const keyword of data.keywords) {
      if (lowercaseMessage.includes(keyword.toLowerCase())) {
        return data.response;
      }
    }
  }

  // Default response if no match found
  return `Thank you for reaching out to ${bankName}.

I'm here to help with questions about:
• Account deposits and activation
• Anti-Money Laundering policies
• Fund transfers and payments
• Loans and credit
• Debit cards
• Transaction PINs
• Account balances
• Fixed savings accounts

Please feel free to ask me anything about these topics, or you can message our support team directly through the "Message Support" section for personalized assistance.`;
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Get bank name from settings
    const bankName = await getBankName();

    // Simulate a small delay to make it feel more natural
    await new Promise(resolve => setTimeout(resolve, 500));

    const response = findBestMatch(message, bankName);

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Chatbot error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
