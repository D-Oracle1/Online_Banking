import { db } from '@/server/db';
import { sql } from 'drizzle-orm';

async function addChatFeatures() {
  try {
    console.log('Adding chat features to users table...');

    // Add lastActiveAt column
    await db.execute(sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP
    `);
    console.log('✓ Added last_active_at column');

    // Add isTyping column
    await db.execute(sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS is_typing BOOLEAN NOT NULL DEFAULT false
    `);
    console.log('✓ Added is_typing column');

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

addChatFeatures();
