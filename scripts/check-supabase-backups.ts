import 'dotenv/config';
import { db } from '../server/db';
import { sql } from 'drizzle-orm';

/**
 * Check if Supabase has any point-in-time recovery options
 */

async function checkSupabaseBackups() {
  try {
    console.log('🔍 Checking Supabase for backup and recovery options...\n');

    // Check database version and features
    console.log('📊 Database Information:');
    const versionInfo = await db.execute(sql`SELECT version();`);
    console.log('PostgreSQL Version:', versionInfo[0]?.version);

    // Check if we can see recent transactions (WAL)
    console.log('\n🕐 Checking transaction log accessibility...');
    try {
      const walInfo = await db.execute(sql`
        SELECT
          pg_current_wal_lsn() as current_lsn,
          pg_wal_lsn_diff(pg_current_wal_lsn(), '0/0') / 1024 / 1024 as mb_written;
      `);
      console.log('WAL LSN:', walInfo[0]);
    } catch (err: any) {
      console.log('❌ Cannot access WAL logs (requires superuser)');
      console.log('   You may need to use Supabase Dashboard for point-in-time recovery');
    }

    // Check for any message history or audit tables
    console.log('\n🗄️  Checking for audit/history tables...');
    const tables = await db.execute(sql`
      SELECT table_name, table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND (
        table_name LIKE '%audit%'
        OR table_name LIKE '%history%'
        OR table_name LIKE '%log%'
        OR table_name LIKE '%backup%'
      )
      ORDER BY table_name;
    `);

    if (tables.length > 0) {
      console.log('Found audit/history tables:');
      tables.forEach((table: any) => {
        console.log(`  - ${table.table_name} (${table.table_type})`);
      });
    } else {
      console.log('No audit or history tables found.');
    }

    // Check message table for any deleted_at or archived columns
    console.log('\n📋 Checking messages table structure...');
    const columns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'messages'
      ORDER BY ordinal_position;
    `);

    console.log('Messages table columns:');
    columns.forEach((col: any) => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    const hasDeletedAt = columns.some((col: any) =>
      col.column_name.toLowerCase().includes('deleted') ||
      col.column_name.toLowerCase().includes('archived')
    );

    if (hasDeletedAt) {
      console.log('\n✅ Table has soft-delete columns! Checking for deleted messages...');
      const deletedMessages = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM messages
        WHERE deleted_at IS NOT NULL OR archived_at IS NOT NULL;
      `);
      console.log(`Found ${deletedMessages[0]?.count || 0} soft-deleted messages`);
    } else {
      console.log('\n❌ No soft-delete columns found - deleted messages are permanently removed');
    }

    console.log('\n' + '='.repeat(60));
    console.log('📝 RECOVERY OPTIONS:');
    console.log('='.repeat(60));
    console.log('\n1. Supabase Dashboard Point-in-Time Recovery (if on Pro plan):');
    console.log('   - Visit: https://supabase.com/dashboard');
    console.log('   - Go to your project → Database → Backups');
    console.log('   - Select a backup before messages were deleted');
    console.log('   - Restore to that point in time');

    console.log('\n2. Check Supabase Backup Policies:');
    console.log('   - Free tier: Limited or no backups');
    console.log('   - Pro tier: Daily backups, 7-day retention');
    console.log('   - Enterprise: Custom backup policies');

    console.log('\n3. Manual Backup Files:');
    console.log('   - Check backups/ directory for any older backups');
    console.log('   - Run: ls -lh backups/');

    console.log('\n❗ IMPORTANT:');
    console.log('   If old messages were deleted more than 7 days ago,');
    console.log('   they may not be recoverable even with Pro plan.');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking Supabase:', error);
    process.exit(1);
  }
}

checkSupabaseBackups();
