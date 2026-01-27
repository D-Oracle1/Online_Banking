import 'dotenv/config';
import { db } from '../server/db';
import { messages } from '../shared/schema';

/**
 * Script to create sample messages for testing
 */

async function createSampleMessages() {
  try {
    console.log('📝 Creating sample messages...\n');

    const sampleMessages = [
      {
        id: `msg-${Date.now()}-sample1`,
        userId: 'guest-1762500000000-sample',
        message: 'Hello! I need help with my account balance.',
        attachment: null,
        response: null,
        isRead: false,
        senderType: 'user',
        sentBy: 'John Doe',
        createdAt: new Date(Date.now() - 3600000 * 24), // 1 day ago
      },
      {
        id: `msg-${Date.now()}-sample2`,
        userId: 'guest-1762500000000-sample',
        message: 'Thank you for contacting support! How can we assist you today?',
        attachment: null,
        response: null,
        isRead: true,
        senderType: 'admin',
        sentBy: 'Support Team',
        createdAt: new Date(Date.now() - 3600000 * 23), // 23 hours ago
      },
      {
        id: `msg-${Date.now()}-sample3`,
        userId: 'guest-1762600000000-sample2',
        message: 'I want to know about loan options.',
        attachment: null,
        response: 'We offer personal loans, business loans, and mortgages. Would you like more details?',
        isRead: true,
        senderType: 'user',
        sentBy: 'Jane Smith',
        createdAt: new Date(Date.now() - 3600000 * 12), // 12 hours ago
      },
      {
        id: `msg-${Date.now()}-sample4`,
        userId: 'guest-1762600000000-sample2',
        message: 'Our loan options include:\n1. Personal Loans: 5-10% APR\n2. Business Loans: 4-8% APR\n3. Mortgages: 3-6% APR\n\nWould you like to apply?',
        attachment: null,
        response: null,
        isRead: true,
        senderType: 'admin',
        sentBy: 'Support Team',
        createdAt: new Date(Date.now() - 3600000 * 11), // 11 hours ago
      },
      {
        id: `msg-${Date.now()}-sample5`,
        userId: 'guest-1762700000000-sample3',
        message: 'How do I reset my password?',
        attachment: null,
        response: 'Please visit the forgot password page and follow the instructions.',
        isRead: true,
        senderType: 'user',
        sentBy: 'Bob Johnson',
        createdAt: new Date(Date.now() - 3600000 * 6), // 6 hours ago
      },
    ];

    for (const msg of sampleMessages) {
      await db.insert(messages).values(msg);
      console.log(`✅ Created: ${msg.senderType === 'admin' ? 'Admin' : 'User'} message from ${msg.sentBy}`);
    }

    console.log(`\n🎉 Successfully created ${sampleMessages.length} sample messages!`);
    console.log('\nThese messages demonstrate:');
    console.log('- User messages from guests');
    console.log('- Admin responses');
    console.log('- Different timestamps');
    console.log('- Various conversation threads');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating sample messages:', error);
    process.exit(1);
  }
}

createSampleMessages();
