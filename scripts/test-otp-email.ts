import { sendOTPEmail } from '../lib/email';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env') });

async function testOTPEmail() {
  console.log('=== Testing OTP Email Function ===\n');

  const testEmail = 'delivered@resend.dev'; // Resend's test inbox
  const testOTP = '123456';
  const testName = 'Test User';

  console.log('Sending OTP email...');
  console.log(`To: ${testEmail}`);
  console.log(`OTP: ${testOTP}`);
  console.log(`Name: ${testName}\n`);

  try {
    const result = await sendOTPEmail(testEmail, testOTP, testName);
    console.log('✅ OTP email sent successfully!');
    console.log('Result:', result);
  } catch (error: any) {
    console.error('❌ Failed to send OTP email!');
    console.error('Error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testOTPEmail();
