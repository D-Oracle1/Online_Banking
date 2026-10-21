import { NextRequest, NextResponse } from 'next/server';
import { getConversations } from '@/server/chat';
import { requireStaffPermission } from '@/lib/manager-permissions';

export async function GET(request: NextRequest) {
  try {
    const staff = await requireStaffPermission('viewMessages');
    if ('error' in staff) {
      return NextResponse.json({ error: staff.error }, { status: staff.status });
    }

    // Managers only see their assigned users' conversations
    const conversations = await getConversations(staff.isFullAdmin ? undefined : staff.id);

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}
