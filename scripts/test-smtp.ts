import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env') });

async function testSMTPConnection() {
  console.log('=== SMTP Connection Test ===\n');

  // Display configuration (hide password)
  console.log('Configuration:');
  console.log('  SMTP_HOST:', process.env.SMTP_HOST);
  console.log('  SMTP_PORT:', process.env.SMTP_PORT);
  console.log('  SMTP_SECURE:', process.env.SMTP_SECURE);
  console.log('  SMTP_USER:', process.env.SMTP_USER);
  console.log('  SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '***SET***' : '***NOT SET***');
  console.log('  SMTP_FROM_NAME:', process.env.SMTP_FROM_NAME);
  console.log('  SMTP_FROM_EMAIL:', process.env.SMTP_FROM_EMAIL);
  console.log('');

  // Create transporter with the same config as lib/email.ts
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
    debug: true, // Enable debug output
    logger: true, // Enable logger
  });

  try {
    console.log('Testing SMTP connection...\n');

    // Verify connection
    await transporter.verify();
    console.log('\n✅ SMTP connection successful!\n');

    // Try sending a test email
    console.log('Sending test email...\n');
    const testEmail = process.env.SMTP_USER; // Send to yourself

    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Test'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: testEmail,
      subject: 'SMTP Test - NextBanker',
      text: 'This is a test email from your NextBanker application. If you received this, your SMTP configuration is working correctly!',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #1e3a8a;">SMTP Test Successful!</h2>
          <p>This is a test email from your NextBanker application.</p>
          <p>If you received this, your SMTP configuration is working correctly!</p>
          <hr>
          <p style="font-size: 12px; color: #666;">
            Sent at: ${new Date().toLocaleString()}<br>
            From: NextBanker SMTP Test Script
          </p>
        </div>
      `,
    });

    console.log('\n✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    console.log('\nCheck your email inbox at:', testEmail);

  } catch (error: any) {
    console.error('\n❌ SMTP Test Failed!\n');
    console.error('Error Type:', error.constructor.name);
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);

    if (error.response) {
      console.error('Server Response:', error.response);
    }

    if (error.responseCode) {
      console.error('Response Code:', error.responseCode);
    }

    console.error('\nFull Error:', error);

    console.log('\n=== Troubleshooting Tips ===');
    console.log('1. Check that SMTP_USER and SMTP_PASSWORD are correct');
    console.log('2. For Zoho: Make sure you\'re using your email and password (not app password)');
    console.log('3. Check if your email provider requires "Less Secure Apps" to be enabled');
    console.log('4. Verify that the email account exists and is active');
    console.log('5. Check firewall settings - port 587 must be open');
    console.log('6. Try using Gmail instead with an App Password if Zoho fails\n');

    process.exit(1);
  }
}

testSMTPConnection();
