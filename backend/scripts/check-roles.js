#!/usr/bin/env node
/**
 * Script to check if roles exist in the database
 * Usage: node backend/scripts/check-roles.js
 */

require('dotenv').config({ path: require('node:path').join(__dirname, '../.env') });
const mongoose = require('../server/config/db');
const Role = require('../server/models/roles');

async function checkRoles() {
  try {
    console.log('Connecting to MongoDB...');
    console.log('MongoDB URL:', process.env.MONGODB_URL);

    // Wait for connection
    await new Promise((resolve) => {
      if (mongoose.connection.readyState === 1) {
        resolve();
      } else {
        mongoose.connection.once('open', resolve);
      }
    });

    console.log('Connected to MongoDB');

    // Fetch all roles
    const roles = await Role.find().exec();

    console.log('\n=== Roles in Database ===');
    console.log('Total roles:', roles.length);

    if (roles.length === 0) {
      console.log('\n⚠️  WARNING: No roles found in database!');
      console.log('Run migrations to seed roles: pnpm --filter backend migrate');
    } else {
      console.log('\nRoles:');
      for (const role of roles) {
        console.log(`  - ${role.title} (accessLevel: ${role.accessLevel}, _id: ${role._id})`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkRoles();
