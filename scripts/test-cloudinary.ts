import { v2 as cloudinary } from 'cloudinary';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env') });

async function testCloudinary() {
  console.log('=== Cloudinary Configuration Test ===\n');

  // Check if credentials are set
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  console.log('Configuration:');
  console.log('  CLOUDINARY_CLOUD_NAME:', cloudName || '❌ NOT SET');
  console.log('  CLOUDINARY_API_KEY:', apiKey ? '✅ SET' : '❌ NOT SET');
  console.log('  CLOUDINARY_API_SECRET:', apiSecret ? '✅ SET' : '❌ NOT SET');
  console.log('');

  if (!cloudName || !apiKey || !apiSecret) {
    console.error('❌ Cloudinary credentials are not properly configured');
    process.exit(1);
  }

  // Configure Cloudinary
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  try {
    console.log('Testing Cloudinary connection...\n');

    // Test by checking account details
    const result = await cloudinary.api.ping();

    console.log('✅ Cloudinary connection successful!');
    console.log('Status:', result.status);
    console.log('\n=== Configuration is Ready ===');
    console.log('Your NextBanker app can now upload profile pictures!');
    console.log('\nImages will be stored at:');
    console.log(`https://res.cloudinary.com/${cloudName}/image/upload/nextbanker/\n`);

  } catch (error: any) {
    console.error('\n❌ Cloudinary Test Failed!\n');
    console.error('Error:', error.message);

    if (error.error?.message) {
      console.error('Details:', error.error.message);
    }

    console.log('\n=== Troubleshooting ===');
    console.log('1. Verify your credentials at: https://cloudinary.com/console');
    console.log('2. Check that Cloud Name, API Key, and API Secret are correct');
    console.log('3. Make sure your Cloudinary account is active\n');

    process.exit(1);
  }
}

testCloudinary();
