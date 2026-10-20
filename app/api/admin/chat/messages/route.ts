import { NextRequest, NextResponse } from 'next/server';
import { requireManagerAPI } from '@/lib/manager';
import { getConversationMessages } from '@/server/chat';

export async function GET(request: NextRequest) {
  try {
    const session = await requireManagerAPI(request);
    if (session instanceof NextResponse) return session;

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // All non-deleted messages for this user (both from user and admin)
    const userMessages = await getConversationMessages(userId);

    return NextResponse.json({ messages: userMessages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
