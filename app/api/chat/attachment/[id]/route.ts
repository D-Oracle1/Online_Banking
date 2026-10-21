import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/server/db';
import { messages } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { imageResponse } from '@/server/chat';
import { canAccessClient, getStaffContext } from '@/lib/manager-permissions';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const message = await db.query.messages.findFirst({
    where: eq(messages.id, id),
  });

  if (!message || !message.attachment) {
    return new Response('Not found', { status: 404 });
  }

  // Deleted messages' images are only visible to admins (for the Deleted Messages screen)
  const isDeleted = !!message.deletedAt;

  // Guests are identified by the guest ID they already use to read their chat
  const guestId = request.nextUrl.searchParams.get('g');
  let allowed = !isDeleted && !!guestId && guestId === message.userId;

  if (!allowed) {
    const cookieStore = await cookies();
    const viewerId = cookieStore.get('userId')?.value;
    if (viewerId && !isDeleted && viewerId === message.userId) {
      allowed = true;
    } else if (viewerId) {
      // Staff: admins see everything; managers only chats they're allowed to read
      const staff = await getStaffContext();
      if (staff) {
        allowed = staff.isFullAdmin
          || (!isDeleted && staff.permissions.viewMessages && await canAccessClient(staff, message.userId));
      }
    }
  }

  if (!allowed) {
    return new Response('Forbidden', { status: 403 });
  }

  // Message attachments never change, so the browser can keep them.
  // Deleted ones aren't cached long, so permanently deleting them takes effect.
  return imageResponse(message.attachment, isDeleted ? 'private, no-store' : 'private, max-age=31536000, immutable');
}
