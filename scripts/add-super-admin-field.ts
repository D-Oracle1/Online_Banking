import { db } from '../server/db';
import { sql } from 'drizzle-orm';

async function addSuperAdminField() {
  try {
    console.log('Adding is_super_admin field to users table...');

    await db.execute(sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS is_super_admin boolean NOT NULL DEFAULT false
    `);

    console.log('✅ Super admin field added successfully!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addSuperAdminField();
