import { NextResponse } from 'next/server';
import { getBankName } from '@/lib/site-settings';

export async function GET() {
  try {
    const bankName = await getBankName();
    return NextResponse.json({ bankName });
  } catch (error) {
    console.error('Error fetching bank name:', error);
    return NextResponse.json(
      { bankName: 'Sterling Capital Bank' }, // Fallback
      { status: 200 }
    );
  }
}
