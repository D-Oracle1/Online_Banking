import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function addNotificationsTables() {
  try {
    console.log('Creating notifications table...');

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        data TEXT,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        read_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    console.log('✓ notifications table created');

    console.log('Creating push_subscriptions table...');

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, endpoint)
      )
    `);

    console.log('✓ push_subscriptions table created');

    // Create indexes for better query performance
    console.log('Creating indexes...');

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC)
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id)
    `);

    console.log('✓ Indexes created');
    console.log('\n✅ All notification tables and indexes created successfully!');
  } catch (error) {
    console.error('Error creating notification tables:', error);
    throw error;
  }
}

addNotificationsTables()
  .then(() => {
    console.log('Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
