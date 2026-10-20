import { NextRequest, NextResponse } from 'next/server';
import { getConversationMessages } from '@/server/chat';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const guestId = searchParams.get('guestId');

    if (!guestId) {
      return NextResponse.json(
        { error: 'Guest ID is required' },
        { status: 400 }
      );
    }

    // Get all messages for this guest (attachments are returned as URLs)
    const userMessages = await getConversationMessages(guestId, guestId);

    return NextResponse.json({
      success: true,
      messages: userMessages,
    });
  } catch (error: any) {
    console.error('Error checking anonymous messages:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check messages' },
      { status: 500 }
    );
  }
}
