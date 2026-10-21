import { NextRequest, NextResponse } from 'next/server';
import { requireAdminAPI } from '@/lib/admin';
import { applyChatMerge, planChatMerge } from '@/server/chat-merge';
import { logAudit } from '@/server/audit-logger';

export const dynamic = 'force-dynamic';

// GET: preview which chats would be merged (changes nothing)
export async function GET() {
  const auth = await requireAdminAPI();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    return NextResponse.json(await planChatMerge());
  } catch (error: any) {
    console.error('Error planning chat merge:', error);
    return NextResponse.json({ error: error.message || 'Failed to find duplicate chats' }, { status: 500 });
  }
}

// POST: merge them. The plan is recomputed here rather than trusted from the client.
export async function POST(request: NextRequest) {
  const auth = await requireAdminAPI();
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const plan = await planChatMerge();
    if (plan.groups.length === 0) {
      return NextResponse.json({ groupsMerged: 0, messagesMoved: 0 });
    }

    const result = await applyChatMerge(plan);

    // Record every move so the merge can be reversed if needed
    await logAudit({
      userId: auth.id,
      action: 'UPDATE_USER',
      entityType: 'message',
      entityId: 'chat-merge',
      details: {
        operation: 'MERGE_DUPLICATE_CHATS',
        groupsMerged: result.groupsMerged,
        messagesMoved: result.messagesMoved,
        moves: result.moves,
      },
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0].trim() || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({ groupsMerged: result.groupsMerged, messagesMoved: result.messagesMoved });
  } catch (error: any) {
    console.error('Error merging chats:', error);
    return NextResponse.json({ error: error.message || 'Failed to merge chats' }, { status: 500 });
  }
}
