import { db } from '../server/db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function updateAdminEmail() {
  try {
    // Find the admin user
    const adminUsers = await db
      .select()
      .from(users)
      .where(eq(users.role, 'admin'));

    if (adminUsers.length === 0) {
      console.log('No admin user found');
      return;
    }

    console.log('\nCurrent admin users:');
    adminUsers.forEach((admin, index) => {
      console.log(`${index + 1}. Email: ${admin.email}, Username: ${admin.username}`);
    });

    // Update the first admin user's email to admin@sterlingcapitalbank.org
    const oldEmail = adminUsers[0].email;
    const newEmail = 'admin@sterlingcapitalbank.org';

    if (oldEmail === newEmail) {
      console.log(`\nAdmin email is already set to ${newEmail}`);
      return;
    }

    await db
      .update(users)
      .set({ email: newEmail })
      .where(eq(users.id, adminUsers[0].id));

    console.log(`\n✓ Successfully updated admin email from ${oldEmail} to ${newEmail}`);
    console.log('\nAdmin user details:');
    console.log(`- ID: ${adminUsers[0].id}`);
    console.log(`- Username: ${adminUsers[0].username}`);
    console.log(`- Full Name: ${adminUsers[0].fullName}`);
    console.log(`- New Email: ${newEmail}`);

  } catch (error) {
    console.error('Error updating admin email:', error);
  } finally {
    process.exit(0);
  }
}

updateAdminEmail();
