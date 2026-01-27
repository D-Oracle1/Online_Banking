import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

async function resetAdminPassword() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }

  const sql = neon(databaseUrl);

  // New password
  const newPassword = 'Admin123!@#';
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  console.log('🔄 Resetting admin password...\n');

  // Update admin password
  const result = await sql`
    UPDATE users
    SET password = ${hashedPassword}
    WHERE role = 'admin'
    RETURNING username, email
  `;

  if (result.length === 0) {
    console.log('❌ No admin account found!');
    return;
  }

  console.log('✅ Admin password reset successfully!\n');
  console.log('==========================================');
  console.log('📧 Admin Login Credentials:');
  console.log('==========================================');
  result.forEach((admin) => {
    console.log(`Username: ${admin.username}`);
    console.log(`Email:    ${admin.email}`);
  });
  console.log(`Password: ${newPassword}`);
  console.log('==========================================\n');
  console.log('🌐 Login at: http://localhost:5000/login\n');
  console.log('⚠️  Remember to change this password after logging in!\n');
}

resetAdminPassword()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
