import 'dotenv/config';
import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function checkForDeletedMessages() {
  try {
    console.log('🔍 Checking database for any recoverable message data...\n');

    // Check if messages table has any soft-delete columns
    const tableInfo = await db.execute(sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'messages'
      ORDER BY ordinal_position;
    `);

    console.log('Messages table schema:');
    console.log('=====================');
    if (Array.isArray(tableInfo) && tableInfo.length > 0) {
      tableInfo.forEach((col: any) => {
        console.log(`- ${col.column_name}: ${col.data_type}`);
      });
    } else {
      console.log('Could not retrieve table schema');
    }

    // Check total row count including any archived
    const totalCount = await db.execute(sql`
      SELECT COUNT(*) as count FROM messages;
    `);

    console.log('\n📊 Total messages in database:', totalCount[0].count);

    // Check if PostgreSQL has any transaction logs we can query
    console.log('\n🔍 Checking for PostgreSQL transaction logs...');

    try {
      const walStatus = await db.execute(sql`
        SELECT pg_current_wal_lsn() as current_wal;
      `);
      console.log('WAL Status:', walStatus[0]);
    } catch (err) {
      console.log('WAL logs not accessible (may require superuser permissions)');
    }

    // Check for any message-related tables or backups
    console.log('\n🗄️  Checking for related tables...');
    const tables = await db.execute(sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE '%message%'
      OR table_name LIKE '%backup%'
      OR table_name LIKE '%archive%';
    `);

    if (tables.length > 0) {
      console.log('Found related tables:');
      tables.forEach((table: any) => {
        console.log(`- ${table.table_name}`);
      });
    } else {
      console.log('No backup or archive tables found.');
    }

    console.log('\n✅ Database check complete.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking database:', error);
    process.exit(1);
  }
}

checkForDeletedMessages();
