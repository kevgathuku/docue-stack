#!/usr/bin/env node

/**
 * Update User Role Script
 *
 * Usage:
 *   node scripts/update-user-role.js <email> <role>
 *
 * Examples:
 *   node scripts/update-user-role.js user@example.com admin
 *   node scripts/update-user-role.js user@example.com staff
 *   node scripts/update-user-role.js user@example.com viewer
 */

require('dotenv').config();
const mongoose = require('../server/config/db');
const User = require('../server/models/users');
const Role = require('../server/models/roles');

// Get command line arguments
const email = process.argv[2];
const roleName = process.argv[3];

// Validate arguments
if (!email || !roleName) {
  console.error('❌ Error: Missing required arguments');
  console.log('\nUsage: node scripts/update-user-role.js <email> <role>');
  console.log('\nAvailable roles: viewer, staff, admin');
  console.log('\nExamples:');
  console.log('  node scripts/update-user-role.js user@example.com admin');
  console.log('  node scripts/update-user-role.js user@example.com staff');
  process.exit(1);
}

// Validate role name
const validRoles = ['viewer', 'staff', 'admin'];
if (!validRoles.includes(roleName.toLowerCase())) {
  console.error(`❌ Error: Invalid role "${roleName}"`);
  console.log(`\nAvailable roles: ${validRoles.join(', ')}`);
  process.exit(1);
}

async function updateUserRole() {
  try {
    // Wait for database connection
    await new Promise((resolve) => {
      if (mongoose.connection.readyState === 1) {
        resolve();
      } else {
        mongoose.connection.once('open', resolve);
      }
    });

    console.log(`\n🔍 Looking for user: ${email}`);

    // Find the user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.error(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log(`✓ Found user: ${user.name.first} ${user.name.last} (${user.email})`);

    // Find the role by title
    const role = await Role.findOne({ title: roleName.toLowerCase() });

    if (!role) {
      console.error(`❌ Role not found: ${roleName}`);
      console.log('\nAvailable roles in database:');
      const allRoles = await Role.find({});
      allRoles.forEach((r) => console.log(`  - ${r.title} (accessLevel: ${r.accessLevel})`));
      process.exit(1);
    }

    console.log(`✓ Found role: ${role.title} (accessLevel: ${role.accessLevel})`);

    // Get current role info if exists
    if (user.role) {
      const currentRole = await Role.findById(user.role);
      if (currentRole) {
        console.log(
          `\n📝 Current role: ${currentRole.title} (accessLevel: ${currentRole.accessLevel})`
        );
      }
    } else {
      console.log('\n📝 Current role: none');
    }

    // Update the user's role
    user.role = role._id;
    await user.save();

    console.log(
      `✅ Successfully updated role to: ${role.title} (accessLevel: ${role.accessLevel})`
    );
    console.log(`\n✓ User ${user.email} now has ${role.title} permissions\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error updating user role:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the update
updateUserRole();
