import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

async function checkAndCreateAdmin() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
  }

  const sql = neon(databaseUrl);

  console.log('🔍 Checking for existing admin users...\n');

  // Check for admin users
  const admins = await sql`
    SELECT id, username, email, full_name as "fullName", role, created_at as "createdAt"
    FROM users
    WHERE role = 'admin'
    ORDER BY created_at DESC
  `;

  if (admins.length > 0) {
    console.log('✅ Found existing admin account(s):\n');
    admins.forEach((admin, index) => {
      console.log(`Admin ${index + 1}:`);
      console.log(`  Username: ${admin.username}`);
      console.log(`  Email: ${admin.email}`);
      console.log(`  Full Name: ${admin.fullName}`);
      console.log(`  Created: ${admin.createdAt}`);
      console.log('');
    });
    console.log('⚠️  For security reasons, passwords are not displayed.');
    console.log('⚠️  If you forgot your password, you can reset it via the reset password endpoint.');
    return;
  }

  console.log('❌ No admin accounts found.\n');
  console.log('📝 Creating new admin account...\n');

  // Generate IDs
  const userId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const accountId = `acc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const cardId = `card-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  // Generate account number (10 digits)
  const accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();

  // Generate card number (16 digits)
  const cardNumber = Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join('');

  // Generate CVV
  const cvv = Math.floor(100 + Math.random() * 900).toString();

  // Generate expiry date (5 years from now)
  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 5);
  const expiryMonth = String(expiryDate.getMonth() + 1).padStart(2, '0');
  const expiryYear = String(expiryDate.getFullYear()).slice(-2);
  const expiry = `${expiryMonth}/${expiryYear}`;

  // Admin credentials
  const adminData = {
    username: 'admin',
    email: 'admin@sterlingcapitalbank.org',
    password: 'Admin123!@#',
    fullName: 'System Administrator',
  };

  // Hash password
  const hashedPassword = await bcrypt.hash(adminData.password, 10);

  // Create admin user
  await sql`
    INSERT INTO users (id, username, email, password, full_name, role, has_seen_welcome, created_at)
    VALUES (
      ${userId},
      ${adminData.username},
      ${adminData.email},
      ${hashedPassword},
      ${adminData.fullName},
      'admin',
      true,
      NOW()
    )
  `;

  // Create account
  await sql`
    INSERT INTO accounts (id, user_id, account_number, account_type, balance, is_activated, created_at)
    VALUES (
      ${accountId},
      ${userId},
      ${accountNumber},
      'Basic Savings',
      '0.00',
      true,
      NOW()
    )
  `;

  // Create debit card
  await sql`
    INSERT INTO debit_cards (id, user_id, account_id, card_number, cardholder_name, expiry_date, cvv, created_at)
    VALUES (
      ${cardId},
      ${userId},
      ${accountId},
      ${cardNumber},
      ${adminData.fullName},
      ${expiry},
      ${cvv},
      NOW()
    )
  `;

  console.log('✅ Admin account created successfully!\n');
  console.log('==========================================');
  console.log('📧 Login Credentials:');
  console.log('==========================================');
  console.log(`Username:       ${adminData.username}`);
  console.log(`Email:          ${adminData.email}`);
  console.log(`Password:       ${adminData.password}`);
  console.log(`Account Number: ${accountNumber}`);
  console.log('==========================================\n');
  console.log('🌐 Login at: http://localhost:5000/login');
  console.log('🌐 Or production: https://your-domain.vercel.app/login\n');
  console.log('⚠️  IMPORTANT: Change the default password after first login!\n');
}

checkAndCreateAdmin()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
