import 'dotenv/config';
import { db } from '../server/db';
import { messages } from '../shared/schema';
import { desc } from 'drizzle-orm';

async function checkMessages() {
  try {
    console.log('Checking messages in database...\n');

    const allMessages = await db
      .select()
      .from(messages)
      .orderBy(desc(messages.createdAt))
      .limit(50);

    console.log(`Total messages found: ${allMessages.length}\n`);

    if (allMessages.length > 0) {
      console.log('Recent messages:');
      console.log('================');

      allMessages.forEach((msg, index) => {
        console.log(`\n${index + 1}. Message ID: ${msg.id}`);
        console.log(`   User ID: ${msg.userId}`);
        console.log(`   Sender Type: ${msg.senderType || 'user'}`);
        console.log(`   Sent By: ${msg.sentBy || 'N/A'}`);
        console.log(`   Message: ${msg.message?.substring(0, 100)}${msg.message && msg.message.length > 100 ? '...' : ''}`);
        console.log(`   Has Attachment: ${msg.attachment ? 'Yes' : 'No'}`);
        console.log(`   Response: ${msg.response ? msg.response.substring(0, 100) : 'None'}${msg.response && msg.response.length > 100 ? '...' : ''}`);
        console.log(`   Is Read: ${msg.isRead}`);
        console.log(`   Created: ${msg.createdAt}`);
      });
    } else {
      console.log('No messages found in database.');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error checking messages:', error);
    process.exit(1);
  }
}

checkMessages();
