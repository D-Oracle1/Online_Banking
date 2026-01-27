import { Resend } from 'resend';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env') });

async function testResend() {
  console.log('=== Resend Email Test ===\n');

  // Check if API key is set
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY is not set in .env file');
    console.log('\nPlease add RESEND_API_KEY to your .env file\n');
    process.exit(1);
  }

  console.log('Configuration:');
  console.log('  RESEND_API_KEY:', process.env.RESEND_API_KEY.substring(0, 10) + '...');
  console.log('  RESEND_FROM_EMAIL:', process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev');
  console.log('  SMTP_FROM_NAME:', process.env.SMTP_FROM_NAME || 'Sterling Capital Bank');
  console.log('');

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Use onboarding@resend.dev for testing (always works)
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const fromName = process.env.SMTP_FROM_NAME || 'Sterling Capital Bank';

    // Send to delivered@resend.dev (Resend's test inbox)
    const testEmail = 'delivered@resend.dev';

    console.log('Sending test email...');
    console.log(`From: ${fromName} <${fromEmail}>`);
    console.log(`To: ${testEmail}\n`);

    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: [testEmail],
      subject: 'Test Email from NextBanker - Sterling Capital Bank',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .success-badge {
              background: #10b981;
              color: white;
              padding: 10px 20px;
              border-radius: 20px;
              display: inline-block;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Resend Test Successful!</h1>
            </div>
            <div class="content">
              <div class="success-badge">Email Delivery Working</div>
              <p>Congratulations! Your Resend email configuration is working correctly.</p>
              <p>This test email was sent from your NextBanker application using Resend API.</p>
              <hr>
              <p style="font-size: 12px; color: #666;">
                Sent at: ${new Date().toLocaleString()}<br>
                Service: Resend<br>
                From: NextBanker Test Script
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Resend Test Successful!

        Your Resend email configuration is working correctly.
        This test email was sent from your NextBanker application.

        Sent at: ${new Date().toLocaleString()}
        Service: Resend
      `,
    });

    if (error) {
      console.error('❌ Error sending email:', error);
      process.exit(1);
    }

    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', data?.id);
    console.log('\n=== Next Steps ===');
    console.log('Your email system is now configured and working!');
    console.log('\nFor production:');
    console.log('1. Add your domain at https://resend.com/domains');
    console.log('2. Verify DNS records (SPF, DKIM)');
    console.log('3. Update RESEND_FROM_EMAIL to use your domain (e.g., noreply@sterlingcapitalbank.com)');
    console.log('\nYour NextBanker app will now send OTP and transaction emails successfully!\n');

  } catch (error: any) {
    console.error('\n❌ Resend Test Failed!\n');
    console.error('Error:', error.message);

    if (error.message.includes('API key')) {
      console.log('\n=== Troubleshooting ===');
      console.log('1. Check that your API key is valid');
      console.log('2. Make sure it starts with "re_"');
      console.log('3. Create a new API key at https://resend.com/api-keys\n');
    }

    process.exit(1);
  }
}

testResend();
