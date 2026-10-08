const Roles = require('../models/roles');
const mongoose = require('mongoose');

let setupComplete = false;

/**
 * Auto-setup middleware for Vercel deployment
 * Runs database migrations and seeding on first request
 * This replaces the prestart migrate script which doesn't work on serverless
 */
async function autoSetup(req, res, next) {
  if (setupComplete) {
    return next();
  }

  try {
    console.log('[Auto-Setup] Initializing database...');

    // Ensure database is connected
    if (mongoose.connection.readyState !== 1) {
      console.log('[Auto-Setup] Waiting for database connection...');
      await new Promise((resolve, reject) => {
        if (mongoose.connection.readyState === 1) {
          resolve();
        } else {
          const timeout = setTimeout(() => {
            reject(new Error('Database connection timeout'));
          }, 10000);

          mongoose.connection.once('connected', () => {
            clearTimeout(timeout);
            resolve();
          });
        }
      });
    }

    // Migration 1: Seed roles (from migrations/1457249988959-add-roles.js)
    const roleCount = await Roles.countDocuments();
    if (roleCount === 0) {
      console.log('[Auto-Setup] Seeding roles...');
      const titles = Object.keys(Roles.ACCESS_LEVEL);
      const tasks = titles.map((title) => {
        const update = {
          title: title,
          accessLevel: Roles.ACCESS_LEVEL[title],
        };
        return Roles.findOneAndUpdate({ title: title }, update, { upsert: true });
      });
      await Promise.all(tasks);
      console.log('[Auto-Setup] Roles seeded:', titles);
    } else {
      console.log('[Auto-Setup] Roles already exist, skipping seed');
    }

    // Add future migrations here
    // Migration 2: ...
    // Migration 3: ...

    setupComplete = true;
    console.log('[Auto-Setup] Database initialization complete');
  } catch (error) {
    console.error('[Auto-Setup] Error:', error);
    // Don't block the request if setup fails
    // The app can still function, just without seeded data
  }

  next();
}

module.exports = autoSetup;
