/**
 * Script to create an admin account
 *
 * Usage:
 * 1. Make sure your dev server is running (npm run dev)
 * 2. Run: node scripts/create-admin.js
 */

const adminCredentials = {
  fullName: 'Admin User',
  username: 'admin',
  email: 'admin@sterlingcapitalbank.com',
  password: 'Admin123!@#'
};

async function createAdmin() {
  try {
    console.log('Creating admin account...');
    console.log('Credentials:', {
      username: adminCredentials.username,
      email: adminCredentials.email,
      password: adminCredentials.password
    });

    const response = await fetch('http://localhost:3000/api/auth/signup-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adminCredentials)
    });

    const data = await response.json();

    if (response.ok) {
      console.log('\n✅ SUCCESS! Admin account created successfully!');
      console.log('\n📋 Login Credentials:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Email:    ${adminCredentials.email}`);
      console.log(`Password: ${adminCredentials.password}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`\n🏦 Account Number: ${data.accountNumber}`);
      console.log('\n🔐 You can now log in at: http://localhost:3000/login');
      console.log('   You will be redirected to: http://localhost:3000/admin');
      console.log('\n⚠️  IMPORTANT: Disable the admin signup endpoint now!');
      console.log('   Edit: app/api/auth/signup-admin/route.ts');
      console.log('   Change: ALLOW_ADMIN_SIGNUP = false');
    } else {
      console.error('\n❌ ERROR:', data.error);

      if (data.error.includes('already exists')) {
        console.log('\n💡 Admin account may already exist. Try logging in with:');
        console.log(`   Email: ${adminCredentials.email}`);
        console.log(`   Password: ${adminCredentials.password}`);
      }
    }
  } catch (error) {
    console.error('\n❌ Failed to create admin account:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   1. Your dev server is running (npm run dev)');
    console.log('   2. The server is accessible at http://localhost:3000');
    console.log('\n📝 Or create manually using these credentials:');
    console.log('   Email:    ' + adminCredentials.email);
    console.log('   Password: ' + adminCredentials.password);
  }
}

createAdmin();
