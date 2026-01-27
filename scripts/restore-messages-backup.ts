import 'dotenv/config';
import { db } from '../server/db';
import { messages } from '../shared/schema';

/**
 * Script to create backup and restore utilities for messages
 */

async function createBackupUtilities() {
  try {
    console.log('🔧 Setting up message backup and restore utilities...\n');

    // Export current messages to JSON
    const allMessages = await db.select().from(messages);

    console.log(`📊 Current database state: ${allMessages.length} messages found`);

    if (allMessages.length > 0) {
      const backupData = {
        exportDate: new Date().toISOString(),
        totalMessages: allMessages.length,
        messages: allMessages
      };

      const fs = require('fs');
      const path = require('path');

      const backupDir = path.join(__dirname, '../backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const backupFile = path.join(backupDir, `messages-backup-${Date.now()}.json`);
      fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));

      console.log(`✅ Backup created: ${backupFile}`);
      console.log('\nTo restore from this backup, run:');
      console.log(`npm run restore-messages ${path.basename(backupFile)}`);
    } else {
      console.log('⚠️  No messages to backup. Database is empty.');
    }

    console.log('\n📋 Message Summary:');
    console.log('==================');

    const userMessages = allMessages.filter(m => m.senderType === 'user' || !m.senderType);
    const adminMessages = allMessages.filter(m => m.senderType === 'admin');

    console.log(`User messages: ${userMessages.length}`);
    console.log(`Admin messages: ${adminMessages.length}`);
    console.log(`Total: ${allMessages.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating backup:', error);
    process.exit(1);
  }
}

createBackupUtilities();
