import { NextRequest, NextResponse } from 'next/server';
import { getConversationMessages } from '@/server/chat';
import { parseClientIds, requireStaffPermissionForClients } from '@/lib/manager-permissions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    // A chat can combine several sender IDs (same person, different sessions)
    const userIds = parseClientIds({
      userId: searchParams.get('userId') ?? undefined,
      userIds: searchParams.get('userIds') ?? undefined,
    });

    if (userIds.length === 0) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const staff = await requireStaffPermissionForClients('viewMessages', userIds);
    if ('error' in staff) {
      return NextResponse.json({ error: staff.error }, { status: staff.status });
    }

    // All non-deleted messages for these senders (both from user and admin), oldest first
    const userMessages = await getConversationMessages(userIds);

    return NextResponse.json({ messages: userMessages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
