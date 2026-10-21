import { db } from './db';
import { messages } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import { normalizeSenderName } from './chat';

interface SenderRow extends Record<string, unknown> {
  user_id: string;
  full_name: string | null;
  guest_name: string | null;
  message_count: number;
  last_at: Date | string;
}

export interface Sender {
  id: string;
  name: string;
  isRegistered: boolean;
  messageCount: number;
  lastAt: string;
}

export interface MergeGroup {
  name: string;
  /** The ID all messages end up under */
  target: Sender;
  /** IDs whose messages move to the target */
  sources: Sender[];
  messagesToMove: number;
}

export interface MergePlan {
  groups: MergeGroup[];
  /** Same name on more than one registered account: likely different people, left alone */
  skipped: { name: string; senders: Sender[] }[];
}

/**
 * Find people whose messages are split across several sender IDs (separate
 * guest sessions, or guest chats from before they registered), grouped by name.
 * Includes deleted messages so Deleted Messages stays consistent.
 */
export async function planChatMerge(): Promise<MergePlan> {
  const result = await db.execute<SenderRow>(sql`
    SELECT
      m.user_id,
      u.full_name,
      (
        SELECT g.sent_by FROM messages g
        WHERE g.user_id = m.user_id AND g.sender_type = 'user' AND g.sent_by IS NOT NULL
        ORDER BY g.created_at DESC
        LIMIT 1
      ) AS guest_name,
      count(*)::int AS message_count,
      max(m.created_at) AS last_at
    FROM messages m
    LEFT JOIN users u ON u.id = m.user_id
    GROUP BY m.user_id, u.full_name
  `);

  return buildMergePlan(Array.from(result as unknown as SenderRow[]));
}

/** Pure grouping step of planChatMerge (kept separate so it can be tested without a database) */
export function buildMergePlan(rows: SenderRow[]): MergePlan {
  const byName = new Map<string, Sender[]>();
  for (const row of rows) {
    const name = row.full_name || row.guest_name || '';
    const key = normalizeSenderName(name);
    if (!key || key === 'guest user') continue;

    const sender: Sender = {
      id: row.user_id,
      name,
      isRegistered: !!row.full_name,
      messageCount: Number(row.message_count) || 0,
      lastAt: new Date(row.last_at).toISOString(),
    };
    byName.set(key, [...(byName.get(key) ?? []), sender]);
  }

  const plan: MergePlan = { groups: [], skipped: [] };

  for (const senders of byName.values()) {
    if (senders.length < 2) continue;

    const registered = senders.filter(s => s.isRegistered);
    if (registered.length > 1) {
      plan.skipped.push({ name: registered[0].name, senders });
      continue;
    }

    // Keep the registered account if there is one, otherwise the most recent guest session
    const byRecent = [...senders].sort((a, b) => b.lastAt.localeCompare(a.lastAt));
    const target = registered[0] ?? byRecent[0];
    const sources = byRecent.filter(s => s.id !== target.id);

    plan.groups.push({
      name: target.name,
      target,
      sources,
      messagesToMove: sources.reduce((sum, s) => sum + s.messageCount, 0),
    });
  }

  plan.groups.sort((a, b) => a.name.localeCompare(b.name));
  return plan;
}

export interface MergeResult {
  groupsMerged: number;
  messagesMoved: number;
  /** For undo: which messages were moved off which sender ID */
  moves: { target: string; source: string; messageIds: string[] }[];
}

/** Move every source sender's messages onto the group's target ID, in one transaction */
export async function applyChatMerge(plan: MergePlan): Promise<MergeResult> {
  const result: MergeResult = { groupsMerged: 0, messagesMoved: 0, moves: [] };

  await db.transaction(async (tx) => {
    for (const group of plan.groups) {
      for (const source of group.sources) {
        const moved = await tx
          .update(messages)
          .set({ userId: group.target.id })
          .where(eq(messages.userId, source.id))
          .returning({ id: messages.id });

        result.messagesMoved += moved.length;
        result.moves.push({ target: group.target.id, source: source.id, messageIds: moved.map(m => m.id) });
      }
      result.groupsMerged += 1;
    }
  });

  return result;
}
