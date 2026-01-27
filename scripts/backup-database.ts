import 'dotenv/config';
import { db } from '../server/db';
import { messages, users, transactions } from '../shared/schema';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Automated database backup script
 * Run this regularly to create backups of important data
 */

async function backupDatabase() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    console.log(`🔄 Starting database backup at ${new Date().toISOString()}...\n`);

    // Create backups directory if it doesn't exist
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Backup messages
    console.log('📧 Backing up messages...');
    const allMessages = await db.select().from(messages);
    console.log(`   Found ${allMessages.length} messages`);

    // Backup users (without sensitive data like passwords)
    console.log('👥 Backing up users...');
    const allUsersRaw = await db.select().from(users);
    const allUsers = allUsersRaw.map(user => {
      const { password, twoFactorToken, ...safeUser } = user;
      return safeUser;
    });
    console.log(`   Found ${allUsers.length} users`);

    // Backup transactions
    console.log('💰 Backing up transactions...');
    const allTransactions = await db.select().from(transactions);
    console.log(`   Found ${allTransactions.length} transactions`);

    // Create backup object
    const backupData = {
      backupDate: new Date().toISOString(),
      version: '1.0',
      stats: {
        messages: allMessages.length,
        users: allUsers.length,
        transactions: allTransactions.length,
      },
      data: {
        messages: allMessages,
        users: allUsers,
        transactions: allTransactions,
      }
    };

    // Write backup to file
    const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));

    console.log('\n✅ Backup completed successfully!');
    console.log(`📁 Backup saved to: ${backupFile}`);
    console.log(`📊 Backup size: ${(fs.statSync(backupFile).size / 1024).toFixed(2)} KB`);

    console.log('\n📋 Backup Summary:');
    console.log('==================');
    console.log(`Messages: ${allMessages.length}`);
    console.log(`Users: ${allUsers.length}`);
    console.log(`Transactions: ${allTransactions.length}`);

    // Clean up old backups (keep last 10)
    const backupFiles = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
      .map(f => ({
        name: f,
        path: path.join(backupDir, f),
        time: fs.statSync(path.join(backupDir, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    if (backupFiles.length > 10) {
      console.log('\n🧹 Cleaning up old backups...');
      backupFiles.slice(10).forEach(file => {
        fs.unlinkSync(file.path);
        console.log(`   Deleted: ${file.name}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating backup:', error);
    process.exit(1);
  }
}

backupDatabase();
