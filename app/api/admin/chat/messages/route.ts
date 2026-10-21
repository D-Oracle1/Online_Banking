import { NextRequest, NextResponse } from 'next/server';
import { getConversationMessages } from '@/server/chat';
import { requireStaffPermission } from '@/lib/manager-permissions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const staff = await requireStaffPermission('viewMessages', userId);
    if ('error' in staff) {
      return NextResponse.json({ error: staff.error }, { status: staff.status });
    }

    // All non-deleted messages for this user (both from user and admin)
    const userMessages = await getConversationMessages(userId);

    return NextResponse.json({ messages: userMessages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
