/**
 * Test Database Connection Script
 *
 * Run this script to verify your database connection is working:
 * npx tsx scripts/test-db-connection.ts
 */

import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file
config({ path: resolve(process.cwd(), '.env') });

async function testConnection() {
  console.log('🔍 Testing database connection...\n');

  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL environment variable is not set!');
    console.log('\nPlease set DATABASE_URL in your .env file.\n');
    process.exit(1);
  }

  console.log('✓ DATABASE_URL found in environment variables');

  // Hide password in URL for display
  const urlForDisplay = process.env.DATABASE_URL.replace(
    /(:\/\/)([^:]+):([^@]+)(@)/,
    '$1$2:****$4'
  );
  console.log(`✓ Connection string: ${urlForDisplay}\n`);

  try {
    // Create connection
    const sql = neon(process.env.DATABASE_URL);

    // Test query
    console.log('⏳ Attempting to connect to database...');
    const result = await sql`SELECT version(), current_database(), current_user`;

    console.log('\n✅ SUCCESS! Database connection established.\n');
    console.log('Database Information:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Database: ${result[0].current_database}`);
    console.log(`User: ${result[0].current_user}`);
    console.log(`PostgreSQL Version: ${result[0].version?.split(' ')[1]}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Test table existence
    console.log('🔍 Checking for existing tables...');
    const tables = await sql`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;

    if (tables.length > 0) {
      console.log(`✓ Found ${tables.length} tables:`);
      tables.forEach((table) => {
        console.log(`  - ${table.tablename}`);
      });
      console.log('\n✅ Database schema exists!');
    } else {
      console.log('⚠️  No tables found. Run "npm run db:push" to create schema.');
    }

    console.log('\n✅ All checks passed! Your database is ready to use.\n');
    process.exit(0);

  } catch (error: any) {
    console.error('\n❌ Database connection failed!\n');
    console.error('Error Details:');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error(`Message: ${error.message}`);

    if (error.code) {
      console.error(`Code: ${error.code}`);
    }

    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Provide helpful suggestions
    console.log('💡 Troubleshooting Tips:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (error.message.includes('quota') || error.message.includes('exceeded')) {
      console.log('• Your database has exceeded its quota limits');
      console.log('• Solution: Switch to a different database provider (Supabase recommended)');
      console.log('• See SUPABASE-SETUP.md for migration guide');
    } else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
      console.log('• Connection timed out');
      console.log('• Check your internet connection');
      console.log('• Verify the database server is active');
      console.log('• Try using direct connection instead of pooler');
    } else if (error.message.includes('password') || error.message.includes('authentication')) {
      console.log('• Authentication failed');
      console.log('• Double-check your database password in .env');
      console.log('• Ensure DATABASE_URL is correctly formatted');
    } else if (error.message.includes('SSL') || error.message.includes('ssl')) {
      console.log('• SSL connection issue');
      console.log('• Add ?sslmode=require to your connection string');
    } else {
      console.log('• Verify DATABASE_URL in your .env file is correct');
      console.log('• Check if your database server is running');
      console.log('• Review the error message above for specific details');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(1);
  }
}

// Run the test
testConnection();
