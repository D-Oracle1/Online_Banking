import { neon } from '@neondatabase/serverless';

async function addIndexes() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }

  const sql = neon(databaseUrl);

  try {
    console.log('Adding database indexes for better performance...');

    // Index for user lookups by email (login)
    await sql`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`;
    console.log('✓ Created index on users.email');

    // Index for user lookups by username
    await sql`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`;
    console.log('✓ Created index on users.username');

    // Index for account lookups by user_id
    await sql`CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id)`;
    console.log('✓ Created index on accounts.user_id');

    // Index for account lookups by account_number
    await sql`CREATE INDEX IF NOT EXISTS idx_accounts_account_number ON accounts(account_number)`;
    console.log('✓ Created index on accounts.account_number');

    // Index for transaction lookups by account_id
    await sql`CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id)`;
    console.log('✓ Created index on transactions.account_id');

    // Index for transaction lookups by created_at (for recent transactions)
    await sql`CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC)`;
    console.log('✓ Created index on transactions.created_at');

    // Index for loan lookups by user_id
    await sql`CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id)`;
    console.log('✓ Created index on loans.user_id');

    // Index for loan lookups by status
    await sql`CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status)`;
    console.log('✓ Created index on loans.status');

    // Composite index for loan lookups by user_id and status
    await sql`CREATE INDEX IF NOT EXISTS idx_loans_user_status ON loans(user_id, status)`;
    console.log('✓ Created index on loans(user_id, status)');

    // Index for deposit lookups by user_id
    await sql`CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON deposits(user_id)`;
    console.log('✓ Created index on deposits.user_id');

    // Index for deposit lookups by status
    await sql`CREATE INDEX IF NOT EXISTS idx_deposits_status ON deposits(status)`;
    console.log('✓ Created index on deposits.status');

    // Index for deposit lookups by account_id
    await sql`CREATE INDEX IF NOT EXISTS idx_deposits_account_id ON deposits(account_id)`;
    console.log('✓ Created index on deposits.account_id');

    // Index for loan repayment lookups by loan_id
    await sql`CREATE INDEX IF NOT EXISTS idx_loan_repayments_loan_id ON loan_repayments(loan_id)`;
    console.log('✓ Created index on loan_repayments.loan_id');

    // Index for loan repayment lookups by status
    await sql`CREATE INDEX IF NOT EXISTS idx_loan_repayments_status ON loan_repayments(status)`;
    console.log('✓ Created index on loan_repayments.status');

    // Index for message lookups by user_id
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id)`;
    console.log('✓ Created index on messages.user_id');

    // Index for message lookups by is_read status
    await sql`CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read)`;
    console.log('✓ Created index on messages.is_read');

    // Index for debit card lookups by user_id
    await sql`CREATE INDEX IF NOT EXISTS idx_debit_cards_user_id ON debit_cards(user_id)`;
    console.log('✓ Created index on debit_cards.user_id');

    // Index for debit card lookups by account_id
    await sql`CREATE INDEX IF NOT EXISTS idx_debit_cards_account_id ON debit_cards(account_id)`;
    console.log('✓ Created index on debit_cards.account_id');

    // Index for transaction PIN lookups by user_id
    await sql`CREATE INDEX IF NOT EXISTS idx_transaction_pins_user_id ON transaction_pins(user_id)`;
    console.log('✓ Created index on transaction_pins.user_id');

    // Index for email OTP lookups by user_id
    await sql`CREATE INDEX IF NOT EXISTS idx_email_otps_user_id ON email_otps(user_id)`;
    console.log('✓ Created index on email_otps.user_id');

    // Index for email OTP lookups by is_used and expires_at
    await sql`CREATE INDEX IF NOT EXISTS idx_email_otps_used_expires ON email_otps(is_used, expires_at)`;
    console.log('✓ Created index on email_otps(is_used, expires_at)');

    console.log('\n✅ All indexes created successfully!');
    console.log('Database queries should now be much faster.');
  } catch (error) {
    console.error('Error creating indexes:', error);
    throw error;
  }
}

addIndexes()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
