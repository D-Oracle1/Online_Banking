import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { platformSettings } from '@/shared/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Fetch payment methods settings
    const paymentMethodsSettings = await db
      .select()
      .from(platformSettings)
      .where(eq(platformSettings.key, 'paymentMethods'));

    let paymentMethods = null;

    if (paymentMethodsSettings.length > 0) {
      try {
        paymentMethods = JSON.parse(paymentMethodsSettings[0].value);
      } catch (error) {
        console.error('Error parsing payment methods:', error);
      }
    }

    // Default payment methods if none configured
    if (!paymentMethods) {
      paymentMethods = {
        btc: {
          enabled: true,
          address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
          name: 'Bitcoin (BTC)',
          icon: '₿'
        },
        eth: {
          enabled: true,
          address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
          name: 'Ethereum (ETH)',
          icon: 'Ξ'
        },
        usdt: {
          enabled: true,
          address: 'TYDzsYUEpvnYmQk4zGP9JgUvXwKMdQTiW3',
          network: 'TRC20',
          name: 'Tether (USDT)',
          icon: '₮'
        },
        bank: {
          enabled: true,
          accountName: 'Sterling Capital Bank',
          accountNumber: '1234567890',
          bankName: 'Sterling Capital Bank',
          routingNumber: '021000021',
          swiftCode: 'STERBUS33',
          name: 'Bank Transfer',
          icon: '🏦'
        },
        cashapp: {
          enabled: true,
          handle: '$SterlingCapital',
          name: 'Cash App',
          icon: '$'
        },
        paypal: {
          enabled: true,
          email: 'payments@sterlingcapitalbank.com',
          name: 'PayPal',
          icon: 'P'
        }
      };
    }

    return NextResponse.json({
      paymentMethods,
    });
  } catch (error: any) {
    console.error('Error loading payment methods:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load payment methods' },
      { status: 500 }
    );
  }
}
