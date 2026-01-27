import { db } from '../server/db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function setSuperAdmin() {
  try {
    const email = 'effizydonjoe@gmail.com';

    console.log(`Setting super admin for: ${email}...`);

    const result = await db
      .update(users)
      .set({ isSuperAdmin: true })
      .where(eq(users.email, email))
      .returning();

    if (result.length > 0) {
      console.log('✅ Super admin status granted successfully!');
      console.log(`User: ${result[0].fullName} (${result[0].email})`);
      console.log(`Username: ${result[0].username}`);
    } else {
      console.log('❌ User not found with that email');
    }

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setSuperAdmin();
