#!/usr/bin/env node
'use strict';

/**
 * List Users Script
 * Shows all users in the database with their roles
 */

require('dotenv').config();
const mongoose = require('../server/config/db');
const User = require('../server/models/users');
const Role = require('../server/models/roles');

async function listUsers() {
  try {
    // Wait for database connection
    await new Promise((resolve) => {
      if (mongoose.connection.readyState === 1) {
        resolve();
      } else {
        mongoose.connection.once('open', resolve);
      }
    });

    console.log('\n📋 Users in database:\n');
    
    const users = await User.find({}).populate('role');
    
    if (users.length === 0) {
      console.log('No users found in database.\n');
      process.exit(0);
    }

    for (const user of users) {
      const roleName = user.role ? user.role.title : 'none';
      const accessLevel = user.role ? user.role.accessLevel : 'N/A';
      console.log(`  ${user.email}`);
      console.log(`    Name: ${user.name.first} ${user.name.last}`);
      console.log(`    Role: ${roleName} (accessLevel: ${accessLevel})`);
      console.log(`    Logged In: ${user.loggedIn}`);
      console.log('');
    }
    
    console.log(`Total users: ${users.length}\n`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error listing users:', error.message);
    process.exit(1);
  }
}

listUsers();
