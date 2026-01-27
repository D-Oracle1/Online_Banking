import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export async function POST() {
  await clearSession();
  return NextResponse.json({ success: true });
}

export async function GET() {
  await clearSession();
  redirect('/login');
}
