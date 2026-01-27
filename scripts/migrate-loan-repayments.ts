import { neon } from '@neondatabase/serverless';

async function migrateLoanRepayments() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }

  const sql = neon(databaseUrl);

  try {
    console.log('Starting migration for loan_repayments table...');

    // Add missing columns
    await sql`
      ALTER TABLE loan_repayments
      ADD COLUMN IF NOT EXISTS payment_method varchar(50),
      ADD COLUMN IF NOT EXISTS payment_proof text,
      ADD COLUMN IF NOT EXISTS status varchar(20) DEFAULT 'PENDING',
      ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now()
    `;

    console.log('Columns added successfully.');

    // Update existing rows
    await sql`
      UPDATE loan_repayments
      SET payment_method = 'BALANCE',
          status = 'APPROVED',
          updated_at = created_at
      WHERE payment_method IS NULL
    `;

    console.log('Existing rows updated.');

    // Make columns NOT NULL
    await sql`
      ALTER TABLE loan_repayments
      ALTER COLUMN payment_method SET NOT NULL
    `;

    await sql`
      ALTER TABLE loan_repayments
      ALTER COLUMN status SET NOT NULL
    `;

    await sql`
      ALTER TABLE loan_repayments
      ALTER COLUMN updated_at SET NOT NULL
    `;

    console.log('Constraints applied successfully.');
    console.log('Migration completed!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

migrateLoanRepayments()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
