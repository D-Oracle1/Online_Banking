import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/server/db';
import { users } from '@/shared/schema';
import { eq } from 'drizzle-orm';
import { imageResponse } from '@/server/chat';

export async function GET(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;

  const cookieStore = await cookies();
  const viewerId = cookieStore.get('userId')?.value;
  if (!viewerId) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (viewerId !== userId) {
    const viewer = await db.query.users.findFirst({ where: eq(users.id, viewerId) });
    if (!viewer || (viewer.role !== 'admin' && !viewer.isManager && !viewer.isSuperAdmin)) {
      return new Response('Forbidden', { status: 403 });
    }
  }

  const [user] = await db
    .select({ profilePhoto: users.profilePhoto })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  // Short cache: the user may change their photo
  return imageResponse(user?.profilePhoto ?? null, 'private, max-age=600');
}
