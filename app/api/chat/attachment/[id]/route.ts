import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/server/db';
import { messages, users } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { imageResponse } from '@/server/chat';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const message = await db.query.messages.findFirst({
    where: eq(messages.id, id),
  });

  if (!message || message.deletedAt || !message.attachment) {
    return new Response('Not found', { status: 404 });
  }

  // Guests are identified by the guest ID they already use to read their chat
  const guestId = request.nextUrl.searchParams.get('g');
  let allowed = !!guestId && guestId === message.userId;

  if (!allowed) {
    const cookieStore = await cookies();
    const viewerId = cookieStore.get('userId')?.value;
    if (viewerId) {
      if (viewerId === message.userId) {
        allowed = true;
      } else {
        const viewer = await db.query.users.findFirst({ where: eq(users.id, viewerId) });
        allowed = !!viewer && (viewer.role === 'admin' || viewer.isManager || viewer.isSuperAdmin);
      }
    }
  }

  if (!allowed) {
    return new Response('Forbidden', { status: 403 });
  }

  // Message attachments never change, so the browser can keep them
  return imageResponse(message.attachment, 'private, max-age=31536000, immutable');
}
