import { db } from './db';
import { messages, users } from '@shared/schema';
import { and, eq, isNull, sql } from 'drizzle-orm';

/**
 * Chat images and profile photos are stored as base64 data URLs. Sending them
 * inline on every poll made chat payloads huge, so API responses reference them
 * by URL instead and the browser fetches (and caches) each image once.
 */
export function attachmentUrl(messageId: string, guestId?: string) {
  const base = `/api/chat/attachment/${encodeURIComponent(messageId)}`;
  return guestId ? `${base}?g=${encodeURIComponent(guestId)}` : base;
}

export function avatarUrl(userId: string, photo: string | null) {
  if (!photo) return null;
  if (/^https?:\/\//.test(photo)) return photo;
  return `/api/chat/avatar/${encodeURIComponent(userId)}`;
}

/** Turn a stored image (data URL or remote URL) into an HTTP response */
export function imageResponse(value: string | null, cacheControl: string) {
  if (!value) return new Response('Not found', { status: 404 });

  if (/^https?:\/\//.test(value)) {
    return Response.redirect(value, 302);
  }

  const match = value.match(/^data:([^;,]+)?(;base64)?,([\s\S]*)$/);
  if (!match) return new Response('Not found', { status: 404 });

  const [, mimeType = 'application/octet-stream', isBase64, data] = match;
  const body = isBase64 ? Buffer.from(data, 'base64') : Buffer.from(decodeURIComponent(data));

  return new Response(body, {
    headers: {
      'Content-Type': mimeType,
      'Content-Length': String(body.length),
      'Cache-Control': cacheControl,
    },
  });
}

/** Messages for one conversation, with attachments replaced by URLs */
export async function getConversationMessages(userId: string, guestId?: string) {
  const rows = await db
    .select({
      id: messages.id,
      userId: messages.userId,
      message: messages.message,
      response: messages.response,
      hasAttachment: sql<boolean>`${messages.attachment} IS NOT NULL`,
      isRead: messages.isRead,
      senderType: messages.senderType,
      sentBy: messages.sentBy,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(and(eq(messages.userId, userId), isNull(messages.deletedAt)))
    .orderBy(messages.createdAt);

  return rows.map(({ hasAttachment, ...row }) => ({
    ...row,
    attachment: hasAttachment ? attachmentUrl(row.id, guestId) : null,
  }));
}

export interface Conversation {
  user: {
    id: string;
    fullName: string;
    email: string | null;
    username: string;
    profilePhoto: string | null;
  };
  lastMessage: {
    id: string;
    message: string;
    attachment: string | null;
    senderType: 'user' | 'admin';
    createdAt: Date;
  } | null;
  unreadCount: number;
}

interface ConversationRow extends Record<string, unknown> {
  user_id: string;
  id: string;
  message: string;
  has_attachment: boolean;
  sender_type: string;
  created_at: Date | string;
  full_name: string | null;
  email: string | null;
  username: string | null;
  profile_photo_url: string | null;
  has_photo: boolean;
  guest_name: string | null;
  unread_count: number;
}

/**
 * Conversation list for the admin/manager inbox: the latest message per user
 * plus unread counts, computed in a single query.
 * Pass managerId to limit it to users assigned to that manager.
 */
export async function getConversations(managerId?: string) {
  const result = await db.execute<ConversationRow>(sql`
    WITH latest AS (
      SELECT DISTINCT ON (m.user_id)
        m.user_id, m.id, m.message, (m.attachment IS NOT NULL) AS has_attachment, m.sender_type, m.created_at
      FROM messages m
      WHERE m.deleted_at IS NULL
      ORDER BY m.user_id, m.created_at DESC
    ),
    unread AS (
      SELECT user_id, count(*)::int AS unread_count
      FROM messages
      WHERE deleted_at IS NULL AND is_read = false AND sender_type = 'user'
      GROUP BY user_id
    ),
    guest AS (
      SELECT DISTINCT ON (user_id) user_id, sent_by AS guest_name
      FROM messages
      WHERE deleted_at IS NULL AND sender_type = 'user' AND sent_by IS NOT NULL
      ORDER BY user_id, created_at DESC
    )
    SELECT
      l.*,
      u.full_name, u.email, u.username,
      CASE WHEN u.profile_photo ~ '^https?://' THEN u.profile_photo END AS profile_photo_url,
      (u.profile_photo IS NOT NULL AND u.profile_photo <> '') AS has_photo,
      g.guest_name,
      COALESCE(un.unread_count, 0) AS unread_count
    FROM latest l
    LEFT JOIN users u ON u.id = l.user_id
    LEFT JOIN unread un ON un.user_id = l.user_id
    LEFT JOIN guest g ON g.user_id = l.user_id
    ORDER BY l.created_at DESC
  `);

  const rows = Array.from(result as unknown as ConversationRow[]);

  let assignedUsers: typeof users.$inferSelect[] = [];
  let filtered = rows;

  if (managerId) {
    assignedUsers = await db
      .select()
      .from(users)
      .where(and(eq(users.assignedManagerId, managerId), isNull(users.deletedAt)));
    const assignedSet = new Set(assignedUsers.map(u => u.id));
    filtered = rows.filter(row => assignedSet.has(row.user_id));
  }

  const conversations: Conversation[] = filtered.map(row => {
    const isGuest = !row.full_name;
    return {
      user: {
        id: row.user_id,
        fullName: isGuest ? (row.guest_name || 'Guest User') : row.full_name!,
        email: row.email || null,
        username: isGuest ? 'Guest User' : row.username!,
        profilePhoto: row.profile_photo_url || (row.has_photo ? `/api/chat/avatar/${encodeURIComponent(row.user_id)}` : null),
      },
      lastMessage: {
        id: row.id,
        message: row.message,
        attachment: row.has_attachment ? attachmentUrl(row.id) : null,
        senderType: row.sender_type as 'user' | 'admin',
        createdAt: new Date(row.created_at),
      },
      unreadCount: Number(row.unread_count) || 0,
    };
  });

  // Managers also see assigned users who haven't messaged yet
  if (managerId) {
    const withMessages = new Set(conversations.map(c => c.user.id));
    for (const u of assignedUsers) {
      if (!withMessages.has(u.id)) {
        conversations.push({
          user: {
            id: u.id,
            fullName: u.fullName,
            email: u.email,
            username: u.username,
            profilePhoto: avatarUrl(u.id, u.profilePhoto),
          },
          lastMessage: null,
          unreadCount: 0,
        });
      }
    }
  }

  return conversations;
}
