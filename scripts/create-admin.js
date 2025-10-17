// Script to create admin user with hashed password
// Usage: node scripts/create-admin.js

const bcrypt = require('bcryptjs');

async function createAdminPassword() {
  // Your desired admin password
  const plainPassword = '654321'; // Change this to your desired password

  // Hash with 12 rounds (same as in signup)
  const hashedPassword = await bcrypt.hash(plainPassword, 12);

  console.log('\n=== Admin User Setup ===\n');
  console.log('Email: vinay.qss@gmail.com');
  console.log('Plain Password:', plainPassword);
  console.log('\nHashed Password (copy this to MongoDB):');
  console.log(hashedPassword);
  console.log('\n=== MongoDB Update Command ===\n');
  console.log('Run this in MongoDB shell or Compass:\n');
  console.log(`db.users.updateOne(
  { email: "vinay.qss@gmail.com" },
  {
    $set: {
      password: "${hashedPassword}",
      isEmailVerified: true,
      role: "ADMIN",
      permissions: []
    }
  }
)`);
  console.log('\n=== Or use this mongosh command ===\n');
  console.log(`mongosh "mongodb+srv://your-connection-string" --eval 'db.users.updateOne({email:"vinay.qss@gmail.com"},{$set:{password:"${hashedPassword}",isEmailVerified:true,role:"ADMIN"}})'`);
}

createAdminPassword().catch(console.error);
