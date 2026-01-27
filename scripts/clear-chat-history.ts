import { db } from '../server/db';
import { messages } from '../shared/schema';

/**
 * Script to clear all chat/message history from the database
 * This will permanently delete all messages (both user and admin messages)
 */
async function clearAllChatHistory() {
  try {
    console.log('🗑️  Starting to clear all chat history...');

    // Delete all messages from the database
    const result = await db.delete(messages);

    console.log('✅ Successfully cleared all chat history!');
    console.log('📊 All messages have been permanently deleted from the database.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing chat history:', error);
    process.exit(1);
  }
}

// Run the script
clearAllChatHistory();
