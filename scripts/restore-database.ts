import 'dotenv/config';
import { db } from '../server/db';
import { messages } from '../shared/schema';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Restore database from backup
 * Usage: npm run restore-database <backup-file>
 */

async function restoreDatabase() {
  try {
    const backupFileName = process.argv[2];

    if (!backupFileName) {
      console.log('❌ Please specify a backup file to restore from.');
      console.log('\nUsage: npm run restore-database <backup-file>');
      console.log('\nAvailable backups:');

      const backupDir = path.join(__dirname, '../backups');
      if (fs.existsSync(backupDir)) {
        const backups = fs.readdirSync(backupDir)
          .filter(f => f.endsWith('.json'))
          .sort()
          .reverse();

        backups.forEach(file => {
          const filePath = path.join(backupDir, file);
          const stats = fs.statSync(filePath);
          console.log(`  - ${file} (${new Date(stats.mtime).toLocaleString()})`);
        });
      }

      process.exit(1);
    }

    const backupDir = path.join(__dirname, '../backups');
    const backupFile = path.join(backupDir, backupFileName);

    if (!fs.existsSync(backupFile)) {
      console.log(`❌ Backup file not found: ${backupFile}`);
      process.exit(1);
    }

    console.log(`🔄 Restoring database from ${backupFileName}...\n`);

    // Read backup file
    const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));

    console.log('📋 Backup Information:');
    console.log(`   Date: ${backupData.backupDate}`);
    console.log(`   Version: ${backupData.version}`);
    console.log(`   Messages: ${backupData.stats.messages}`);
    console.log(`   Users: ${backupData.stats.users}`);
    console.log(`   Transactions: ${backupData.stats.transactions}\n`);

    // Ask for confirmation
    console.log('⚠️  WARNING: This will replace existing messages in the database!');
    console.log('   Current messages will be backed up first.\n');

    // Create a backup of current state
    console.log('📦 Creating backup of current state...');
    const currentMessages = await db.select().from(messages);
    const currentBackupFile = path.join(backupDir, `pre-restore-backup-${Date.now()}.json`);
    fs.writeFileSync(currentBackupFile, JSON.stringify({
      backupDate: new Date().toISOString(),
      messages: currentMessages
    }, null, 2));
    console.log(`   Current state saved to: ${path.basename(currentBackupFile)}\n`);

    // Restore messages
    console.log('📧 Restoring messages...');
    await db.delete(messages); // Clear existing messages

    if (backupData.data.messages && backupData.data.messages.length > 0) {
      for (const msg of backupData.data.messages) {
        await db.insert(messages).values(msg);
      }
      console.log(`   Restored ${backupData.data.messages.length} messages`);
    }

    console.log('\n✅ Database restored successfully!');
    console.log(`\nTo undo this restore, run:`);
    console.log(`npm run restore-database ${path.basename(currentBackupFile)}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error restoring database:', error);
    process.exit(1);
  }
}

restoreDatabase();
