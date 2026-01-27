import { neon } from '@neondatabase/serverless';

async function migrateUserVerification() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }

  const sql = neon(databaseUrl);

  console.log('🔄 Adding user verification fields...\n');

  try {
    // Add new columns for comprehensive user verification
    await sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS phone_number varchar(20),
      ADD COLUMN IF NOT EXISTS date_of_birth date,
      ADD COLUMN IF NOT EXISTS gender varchar(10),
      ADD COLUMN IF NOT EXISTS nationality varchar(50),
      ADD COLUMN IF NOT EXISTS address text,
      ADD COLUMN IF NOT EXISTS city varchar(100),
      ADD COLUMN IF NOT EXISTS state varchar(100),
      ADD COLUMN IF NOT EXISTS postal_code varchar(20),
      ADD COLUMN IF NOT EXISTS country varchar(100),
      ADD COLUMN IF NOT EXISTS occupation varchar(100),
      ADD COLUMN IF NOT EXISTS employer varchar(200),
      ADD COLUMN IF NOT EXISTS annual_income varchar(50),
      ADD COLUMN IF NOT EXISTS profile_photo text,
      ADD COLUMN IF NOT EXISTS id_type varchar(50),
      ADD COLUMN IF NOT EXISTS id_number varchar(100),
      ADD COLUMN IF NOT EXISTS id_document text,
      ADD COLUMN IF NOT EXISTS email_otp varchar(10),
      ADD COLUMN IF NOT EXISTS otp_expires_at timestamp,
      ADD COLUMN IF NOT EXISTS verification_status varchar(20) DEFAULT 'pending'
    `;

    console.log('✅ Successfully added user verification fields!');
    console.log('\nNew fields added:');
    console.log('- Personal Info: phone_number, date_of_birth, gender, nationality');
    console.log('- Address: address, city, state, postal_code, country');
    console.log('- Employment: occupation, employer, annual_income');
    console.log('- Verification: profile_photo, id_type, id_number, id_document');
    console.log('- OTP: email_otp, otp_expires_at');
    console.log('- Status: verification_status\n');
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
}

migrateUserVerification()
  .then(() => {
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  });
