import { db } from '../server/db';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function runSQL() {
  try {
    console.log('Reading SQL file...');
    const sqlFile = fs.readFileSync(
      path.join(__dirname, 'create-pending-registrations.sql'),
      'utf-8'
    );

    console.log('Executing SQL...\n');
    console.log(sqlFile);
    console.log('\n');

    await db.execute(sql.raw(sqlFile));

    console.log('✅ Table created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating table:', error);
    process.exit(1);
  }
}

runSQL();
