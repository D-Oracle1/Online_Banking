import { db } from '@/server/db';
import { sql } from 'drizzle-orm';

async function migrateMessagesSchema() {
  try {
    console.log('Starting messages table migration...');

    // Add senderType column (default 'user' for existing messages)
    await db.execute(sql`
      ALTER TABLE messages
      ADD COLUMN IF NOT EXISTS sender_type TEXT NOT NULL DEFAULT 'user'
    `);
    console.log('✓ Added sender_type column');

    // Add sentBy column (nullable for existing messages)
    await db.execute(sql`
      ALTER TABLE messages
      ADD COLUMN IF NOT EXISTS sent_by TEXT
    `);
    console.log('✓ Added sent_by column');

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

migrateMessagesSchema();
