import postgres from 'postgres';
import { config } from 'dotenv';
import { resolve } from 'path';
import { readFileSync } from 'fs';

// Load environment variables
config({ path: resolve(process.cwd(), '.env'), override: true });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set');
}

async function applySoftDeleteMigration() {
  const client = postgres(process.env.DATABASE_URL!);

  try {
    console.log('Applying soft-delete migration...');

    // Read the migration file
    const migrationSQL = readFileSync(
      resolve(process.cwd(), 'drizzle/0008_mysterious_apocalypse.sql'),
      'utf-8'
    );

    // Split by statement breakpoint and execute each statement
    const statements = migrationSQL
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 80)}...`);
      await client.unsafe(statement);
    }

    console.log('✓ Soft-delete migration applied successfully!');
    console.log('\nAdded columns:');
    console.log('- deleted_at (timestamp)');
    console.log('- deleted_by (text)');
    console.log('\nTo tables:');
    console.log('- users, accounts, transactions, loans');
    console.log('- fixed_savings, deposits, loan_repayments');
    console.log('- debit_cards, debit_card_pins, transaction_pins');
    console.log('- messages (deleted_by only), aml_alerts');

  } catch (error) {
    console.error('Error applying migration:', error);
    throw error;
  } finally {
    await client.end();
  }
}

applySoftDeleteMigration();
