import 'dotenv/config';
import { db } from '../server/db';
import { sql } from 'drizzle-orm';

/**
 * Manually add deleted_at column to messages table
 */

async function addSoftDelete() {
  try {
    console.log('🔧 Adding soft-delete column to messages table...\n');

    // Check if column already exists
    const columnCheck = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'messages'
      AND column_name = 'deleted_at';
    `);

    if (columnCheck && columnCheck.length > 0) {
      console.log('✅ Column "deleted_at" already exists!');
      process.exit(0);
    }

    // Add the column
    console.log('📝 Adding deleted_at column...');
    await db.execute(sql`
      ALTER TABLE messages ADD COLUMN deleted_at timestamp;
    `);

    console.log('✅ Successfully added deleted_at column!');
    console.log('\n📋 Messages table now supports soft-delete functionality.');
    console.log('   - Deleted messages will be marked with a timestamp');
    console.log('   - They can be recovered later if needed');
    console.log('   - Use "npm run recover-messages" to restore deleted messages');

    // Verify the column was added
    const verify = await db.execute(sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'messages'
      ORDER BY ordinal_position;
    `);

    console.log('\n📊 Messages table structure:');
    verify.forEach((col: any) => {
      console.log(`   - ${col.column_name}: ${col.data_type}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding soft-delete column:', error);
    process.exit(1);
  }
}

addSoftDelete();
