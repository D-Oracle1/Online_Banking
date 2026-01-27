const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

// Load .env file manually
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^['"]|['"]$/g, '');
      process.env[key] = value;
    }
  });
}

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in .env file');
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  console.log('Running migrations...\n');

  try {
    // 1. Add isEmailVerified to users table
    console.log('1. Adding isEmailVerified column to users table...');
    await sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN NOT NULL DEFAULT FALSE
    `;
    console.log('   ✅ Done\n');

    // 2. Add loan fields
    console.log('2. Adding new fields to loans table...');
    await sql`
      ALTER TABLE loans
      ADD COLUMN IF NOT EXISTS interest_rate DECIMAL(5, 2),
      ADD COLUMN IF NOT EXISTS total_repayment DECIMAL(15, 2),
      ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
      ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP
    `;
    console.log('   ✅ Done\n');

    // 3. Create email_otps table
    console.log('3. Creating email_otps table...');
    await sql`
      CREATE TABLE IF NOT EXISTS email_otps (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        otp TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        is_used BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_email_otps_user ON email_otps(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_email_otps_expires ON email_otps(expires_at)`;
    console.log('   ✅ Done\n');

    // 4. Create loan_repayments table
    console.log('4. Creating loan_repayments table...');
    await sql`
      CREATE TABLE IF NOT EXISTS loan_repayments (
        id TEXT PRIMARY KEY,
        loan_id TEXT NOT NULL REFERENCES loans(id),
        amount DECIMAL(15, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_loan_repayments_loan ON loan_repayments(loan_id)`;
    console.log('   ✅ Done\n');

    console.log('✅ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
