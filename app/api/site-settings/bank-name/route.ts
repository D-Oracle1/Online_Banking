import { NextResponse } from 'next/server';
import { getBankName } from '@/lib/site-settings';

// Default fallback (centralized)
const DEFAULT_BANK_NAME = 'Online Banking';

export async function GET() {
  try {
    const bankName = await getBankName();
    return NextResponse.json({ bankName });
  } catch (error) {
    console.error('Error fetching bank name:', error);
    return NextResponse.json(
      { bankName: DEFAULT_BANK_NAME },
      { status: 200 }
    );
  }
}
